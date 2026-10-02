"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { useState } from "react";
import AmbianceInput from "@/app/components/Ambiance Input/ambianceInput";

export default function Page() {
  function onLinkChange(link: string) {}

  function onTimeframeChange(start: number, end: number) {}

  function onVolumeChange(volume: string) {}

  function onSpeedChange(speed: string) {}

  function onDelayChange(delay: number) {}

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <AmbianceInput
          videoTitle={undefined}
          linkError="This video cannot be embedded"
          videoDuration={undefined}
          onLinkChange={onLinkChange}
          onTimeframeChange={onTimeframeChange}
          onVolumeChange={onVolumeChange}
          onSpeedChange={onSpeedChange}
          onDelayChange={onDelayChange}
        />
        <AmbianceInput
          videoTitle="Calm waves"
          linkError={undefined}
          videoDuration={56543}
          onLinkChange={onLinkChange}
          onTimeframeChange={onTimeframeChange}
          onVolumeChange={onVolumeChange}
          onSpeedChange={onSpeedChange}
          onDelayChange={onDelayChange}
        />
      </div>
    </div>
  );
}
