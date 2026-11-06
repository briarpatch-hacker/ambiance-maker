import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { resolveViewerKey } from "@/app/lib/analytics/viewerKey";
import { cookies, headers } from "next/headers";
import AmbianceClient from "./client";
import { categoryById } from "@/app/lib/categories";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getAmbiance = cache(
  async (
    ambianceId: string,
  ): Promise<
    | {
        ambianceData: AmbianceData;
      }
    | undefined
  > => {
    const isDev = process.env.NODE_ENV === "development";
    const supabase = isDev ? createAdminClient() : createClient(cookies());

    // Gets the ambiance data
    const { data: ambiance, error } = await supabase
      .from("ambiances")
      .select(
        "id, user_id, title, status, description, video_data, category_id, user_id, published_at, views, rating_score, rating_count",
      )
      .eq("id", ambianceId)
      .single();
    if (error || !ambiance || ambiance.status !== "published") {
      return undefined;
    }
    // Gets the username
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("username")
      .eq("id", ambiance.user_id)
      .single();
    if (error || !user) {
      return undefined;
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
        author: user.username,
        description: ambiance.description,
        views: ambiance.views,
        datePublished: ambiance.published_at,
        ratingTotal: ambiance.rating_score ?? undefined,
        ratingCount: ambiance.rating_count,
        category: categoryById[ambiance.category_id] ?? undefined,
        videoData: videoData,
      },
    };
  },
);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getAmbiance(id);
  if (!result) return {};
  const { ambianceData } = result;
  const title = ambianceData.author
    ? `${ambianceData.title} | ${ambianceData.author}`
    : (ambianceData.title ?? "Ambiance Maker");
  const description = ambianceData.description
    ? ambianceData.description.slice(0, 200)
    : ambianceData.category
      ? `An ambiance by ${ambianceData.author} in ${ambianceData.category.name} on Ambiance Maker.`
      : `An ambiance by ${ambianceData.author} on Ambiance Maker.`;
  return {
    title: { absolute: title },
    description,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const ambianceResult = await getAmbiance(id);
  if (!ambianceResult) notFound();

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const sessionId = cookieStore.get("sessionId")?.value;
  const today = new Date().toISOString().slice(0, 10);

  // Fire-and-forget: the view is recorded without delaying the response
  (async () => {
    try {
      const viewerKey = await resolveViewerKey(sessionId, headerStore);
      await createAdminClient().rpc("record_ambiance_view", {
        p_ambiance_id: id,
        p_viewer_key: viewerKey,
        p_date: today,
      });
    } catch {}
  })();

  return <AmbianceClient ambianceData={ambianceResult.ambianceData} />;
}
