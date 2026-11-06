import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { resolveViewerKey } from "@/app/lib/analytics/viewerKey";
import { createHash } from "crypto";

// Adding a page here is all that's needed to start tracking it (see migration 007)
const VALID_PAGES = ["home", "create", "share", "categories", "ambiance"] as const;
const MAX_SHARE_PARAMS_LENGTH = 600;
// YouTube IDs in share params are encoded as id{11-char-id}
const YOUTUBE_ID_RE = /id([\.\w-]{11})/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const page: string = body?.page;

    if (!VALID_PAGES.includes(page as (typeof VALID_PAGES)[number])) {
      return NextResponse.json({}, { status: 400 });
    }

    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    const viewerKey = await resolveViewerKey(
      req.cookies.get("sessionId")?.value,
      req.headers,
    );

    // Supabase builders are lazy: the request is only sent when awaited,
    // so every RPC below must be awaited (never `void`ed).
    const writes: PromiseLike<unknown>[] = [
      supabase.rpc("record_page_view", {
        p_page: page,
        p_viewer_key: viewerKey,
        p_date: today,
      }),
    ];

    // Track individual share links when the page is "share"
    if (page === "share") {
      const shareParams: unknown = body?.shareParams;
      if (
        typeof shareParams === "string" &&
        shareParams.length > 0 &&
        shareParams.length <= MAX_SHARE_PARAMS_LENGTH &&
        YOUTUBE_ID_RE.test(shareParams)
      ) {
        // Canonicalise params by sorting keys so param order doesn't affect the hash
        const sorted = new URLSearchParams(
          [...new URLSearchParams(shareParams).entries()].sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        ).toString();
        const hash = createHash("sha256").update(sorted).digest("hex");
        const url = `/share?${shareParams}`;
        writes.push(
          supabase.rpc("track_share_link", { p_hash: hash, p_url: url }),
        );
      }
    }

    await Promise.all(writes);

    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}
