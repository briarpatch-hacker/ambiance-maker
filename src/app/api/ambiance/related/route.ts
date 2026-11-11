import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { relatedAmbiances } from "@/app/lib/search";

const MAX_RESULTS = 6;
const CACHE_MS = 60 * 1000;

interface AmbianceRow {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  views: number;
  published_at: string | null;
  rating_count: number;
  rating_score: number | null;
  category_id: number;
  users: { username: string } | null;
}

// Shared by every request, so page views don't each reload the whole published list
let cache: { rows: AmbianceRow[]; expires: number } | null = null;

async function getPublishedAmbiances(): Promise<AmbianceRow[]> {
  if (cache && cache.expires > Date.now()) return cache.rows;

  // Newest first, so equally ranked results with equal views favor recent ones
  const { data, error } = await createAdminClient()
    .from("ambiances")
    .select(
      "id, title, description, thumbnail, views, published_at, rating_count, rating_score, category_id, users!user_id(username)",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as AmbianceRow[];
  cache = { rows, expires: Date.now() + CACHE_MS };
  return rows;
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ items: [] });

    const rows = await getPublishedAmbiances();
    const current = rows.find((row) => row.id === id);
    if (!current) return NextResponse.json({ items: [] });

    const items = relatedAmbiances(current, rows, MAX_RESULTS).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      views: row.views,
      datePublished: row.published_at,
      ratingTotal: row.rating_score ?? undefined,
      ratingCount: row.rating_count,
      author: row.users?.username,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Related ambiances route error:", err);
    return NextResponse.json(
      { errors: "Couldn't complete the request" },
      { status: 500 },
    );
  }
}
