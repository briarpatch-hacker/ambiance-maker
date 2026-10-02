import styles from "./page.module.css";
import Review from "@/app/components/Admin/Review Ambiance/review";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import NotFound from "@/app/components/Errors/Not Found/notFound";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SubmissionData {
  ambianceData: AmbianceData;
  categoryId: number;
}

async function getSubmission(
  ambianceId: string,
): Promise<SubmissionData | null> {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());

  const { data: ambiance, error } = await supabase
    .from("ambiances")
    .select(
      "id, title, description, video_data, category_id, user_id, status, users:user_id(username, account_status)",
    )
    .eq("id", ambianceId)
    .eq("status", "submitted")
    .single();

  if (error || !ambiance) {
    return null;
  }

  // users comes back as an object from a single foreign-key join
  const userProfile = ambiance.users as unknown as {
    username: string;
    account_status: string;
  };

  if (!userProfile || userProfile.account_status !== "good") {
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
    ambianceData: {
      id: ambiance.id,
      title: ambiance.title,
      description: ambiance.description,
      author: userProfile.username,
      videoData,
    },
    categoryId: ambiance.category_id,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const submission = await getSubmission(id);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {submission ? (
          <Review
            ambianceData={submission.ambianceData}
            categoryId={submission.categoryId}
          />
        ) : (
          <NotFound
            errorMessage="Submission not found"
            buttonText="Go Back"
            href="/test_pages/admin"
          />
        )}
      </div>
    </div>
  );
}
