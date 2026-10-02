"use client";
import AmbianceMaker, {
  VideoData,
  createVideoEntry,
} from "@/app/components/Ambiance Maker/ambianceMaker";
import { useUser } from "@/app/contexts/userContext";
import { useCallback, useEffect } from "react";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function Page() {
  // Updates the page view counter
  useEffect(() => {
    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: "share", shareParams: searchParams.toString() }),
    }).catch(() => {});
  }, []);

  const user = useUser();
  const searchParams = useSearchParams();
  const decodeLink = useCallback(
    (searchParams: ReadonlyURLSearchParams): VideoData[] => {
      const videoData = Array.from({ length: 6 }, createVideoEntry);
      for (let i = 0; i < 6; i++) {
        let videoLink = searchParams.get(`v${i + 1}`);
        if (!videoLink) continue;
        const start = Number(videoLink.match(/s(\d+)/)?.[1] ?? undefined);
        const end = Number(videoLink.match(/e(\d+)/)?.[1] ?? undefined);
        const volume = Number(videoLink.match(/v(\d+)/)?.[1] ?? undefined);
        const rate = Number(videoLink.match(/r(\d+)/)?.[1] ?? undefined);
        const delay = Number(videoLink.match(/d(\d+)(?=id)/)?.[1] ?? undefined);
        const id = videoLink.match(/id([\w-]+)/)?.[1];
        if (!id) continue;
        videoData[i].startTime = start;
        videoData[i].endTime = end;
        videoData[i].volume = volume;
        videoData[i].playbackSpeed = rate ? rate / 100 : undefined;
        videoData[i].loopDelay = delay || undefined;
        videoData[i].src = `https://www.youtube.com/watch?v=${id}`;
      }
      return videoData;
    },
    [],
  );

  return (
    <div className={styles.create}>
      <div className={styles.ambiance_maker_wrapper}>
        <AmbianceMaker
          user={user}
          mode="shared"
          ambianceData={{ videoData: decodeLink(searchParams) }}
        />
      </div>
    </div>
  );
}
