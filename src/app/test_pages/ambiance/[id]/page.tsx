import { redirect, notFound } from "next/navigation";
import styles from "./page.module.css";
import AmbianceMaker from "@/app/components/Ambiance Maker/ambianceMaker";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";
import NotFound from "@/app/components/Errors/Not Found/notFound";

// Dev user ID - used consistently across development
const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getDraft(
  ambianceId: string,
  userId: string | undefined,
): Promise<AmbianceData | null> {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());

  const { data: ambiance, error } = await supabase
    .from("ambiances")
    .select("id, title, description, video_data, user_id, status")
    .eq("id", ambianceId)
    .single();

  if (error || !ambiance || ambiance.status !== "published") {
    return null;
  }
  // Transform video_data from stored format to VideoData[]
  const videoData = (ambiance.video_data as any[]).map((v: any) => ({
    src: v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : "",
    startTime: v.startTime,
    endTime: v.endTime,
    volume: v.volume,
    playbackSpeed: v.playbackSpeed,
    loopDelay: v.loopDelay,
  }));

  return {
    id: ambiance.id,
    title: ambiance.title,
    description: ambiance.description,
    videoData,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const isDev = process.env.NODE_ENV === "development";
  const cookieStore = cookies();
  const supabase = isDev ? createAdminClient() : createClient(cookieStore);

  // Get authenticated user
  const {
    data: { user },
  } = isDev
    ? { data: { user: { id: DEV_USER_ID } } }
    : await supabase.auth.getUser();

  const ambianceData = await getDraft(
    id,
    user && user.id ? user.id : undefined,
  );

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {ambianceData ? (
          <AmbianceMaker
            mode="published"
            ambianceData={ambianceData}
            user={user}
          />
        ) : (
          <NotFound
            errorMessage="Ambiance not found"
            buttonText="Go Back"
            href="/test_pages"
          />
        )}
      </div>
    </div>
  );
}
