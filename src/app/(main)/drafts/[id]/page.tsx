import type { Metadata } from "next";
import { cache } from "react";
import AmbianceMaker from "@/app/components/Ambiance Maker/ambianceMaker";
import styles from "./page.module.css";
import { redirect, notFound } from "next/navigation";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { cookies } from "next/headers";
import { getUserId } from "@/app/lib/auth/getCurrentUser";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getDraft = cache(async (
  ambianceId: string,
  userId: string,
): Promise<{
  ambianceData: AmbianceData;
  status: "draft" | "submitted";
} | null> => {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = isDev ? createAdminClient() : createClient(cookies());

  const { data: ambiance, error } = await supabase
    .from("ambiances")
    .select("id, title, description, video_data, user_id, status")
    .eq("id", ambianceId)
    .single();
  if (error || !ambiance) {
    return null;
  }
  if (ambiance.user_id !== userId) {
    return null;
  }
  // If published, redirect to the page
  if (ambiance.status === "published") {
    redirect(`/ambiance/${ambianceId}`);
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
      videoData,
    },
    status: ambiance.status as "draft" | "submitted",
  };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return {};
  const draft = await getDraft(id, userId);
  if (!draft) return {};
  return {
    title: { absolute: `${draft.ambianceData.title} | Drafts` },
    robots: { index: false },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) {
    redirect("/login");
  }
  const draft = await getDraft(id, userId);

  if (!draft) notFound();

  return (
    <div className={styles.drafts}>
      <div className={styles.ambiance_maker_wrapper}>
        <AmbianceMaker
          mode="draft"
          ambianceData={draft.ambianceData}
          user={true}
          status={draft.status}
        />
      </div>
    </div>
  );
}
