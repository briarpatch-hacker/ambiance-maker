import { createHash } from "crypto";
import { createAdminClient } from "@/app/lib/supabase/admin";

// Works with both NextRequest.headers and next/headers' headers()
interface HeaderGetter {
  get(name: string): string | null;
}

/**
 * Resolves a stable viewer identity for analytics deduplication.
 * Prefers the authenticated user id (via the sessionId cookie); otherwise
 * falls back to a hash of IP + user agent so no raw PII is stored.
 */
export async function resolveViewerKey(
  sessionId: string | undefined,
  headers: HeaderGetter,
): Promise<string> {
  if (sessionId) {
    const { data } = await createAdminClient()
      .from("sessions")
      .select("user_id")
      .eq("session_id", sessionId)
      .single();
    const userId = (data as { user_id?: string } | null)?.user_id;
    if (userId) return `user:${userId}`;
  }

  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = headers.get("user-agent") ?? "unknown";
  return `anon:${createHash("sha256").update(`${ip}:${ua}`).digest("hex")}`;
}
