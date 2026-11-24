import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Bumps sessions.last_active at most once per UTC calendar day.
 * The nightly snapshot (snapshot_daily_metrics) buckets by calendar day, so
 * throttling on a rolling 24h would skip days where visits are < 24h apart.
 */
function touchSession(sessionId: string, lastActive: string) {
  const today = new Date().toISOString().slice(0, 10);
  const lastActiveDay = new Date(lastActive).toISOString().slice(0, 10);
  if (lastActiveDay === today) return;
  createAdminClient()
    .from("sessions")
    .update({ last_active: new Date().toISOString() })
    .eq("session_id", sessionId)
    .then(() => {});
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    if (!sessionId) return null;

    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id, last_active")
      .eq("session_id", sessionId)
      .single();

    if (sessionError || !session) return null;

    touchSession(sessionId, session.last_active);

    const { data: user, error } = await supabase
      .from("users")
      .select("username, avatar")
      .eq("id", session.user_id)
      .single();

    if (error || !user) return null;

    return {
      username: user.username,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;
    if (!sessionId) return null;

    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());
    const { data: session, error } = await supabase
      .from("sessions")
      .select("user_id, last_active")
      .eq("session_id", sessionId)
      .single();

    if (error || !session) return null;

    touchSession(sessionId, session.last_active);

    return session.user_id;
  } catch {
    return null;
  }
}
