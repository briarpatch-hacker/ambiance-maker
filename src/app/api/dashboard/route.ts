import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";

const DASHBOARD_LIMIT = 8;

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());

    // --- User's recent drafts (requires auth) ---
    let drafts: {
      id: string;
      title: string;
      thumbnail: string;
      updated_at: string;
    }[] = [];

    if (sessionId) {
      const { data: session } = await supabase
        .from("sessions")
        .select("user_id")
        .eq("session_id", sessionId)
        .single();

      if (session?.user_id) {
        const { data: draftData } = await supabase
          .from("ambiances")
          .select("id, title, thumbnail, updated_at")
          .eq("user_id", session.user_id)
          .in("status", ["draft", "submitted"])
          .order("updated_at", { ascending: false })
          .limit(DASHBOARD_LIMIT);

        drafts = draftData ?? [];
      }
    }

    // --- Recent public ambiances (no auth needed) ---
    const adminSupabase = createAdminClient();
    const { data: recentData } = await adminSupabase
      .from("ambiances")
      .select("id, title, thumbnail, views, published_at, rating_score, rating_count, users!user_id(username)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(DASHBOARD_LIMIT);

    const recentAmbiances = (recentData ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      views: item.views,
      published_at: item.published_at,
      author: item.users?.username ?? undefined,
      ratingTotal: item.rating_score ?? undefined,
      ratingCount: item.rating_count ?? undefined,
    }));

    return NextResponse.json({ drafts, recentAmbiances });
  } catch {
    return NextResponse.json(
      { errors: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
