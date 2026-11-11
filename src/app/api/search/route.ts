import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { searchAmbiances, MAX_QUERY_LENGTH } from "@/app/lib/search";

const MAX_RESULTS = 24;

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

export async function GET(req: NextRequest) {
  try {
    const query = (req.nextUrl.searchParams.get("q") ?? "")
      .trim()
      .slice(0, MAX_QUERY_LENGTH);
    if (!query) return NextResponse.json({ items: [] });

    // Newest first, so equally ranked results with equal views favor recent ones
    const { data, error } = await createAdminClient()
      .from("ambiances")
      .select(
        "id, title, description, thumbnail, views, published_at, rating_count, rating_score, category_id, users!user_id(username)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Search query error:", error);
      return NextResponse.json(
        { errors: "Couldn't complete the request" },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as unknown as AmbianceRow[];
    const items = searchAmbiances(query, rows, MAX_RESULTS).map((row) => ({
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
    console.error("Search route error:", err);
    return NextResponse.json(
      { errors: "Couldn't complete the request" },
      { status: 500 },
    );
  }
}
