import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_SORT = "newest";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("session_id", sessionId)
      .single();

    if (sessionError || !session?.user_id) {
      return NextResponse.json({ errors: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    let page = Number(searchParams.get("page")) || 1;
    let sort = searchParams.get("sort") || DEFAULT_SORT;
    let pageSize = Number(searchParams.get("page_size")) || DEFAULT_PAGE_SIZE;
    if (pageSize < 12) pageSize = 12;
    else if (pageSize > 48) pageSize = 48;

    // Determine sort column and direction
    let sortColumn = "published_at";
    let ascending = false;
    switch (sort) {
      case "oldest":
        sortColumn = "published_at";
        ascending = true;
        break;
      case "popular":
        sortColumn = "views";
        ascending = false;
        break;
      case "best":
        sortColumn = "rating_score";
        ascending = false;
        break;
      default:
        sort = "newest";
        sortColumn = "published_at";
        ascending = false;
    }

    // Get total count
    const { count } = await supabase
      .from("ambiances")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user_id)
      .eq("status", "published");

    const totalCount = count ?? 0;
    const numPages = Math.max(Math.ceil(totalCount / pageSize), 1);

    if (page > numPages) page = numPages;
    else if (page < 1) page = 1;

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("ambiances")
      .select("id, title, thumbnail, views, status, published_at, rating_score, rating_count")
      .eq("user_id", session.user_id)
      .eq("status", "published");

    // "best" uses Bayesian score DESC (NULL for count < 8 → NULLS LAST), then count as tiebreaker
    if (sort === "best") {
      query = query
        .order("rating_score", { ascending: false, nullsFirst: false })
        .order("rating_count", { ascending: false });
    } else {
      query = query.order(sortColumn, { ascending });
    }

    const { data: items, error: itemsError } = await query
      .range(offset, offset + pageSize - 1);

    if (itemsError) {
      return NextResponse.json({ errors: "Failed to fetch ambiances" });
    }

    const mappedItems = (items || []).map((entry) => ({
      id: entry.id,
      title: entry.title,
      status: entry.status,
      thumbnail: entry.thumbnail,
      views: entry.views,
      ratingTotal: entry.rating_score ?? undefined,
      ratingCount: entry.rating_count ?? undefined,
      datePublished: entry.published_at,
      videoData: [],
    }));

    return NextResponse.json({
      items: mappedItems,
      page,
      numPages,
      pageSize,
      sort,
    });
  } catch {
    return NextResponse.json({ errors: "Couldn't complete the request" });
  }
}
