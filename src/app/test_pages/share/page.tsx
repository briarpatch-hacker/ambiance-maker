"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { useCallback } from "react";
import AmbianceMaker, {
  VideoData,
  createVideoEntry,
} from "@/app/components/Ambiance Maker/ambianceMaker";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

export default function Page() {
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
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <AmbianceMaker mode="shared" ambianceData={{ videoData: decodeLink(searchParams) }} />
      </div>
    </div>
  );
}
