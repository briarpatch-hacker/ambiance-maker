import type { Metadata } from "next";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FavoritesContent from "./client";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false },
};

async function getFavorites() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) redirect("/login");

  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("session_id", sessionId)
    .single();

  if (sessionError || !session?.user_id) redirect("/login");

  // Step 1: get favorited ambiance IDs in newest-first order
  const { data: favRows, error: favError } = await supabase
    .from("ambiance_favorites")
    .select("ambiance_id")
    .eq("user_id", session.user_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (favError) return null;
  if (!favRows || favRows.length === 0) return [];

  const ids = (favRows as any[]).map((f) => f.ambiance_id);

  // Step 2: fetch full ambiance data with explicit FK hint to avoid join ambiguity
  const { data: ambiancesData, error: ambiancesError } = await supabase
    .from("ambiances")
    .select(
      "id, title, thumbnail, views, rating_sum, rating_count, published_at, description, users!user_id(username)",
    )
    .in("id", ids)
    .eq("status", "published");

  if (ambiancesError) return null;

  // Re-sort to restore the original favorites order (newest favorited first)
  const ambiancesMap = new Map(
    (ambiancesData ?? []).map((a: any) => [a.id, a]),
  );
  return ids.map((id: string) => ambiancesMap.get(id)).filter(Boolean);
}

export default async function Page() {
  const favoritesData = await getFavorites();
  if (favoritesData === null) return <FavoritesContent favorites={null} />;

  const favorites: AmbianceData[] = (favoritesData as any[]).map((a) => ({
    id: a.id,
    title: a.title,
    thumbnail: a.thumbnail,
    views: a.views,
    author: a.users?.username,
    ratingTotal:
      a.rating_count >= 8 ? a.rating_sum / a.rating_count : undefined,
    ratingCount: a.rating_count,
    datePublished: a.published_at ? new Date(a.published_at) : undefined,
    description: a.description,
    videoData: [],
  }));

  return <FavoritesContent favorites={favorites} />;
}
