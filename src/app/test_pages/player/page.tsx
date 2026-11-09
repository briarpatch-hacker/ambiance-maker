"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Player from "@/app/components/Ambiance Player/ambiancePlayer";
import AmbiancePlayer from "@/app/components/Ambiance Player/ambiancePlayer";
import { VideoData } from "@/app/components/Ambiance Player/ambiancePlayer";
import { updateObjectsArr } from "@/app/lib/setStateFunctions";
import { update } from "lodash";

const videos: VideoData[] = [
  {
    src: `https://www.youtube.com/embed/eSNqzTwHiuU`,
    startTime: 120,
    endTime: 160,
    volume: 50,
  }, // Old IBM computer sounds
  {
    src: `https://www.youtube.com/watch?v=50lRiQ9NpZo`, // Rain on an old window
    startTime: 24,
    endTime: 56,
    volume: 25,
  },
  {
    src: `https://www.youtube.com/watch?v=KwGNDJfSmFk`,
    playbackSpeed: 2,
    startTime: 6,
    endTime: 18,
  }, // Echoing Clock Tick,
  {
    src: `https://www.youtube.com/shorts/lBq7IZ7tZR8`, // a short of a fireplace crackling
  },
  {
    src: `https://www.youtube.com/watch?v=aG7Ig-HbyVk`, // A video that cannot be imbedded
  },
  {
    src: `https://www.youtube.com/watch?v=invalidVid`, // a 404
  },
];
const maxVideos = 6;
const createVideoEntry = (): VideoData => ({
  src: undefined,
  linkError: undefined,
  title: undefined,
  duration: undefined,
  startTime: undefined,
  endTime: undefined,
  volume: undefined,
  playbackSpeed: undefined,
});

export default function Page() {
  const [videoData, setVideoData] = useState<VideoData[]>(
    Array.from({ length: maxVideos }, createVideoEntry),
  );
  useEffect(() => {
    updateObjectsArr(
      setVideoData,
      videos.map((video, i) => {
        return { index: i, updates: video };
      }),
    );
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <AmbiancePlayer videoData={videoData} setVideoData={setVideoData} />
      </div>
    </div>
  );
}
