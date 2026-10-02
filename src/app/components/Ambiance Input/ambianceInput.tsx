"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ambianceInput.module.css";
import classNames from "classnames";
import VideoSlider from "@/app/components/Sliders/Video Range Slider/videoRangeSlider";
import VolumeSlider from "@/app/components/Sliders/Volume Slider/volumeSlider";
import SpeedSlider from "@/app/components/Sliders/Speed Slider/speedSlider";
import { debounce } from "lodash";
import Play from "@/app/components/Icons/play";
import Pause from "@/app/components/Icons/pause";
import Rewind from "@/app/components/Icons/reset";
import Backwards from "@/app/components/Icons/backwards";

interface AmbianceInputProps {
  videoTitle: string | undefined;
  videoDuration: number | undefined;
  startTime?: number;
  endTime?: number;
  currentTime?: number;
  volume?: number;
  playbackSpeed?: number;
  loopDelay?: number;
  linkError: string | undefined;
  onLinkChange: (link: string, index?: number) => void;
  onVolumeChange: (volume: string, index?: number) => void;
  onSpeedChange: (speed: string, index?: number) => void;
  onTimeframeChange: (start: number, end: number, index?: number) => void;
  onDelayChange: (delay: number, index?: number) => void;
  videoIndex?: number;
  isIos?: boolean;
  isPlaying?: boolean;
  onPlayPause?: (index?: number) => void;
  onRewind?: (index?: number) => void;
  onJumpBack?: (index?: number) => void;
  onJumpForward?: (index?: number) => void;
  initialLink?: string;
  style?: React.CSSProperties;
}

export default function AmbianceInput({
  videoTitle,
  videoDuration,
  startTime,
  endTime,
  currentTime,
  volume,
  playbackSpeed,
  loopDelay,
  linkError,
  onLinkChange,
  onVolumeChange,
  onSpeedChange,
  onTimeframeChange,
  onDelayChange,
  videoIndex,
  isIos,
  isPlaying,
  onPlayPause,
  onRewind,
  onJumpBack,
  onJumpForward,
  initialLink,
  style,
}: AmbianceInputProps) {
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const [inputData, setInputData] = useState({
    link: initialLink ? initialLink : "",
  });
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setInputData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  // Uses onLinkChange to show a video once user stops typing
  const validateLink = useCallback(
    debounce((link: string) => {
      onLinkChange(link, videoIndex);
    }, 300),
    [],
  );

  useEffect(() => {
    validateLink(inputData.link);
  }, [inputData.link]);

  // Used to manage the delay input
  const delayInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingDelay, setIsEditingDelay] = useState(false);
  const [delayInSeconds, setDelayInSeconds] = useState("0");
  const applyDelay = useCallback(
    (value: number) => {
      const clamped = Math.min(99, Math.max(0, value));
      onDelayChange(clamped, videoIndex);
      setDelayInSeconds(String(clamped));
    },
    [onDelayChange, videoIndex],
  );

  return (
    <div
      style={{ ...style }}
      className={classNames(styles.ambiance_input, {
        [styles.video_found]: !!videoDuration,
      })}
    >
      <div className={styles.link_input_wrapper}>
        <input
          id={"link"}
          name={"link"}
          type={"text"}
          value={inputData.link}
          maxLength={64}
          onChange={handleChange}
          ref={linkInputRef}
          aria-describedby={"link_error"}
          placeholder="Enter a Youtube link..."
          className={styles.link_input}
        />
        {!!linkError && (
          <div className={styles.link_error} id="link_error" aria-live="polite">
            <div>{`❌`}</div>
            <div>{linkError}</div>
          </div>
        )}
      </div>
      {!!videoTitle && <h1 title={videoTitle}>{videoTitle}</h1>}
      {!!videoDuration && (
        <div className={styles.video_controls_wrapper}>
          <div className={styles.timeframe_wrapper}>
            <VideoSlider
              startTime={startTime}
              endTime={endTime}
              currentTime={currentTime}
              onTimeframeChange={onTimeframeChange}
              ariaLabel="Video timeframe slider"
              videoDuration={videoDuration}
              videoIndex={videoIndex}
            />
          </div>
          <div className={styles.sliders_wrapper}>
            {!isIos && (
              <VolumeSlider
                currentVolume={volume}
                onValueChange={onVolumeChange}
                videoIndex={videoIndex}
              />
            )}
            <SpeedSlider
              playbackSpeed={playbackSpeed}
              onValueChange={onSpeedChange}
              videoIndex={videoIndex}
            />
          </div>
          <div className={styles.mini_controls}>
            <div className={styles.mini_controls_left}>
              <button
                className={styles.control_button}
                onClick={() => onPlayPause?.(videoIndex)}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                title={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <Pause /> : <Play />}
              </button>
            </div>
            <div
              className={classNames(styles.delay_editor, {
                [styles.delay_zero]: !loopDelay && !isEditingDelay,
              })}
              onClick={() => {
                delayInputRef.current?.focus();
              }}
            >
              <span className={styles.delay_label}>
                <div className={styles.delay_label_loop}>Loop</div>
                <div>Delay:</div>
              </span>
              <input
                ref={delayInputRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                className={styles.delay_input}
                value={isEditingDelay ? delayInSeconds : String(loopDelay ?? 0)}
                onFocus={(e) => {
                  setIsEditingDelay(true);
                  setDelayInSeconds(String(loopDelay ?? 0));
                  e.target.select();
                }}
                onChange={(e) =>
                  setDelayInSeconds(e.target.value.replace(/\D/g, ""))
                }
                onBlur={() => {
                  applyDelay(parseInt(delayInSeconds, 10) || 0);
                  setIsEditingDelay(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  } else if (e.key === "Escape") {
                    setDelayInSeconds(String(loopDelay ?? 0));
                    e.currentTarget.blur();
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const next = Math.min(
                      99,
                      (parseInt(delayInSeconds, 10) || 0) + 1,
                    );
                    setDelayInSeconds(String(next));
                    onDelayChange(next, videoIndex);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = Math.max(
                      0,
                      (parseInt(delayInSeconds, 10) || 0) - 1,
                    );
                    setDelayInSeconds(String(next));
                    onDelayChange(next, videoIndex);
                  }
                }}
                aria-label="Loop delay in seconds"
                title="Pause between loops (0–99 seconds)"
              />
              <span className={styles.delay_suffix}>s</span>
            </div>
            <div className={styles.mini_controls_right}>
              <button
                className={styles.control_button}
                onClick={() => onRewind?.(videoIndex)}
                aria-label="Rewind"
                title="Rewind"
              >
                <Rewind />
              </button>
              <button
                className={styles.control_button}
                onClick={() => onJumpBack?.(videoIndex)}
                aria-label="Rewind back 10 seconds"
                title="Rewind 10s"
              >
                <Backwards />
              </button>
              <button
                className={styles.control_button}
                onClick={() => onJumpForward?.(videoIndex)}
                aria-label="Jump forward 10 seconds"
                title="Jump 10s"
              >
                <Backwards style={{ transform: "rotateZ(180deg)" }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
