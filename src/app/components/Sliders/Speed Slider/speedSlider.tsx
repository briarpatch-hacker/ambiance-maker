"use client";
import React from "react";
import styles from "./speedSlider.module.css";
import DiscreteSlider from "../Discrete Slider/discreteSlider";
import Speedometer from "@/app/components/Icons/speedometer";

interface SpeedSliderProps {
  onValueChange: (value: string, videoIndex?: number) => void;
  playbackSpeed?: number;
  videoIndex?: number;
  style?: React.CSSProperties;
}

const values: string[] = [];
for (let i = 25; i <= 200; i += 5) {
  values.push((i / 100).toFixed(2) + `x`);
}

export default function SpeedSlider({
  onValueChange,
  playbackSpeed,
  videoIndex,
  style,
}: SpeedSliderProps) {
  return (
    <div style={{ ...style }} className={styles.speed_slider}>
      <div className={styles.speedometer_wrapper}>
        <Speedometer
        />
      </div>
      <DiscreteSlider
        values={values}
        defaultValue="1.00x"
        currentValue={
          playbackSpeed
            ? `${Math.min(playbackSpeed, 2.0).toFixed(2)}x` // Highest is 2.0
            : undefined
        }
        onValueChange={onValueChange}
        ariaLabel={"Video speed slider"}
        videoIndex={videoIndex}
      />
    </div>
  );
}
