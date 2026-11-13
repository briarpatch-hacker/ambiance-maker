"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import type { Metadata } from "next";
import { useRef } from "react";
import { VideoData } from "@/app/components/Ambiance Player/ambiancePlayer";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import AmbianceCard from "@/app/components/Ambiance Card/ambianceCard";

const videoData: VideoData[] = [
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
    src: `https://www.youtube.com/shorts/lBq7IZ7tZR8`, // a short of a fireplace crackling
  },
  {
    src: `https://www.youtube.com/watch?v=KwGNDJfSmFk`,
    playbackSpeed: 2,
    startTime: 6,
    endTime: 18,
  }, // Echoing Clock Tick,
  {
    src: `https://www.youtube.com/watch?v=aG7Ig-HbyVk`, // A video that cannot be imbedded
  },
  {
    src: `https://www.youtube.com/watch?v=invalidVid`, // a 404
  },
];

const ambianceData1: AmbianceData = {
  id: "m5_Am93m5nu",
  title: "Relaxing Sounds - Fireplace Draft",
  author: "WinWonWanWunWhen",
  views: 543,
  ratingTotal: 4.7,
  ratingCount: 54,
  datePublished: new Date(),
  description:
    "This is a really good description for an ambiance. There's a clock ticking, a fire spitting, rain on the windows, and the gentle hum of an old 'puter. There's a lot more you could say about this, there really is. This is a really good description for an ambiance. There's a clock ticking, a fire spitting, rain on the windows, and the gentle hum of an old 'puter.",
  thumbnail: `https://img.youtube.com/vi/lBq7IZ7tZR8/mqdefault.jpg`,
  videoData: videoData,
};

const ambianceData2: AmbianceData = {
  id: "aGOITREm5493",
  title: "This Title is Way Too Long and That's the Point Dontcha Know It?",
  author: "Leonard",
  views: 7954,
  ratingTotal: 4.5,
  ratingCount: 545,
  datePublished: new Date(),
  description: "That title is just too long",
  thumbnail: `https://img.youtube.com/vi/invalidId/mqdefault.jpg`,
  videoData: videoData,
};

const ambianceData3: AmbianceData = {
  id: "mVdG4a5439",
  title: "Room with Clock Ticking",
  author: "AmbianceMaker",
  views: 96432,
  ratingTotal: 4.9,
  ratingCount: 542911,
  datePublished: new Date(),
  description: "Tick tock tick tock...",
  thumbnail: `https://img.youtube.com/vi/KwGNDJfSmFk/mqdefault.jpg`,
  videoData: videoData,
};

const ambianceData4: AmbianceData = {
  id: "ro45AMTREk4",
  title: "Rainy Day",
  author: "sarha20",
  views: 998432,
  ratingTotal: 4.3,
  ratingCount: 545,
  datePublished: new Date(),
  description: "This is a kind of somber ambaince",
  thumbnail: `https://img.youtube.com/vi/50lRiQ9NpZo/mqdefault.jpg`,
  videoData: videoData,
};

const ambiances = [
  ambianceData1,
  ambianceData2,
  ambianceData3,
  ambianceData4,
  ambianceData2,
  ambianceData4,
  ambianceData1,
  ambianceData3,
  ambianceData4,
  ambianceData1,
];

const draftData1: AmbianceData = {
  id: "m5_Am93m5nu",
  title: "Relaxing Sounds - Fireplace Draft",
  author: "shawn73",
  views: undefined,
  ratingTotal: undefined,
  ratingCount: undefined,
  datePublished: undefined,
  dateUpdated: new Date(),
  description:
    "This is a really good description for an ambiance. There's a clock ticking, a fire spitting, rain on the windows, and the gentle hum of an old 'puter. There's a lot more you could say about this, there really is. This is a really good description for an ambiance. There's a clock ticking, a fire spitting, rain on the windows, and the gentle hum of an old 'puter.",
  thumbnail: `https://img.youtube.com/vi/lBq7IZ7tZR8/mqdefault.jpg`,
  videoData: videoData,
};

const draftData2: AmbianceData = {
  id: "aGOITREm5493",
  title: "This Title is Way Too Long and That's the Point Dontcha Know It?",
  author: "Leonard",
  views: undefined,
  ratingTotal: undefined,
  ratingCount: undefined,
  datePublished: undefined,
  dateUpdated: new Date(),
  description: "That title is just too long",
  thumbnail: `https://img.youtube.com/vi/invalidId/mqdefault.jpg`,
  videoData: videoData,
};

const draftData3: AmbianceData = {
  id: "mVdG4a5439",
  title: "Room with Clock Ticking",
  author: "AmbianceMaker",
  views: undefined,
  ratingTotal: undefined,
  ratingCount: undefined,
  datePublished: undefined,
  dateUpdated: new Date(),
  description: "Tick tock tick tock...",
  thumbnail: `https://img.youtube.com/vi/KwGNDJfSmFk/mqdefault.jpg`,
  videoData: videoData,
};

const draftData4: AmbianceData = {
  id: "ro45AMTREk4",
  title: "Rainy Day",
  author: "sarha20",
  views: undefined,
  ratingTotal: undefined,
  ratingCount: undefined,
  datePublished: undefined,
  dateUpdated: new Date(),
  description: "This is a kind of somber ambaince",
  thumbnail: `https://img.youtube.com/vi/50lRiQ9NpZo/mqdefault.jpg`,
  videoData: videoData,
};

const drafts = [
  draftData4,
  draftData3,
  draftData2,
  draftData1,
  draftData2,
  draftData4,
  draftData1,
];

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.page} ref={containerRef}>
      <h2>{`Ambiances`}</h2>
      <div className={styles.container_wrapper}>
        <div className={styles.ambiances_container}>
          {ambiances.map((ambiance, index) => {
            return (
              <AmbianceCard
                id={ambiance.id || ``}
                title={ambiance.title || ``}
                thumbnail={ambiance.thumbnail || ``}
                linkTo={ambiance.datePublished ? "ambiance" : "draft"}
                containerRef={containerRef}
                views={ambiance.views}
                author={ambiance.author}
                ratingTotal={ambiance.ratingTotal}
                ratingCount={ambiance.ratingCount}
                datePublished={ambiance.datePublished}
                dateUpdated={ambiance.dateUpdated}
                description={ambiance.description}
                key={index}
              />
            );
          })}
        </div>
      </div>
      <h2>{`Drafts`}</h2>
      <div className={styles.container_wrapper}>
        <div className={styles.ambiances_container}>
          {drafts.map((draft, index) => {
            return (
              <AmbianceCard
                id={draft.id || ``}
                title={draft.title || ``}
                thumbnail={draft.thumbnail || ``}
                linkTo={draft.datePublished ? "ambiance" : "draft"}
                containerRef={containerRef}
                views={draft.views}
                author={draft.author}
                ratingTotal={draft.ratingTotal}
                ratingCount={draft.ratingCount}
                datePublished={draft.datePublished}
                dateUpdated={draft.dateUpdated}
                description={draft.description}
                key={index}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
