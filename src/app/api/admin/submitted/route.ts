import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { verifyAdmin } from "@/app/lib/auth/adminAuth";

// Returns paginated submitted ambiances from accounts with "good" status
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if ("error" in auth) return auth.error;

    const DEFAULT_PAGE_SIZE = 24;
    const DEFAULT_SORT = "oldest";

    const searchParams = req.nextUrl.searchParams;
    let page = Number(searchParams.get("page")) || 1;
    let sort = searchParams.get("sort") || DEFAULT_SORT;

    // Validate page size
    let pageSize = Number(searchParams.get("page_size")) || DEFAULT_PAGE_SIZE;
    if (pageSize < 12) pageSize = 12;
    else if (pageSize > 48) pageSize = 48;

    const supabase = createAdminClient();

    // Get total count (with same filters) so we can clamp page before fetching
    // The !inner join ensures we only get ambiances whose user exists in
    // public.users with account_status = 'good'
    const { count: totalCount, error: countError } = await supabase
      .from("ambiances")
      .select("id, users!inner(account_status)", {
        count: "exact",
        head: true,
      })
      .eq("status", "submitted")
      .eq("users.account_status", "good");

    if (countError) throw countError;

    const total = totalCount ?? 0;
    const numPages = Math.max(Math.ceil(total / pageSize), 1);

    // Clamp page to valid range
    if (page > numPages) page = numPages;
    if (page < 1) page = 1;

    // Fetch the paginated ambiances with the user's username
    let query = supabase
      .from("ambiances")
      .select(
        `
        id,
        title,
        description,
        thumbnail,
        views,
        rating_sum,
        rating_count,
        created_at,
        users!inner ( username, account_status )
      `,
      )
      .eq("status", "submitted")
      .eq("users.account_status", "good");

    // Apply sorting
    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "popular":
        query = query.order("views", { ascending: false });
        break;
      default:
        sort = "oldest";
        query = query.order("created_at", { ascending: true });
    }

    // Apply pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    // Map database rows to AmbianceCardProps shape
    const items = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      views: row.views,
      ratingTotal: row.rating_sum,
      ratingCount: row.rating_count,
      datePublished: row.created_at,
      author: row.users?.username ?? "Unknown",
    }));

    return NextResponse.json({
      items,
      page,
      numPages,
      pageSize,
      sort,
    });
  } catch (err) {
    console.error("Error fetching submitted ambiances:", err);
    return NextResponse.json({ errors: "Couldn't complete the request" });
  }
}
