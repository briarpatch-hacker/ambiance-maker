"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./volumeSlider.module.css";
import DiscreteSlider from "../Discrete Slider/discreteSlider";
import VolumeMuted from "@/app/components/Icons/volume_muted";
import VolumeMedium from "@/app/components/Icons/volume_medium";
import VolumeLow from "@/app/components/Icons/volume_low";
import VolumeHigh from "@/app/components/Icons/volume_high";

interface VolumeSliderProps {
  onValueChange: (value: string, videoIndex?: number) => void;
  currentVolume?: number;
  videoIndex?: number;
  style?: React.CSSProperties;
}

const values: string[] = [];
for (let i = 0; i <= 100; i += 1) {
  values.push(`${i.toString()}%`);
}

export default function VolumeSlider({
  onValueChange,
  currentVolume,
  videoIndex,
  style,
}: VolumeSliderProps) {
  const [volume, setVolume] = useState(100);
  const prevVolume = useRef(0);

  function onVolumeChange(value: string) {
    onValueChange(value, videoIndex);
    setVolume(parseInt(value));
  }

  function handleClick() {
    if (volume > 0) {
      prevVolume.current = volume;
      onValueChange("0", videoIndex);
    } else {
      onValueChange(
        `${prevVolume.current > 0 ? prevVolume.current : "100"}`,
        videoIndex,
      );
    }
  }

  useEffect(() => {
    if (currentVolume !== undefined && volume != currentVolume) {
      setVolume(currentVolume);
    }
  }, [currentVolume]);

  return (
    <div style={{ ...style }} className={styles.volume_slider}>
      <button
        className={styles.toggle_volume}
        onClick={handleClick}
        aria-label={volume > 0 ? "Mute video" : "Unmute video"}
        title={volume > 0 ? "Mute video" : "Unmute video"}
      >
        {volume === 0 && <VolumeMuted />}
        {volume > 0 && volume <= 33 && <VolumeLow />}
        {volume > 33 && volume <= 66 && <VolumeMedium />}
        {volume > 66 && <VolumeHigh />}
      </button>
      <DiscreteSlider
        values={values}
        defaultValue="100%"
        currentValue={`${currentVolume}%`}
        onValueChange={onVolumeChange}
        ariaLabel={"Volume slider"}
        videoIndex={videoIndex}
        editable
      />
    </div>
  );
}
