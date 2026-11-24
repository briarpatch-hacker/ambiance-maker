import Hero from "@/app/components/Hero/hero";
import AmbianceMaker from "@/app/components/Ambiance Maker/ambianceMaker";
import Dashboard from "@/app/components/Dashboard/dashboard";
import PageView from "@/app/components/Page View/pageView";
import styles from "./page.module.css";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";

const DASHBOARD_LIMIT = 12;

export default async function Page() {
  // Page views are tracked client-side (<PageView />) so link prefetches
  // and bot crawls of this server component don't inflate the count.
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    return (
      <div className={styles.homepage}>
        <PageView page="home" />
        <Hero />
        <div id="ambiance-maker" className={styles.ambiance_maker_wrapper}>
          <AmbianceMaker mode="create" user={null} />
        </div>
      </div>
    );
  }

  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());
  const adminSupabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("session_id", sessionId)
    .single();

  if (!session?.user_id) {
    return (
      <div className={styles.homepage}>
        <PageView page="home" />
        <Hero />
        <div id="ambiance-maker" className={styles.ambiance_maker_wrapper}>
          <AmbianceMaker mode="create" user={null} />
        </div>
      </div>
    );
  }

  const [userResult, draftsResult, recentResult] = await Promise.all([
    supabase
      .from("users")
      .select("username, avatar")
      .eq("id", session.user_id)
      .single(),
    supabase
      .from("ambiances")
      .select("id, title, thumbnail, updated_at")
      .eq("user_id", session.user_id)
      .in("status", ["draft", "submitted"])
      .order("updated_at", { ascending: false })
      .limit(DASHBOARD_LIMIT),
    adminSupabase
      .from("ambiances")
      .select("id, title, thumbnail, views, published_at, rating_score, rating_count, users!user_id(username)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(DASHBOARD_LIMIT),
  ]);

  const user = userResult.data
    ? { username: userResult.data.username, avatar: userResult.data.avatar }
    : null;

  if (!user) {
    return (
      <div className={styles.homepage}>
        <PageView page="home" />
        <Hero />
        <div className={styles.ambiance_maker_wrapper}>
          <AmbianceMaker mode="create" user={null} />
        </div>
      </div>
    );
  }

  const drafts = (draftsResult.data ?? []).map((d) => ({
    id: d.id as string,
    title: d.title as string,
    thumbnail: d.thumbnail as string,
    updated_at: d.updated_at as string,
  }));

  const recentAmbiances = (recentResult.data ?? []).map((item: any) => ({
    id: item.id as string,
    title: item.title as string,
    thumbnail: item.thumbnail as string,
    views: item.views as number,
    published_at: item.published_at as string,
    author: (item.users as any)?.username as string | undefined,
    ratingTotal: item.rating_score as number | undefined,
    ratingCount: item.rating_count as number | undefined,
  }));

  return (
    <div className={styles.homepage}>
      <PageView page="home" />
      {drafts.length === 0 && <Hero />}
      <Dashboard
        user={user}
        drafts={drafts}
        recentAmbiances={recentAmbiances}
      />
    </div>
  );
}
