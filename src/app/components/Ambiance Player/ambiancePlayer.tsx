"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ambiancePlayer.module.css";
import PlayIcon from "@/app/components/Icons/play";
import PauseIcon from "@/app/components/Icons/pause";
import VolumeHighIcon from "@/app/components/Icons/volume_high";
import VolumeMutedIcon from "@/app/components/Icons/volume_muted";
import Backwards from "@/app/components/Icons/backwards";
import Rewind from "@/app/components/Icons/reset";
import classNames from "classnames";
import { updateObjectArr } from "@/app/lib/setStateFunctions";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import FullscreenOpen from "@/app/components/Icons/fullscreen_open";
import FullscreenClose from "@/app/components/Icons/fullscreen_close";

// YouTube API type declarations
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface AmbiancePlayerProps {
  videoData: VideoData[];
  setVideoData?: React.Dispatch<React.SetStateAction<VideoData[]>>;
  initialVideoData?: VideoData[];
  showInitialPlayButton?: boolean;
  style?: React.CSSProperties;
}

export interface VideoData {
  src?: string;
  linkError?: string;
  title?: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
  currentTime?: number;
  volume?: number;
  playbackSpeed?: number;
  ready?: boolean;
  isPlaying?: boolean;
  seekTo?: number;
  pauseVideo?: boolean;
}

// Creates an embed URL using VideoData
function createUrl({ src, startTime, endTime }: VideoData): string | false {
  // Looks for a match on /watch?v=id , then /shorts/id , then /embed/id
  const match =
    src?.match(
      /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/watch\?v=([\w-]+)/i,
    ) ||
    src?.match(
      /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/shorts\/([\w-]+)/i,
    ) ||
    src?.match(/(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/embed\/([\w-]+)/i) ||
    null;
  if (!match) return false;
  const videoId = match[1];
  const params = new URLSearchParams();
  if (startTime) params.set("start", startTime.toString());
  if (endTime) params.set("end", endTime.toString());
  params.set("enablejsapi", "1");
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export default function AmbiancePlayer({
  videoData,
  initialVideoData,
  setVideoData,
  showInitialPlayButton = false,
  style,
}: AmbiancePlayerProps) {
  // Setting up the ambiance player / video players
  const playerRefs = useRef<any[]>([]);
  const videoDataRef = useRef<VideoData[]>([]);
  videoDataRef.current = videoData;

  // Tracks previous startTimes so we can reset the video when user changes it
  const prevStartTimesRef = useRef<(number | undefined)[]>([]);
  // Tracks previous video link / src so we can destroy and recreate the video when user changes it
  const prevLinksRef = useRef<(string | undefined)[]>([]);
  // Tracks the videoId so we can detect when a new video enters the player
  // This avoids an edge case when old / new video have the same title
  const prevCuedVideoIdsRef = useRef<(string | undefined)[]>([]);

  // Player controls
  const [muted, setMuted] = useState(false);

  // Timeouts for controlling looping videos
  const timeoutRefs = useRef<(NodeJS.Timeout | null)[]>([]);
  // Single collection of intervals used to keep the iframe state in sync
  const videoIntervalRefs = useRef<(NodeJS.Timeout | null)[]>([]);
  const lastVolumeRef = useRef<(number | undefined)[]>([]);
  // Tracks which players are currently being initialized
  const initializingRef = useRef<boolean[]>([]);

  // Handles fullscreen mode on the ambiance player
  const fullscreenHandle = useFullScreenHandle();

  // Hides the control bar after a period of mouse inactivity in fullscreen
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handles the play button that appears on a published video
  const [showPlayOverlay, setShowPlayOverlay] = useState(showInitialPlayButton);
  const [allPlayersReady, setAllPlayersReady] = useState(false);

  // Calls updateVideos when the videoData changes
  useEffect(() => {
    updateVideos();
    // Cleans up timeouts on dismount
    return () => {
      timeoutRefs.current.forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [videoData]);

  // Creates the videos for the ambiance player
  const updateVideos = () => {
    // Load YouTube Iframe API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Function to create players once API is ready
    const createPlayers = () => {
      if (!window.YT || !window.YT.Player) {
        // Failed to create players, trying again...
        setTimeout(createPlayers, 100);
        return;
      }

      // First pass: update all existing players synchronously
      videoData.forEach((video, index) => {
        const embedUrl = createUrl(video);
        const videoId =
          embedUrl && typeof embedUrl === "string"
            ? embedUrl.match(/embed\/([^?]+)/)?.[1]
            : undefined;

        // Update existing player props immediately
        if (playerRefs.current[index] && embedUrl && videoId) {
          const player = playerRefs.current[index];
          const desiredVol = video.volume ?? 100;
          if (desiredVol !== lastVolumeRef.current[index]) {
            player.setVolume(desiredVol);
            lastVolumeRef.current[index] = desiredVol;
          }
          player.setPlaybackRate(video.playbackSpeed || 1.0);
          const currentTime = player.getCurrentTime();
          const prevStartTime = prevStartTimesRef.current[index];
          const playerState = player.getPlayerState();
          if (video.startTime !== undefined && video.endTime !== undefined) {
            if (playerState === 1) {
              if (
                currentTime < video.startTime ||
                currentTime > video.endTime ||
                video.startTime != prevStartTime
              ) {
                player.seekTo(video.startTime);
              }
              scheduleLoop(player, index);
            } else if (
              prevStartTime !== undefined &&
              video.startTime !== prevStartTime
            ) {
              // Plays video when user adjusts start thumb
              if (showPlayOverlay) {
                setShowPlayOverlay(false);
              }
              player.seekTo(video.startTime);
              player.playVideo();
            }
          }
          if (prevStartTimesRef.current[index] !== undefined) {
            prevStartTimesRef.current[index] = video.startTime;
          }

          // Handle seekTo: seek to the requested position then immediately clear the instruction
          if (video.seekTo !== undefined) {
            player.seekTo(video.seekTo);
            player.playVideo();
            if (showPlayOverlay) setShowPlayOverlay(false);
            setVideoData &&
              updateObjectArr(setVideoData, index, { seekTo: undefined });
          }
          // Handle pauseVideo: pause this individual video then immediately clear the instruction
          if (video.pauseVideo) {
            player.pauseVideo();
            setVideoData &&
              updateObjectArr(setVideoData, index, { pauseVideo: undefined });
          }
        }
      });

      // Second pass: create new players sequentially
      const createNewPlayers = async () => {
        for (let index = 0; index < videoData.length; index++) {
          const video = videoData[index];
          const playerId = `player-${index}`;
          const playerElement = document.getElementById(playerId);
          const embedUrl = createUrl(video);
          const videoId =
            embedUrl && typeof embedUrl === "string"
              ? embedUrl.match(/embed\/([^?]+)/)?.[1]
              : undefined;

          // Check if link is same from before and resets the video if its different
          if (video.src !== prevLinksRef.current[index]) {
            prevLinksRef.current[index] = video.src;
            prevStartTimesRef.current[index] = undefined;
            setVideoData &&
              updateObjectArr(setVideoData, index, { currentTime: 0 });
            if (timeoutRefs.current[index]) {
              clearTimeout(timeoutRefs.current[index]!);
              timeoutRefs.current[index] = null;
            }
            lastVolumeRef.current[index] = undefined;

            if (videoIntervalRefs.current[index]) {
              clearInterval(videoIntervalRefs.current[index]!);
              videoIntervalRefs.current[index] = null;
            }

            if (playerRefs.current[index]) {
              try {
                playerRefs.current[index].stopVideo();
                playerRefs.current[index].cueVideoById({
                  videoId,
                });
              } catch (e) {
                playerRefs.current[index] = null;
                //console.log(`Error reloading player ${index}:`, e);
              }
            }
          }
          // Checking if the url is valid
          if (!embedUrl) {
            // This resets the ambiance input
            if (video.linkError || video.duration) {
              setVideoData &&
                updateObjectArr(setVideoData, index, {
                  title: undefined,
                  duration: undefined,
                  linkError: undefined,
                });
            }
            continue;
          }
          if (!videoId) continue;
          // Skip if player already exists
          if (playerRefs.current[index]) continue;

          if (playerElement) {
            // Skip if already initializing
            if (initializingRef.current[index]) continue;
            // Mark as initializing
            initializingRef.current[index] = true;
            // Add delay between player creations to prevent race conditions
            if (index > 0)
              await new Promise((resolve) => setTimeout(resolve, 200));
            try {
              const player = new window.YT.Player(playerId, {
                height: "200px",
                width: "200px",
                videoId: videoId,
                playerVars: {},
                events: {
                  onReady: (e: any) => {
                    playerRefs.current[index] = e.target;
                    initializingRef.current[index] = false;
                    if (
                      initializingRef.current.every((entry) => {
                        return entry === false;
                      })
                    ) {
                      setAllPlayersReady(true);
                    }
                    prevStartTimesRef.current[index] =
                      initialVideoData?.[index]?.startTime ?? 0;
                    prevCuedVideoIdsRef.current[index] =
                      player.getVideoData().video_id;
                    setVideoData &&
                      updateObjectArr(setVideoData, index, {
                        title: player.getVideoData().title,
                        duration: player.getDuration(),
                        startTime: initialVideoData?.[index]?.startTime || 0,
                        endTime:
                          initialVideoData?.[index]?.endTime ||
                          player.getDuration(),
                        volume: initialVideoData?.[index]?.volume || 100,
                        playbackSpeed:
                          initialVideoData?.[index]?.playbackSpeed || 1.0,
                        currentTime: initialVideoData?.[index]?.startTime ?? 0,
                        linkError: undefined,
                      });
                    // Starts playing the video if other videos are playing already,
                    // or if this video itself was playing before the link was replaced
                    const isOtherVideoPlaying =
                      playerRefs.current.some(
                        (p, i) => p && i !== index && p.getPlayerState() === 1,
                      ) || videoDataRef.current[index]?.isPlaying === true;
                    if (isOtherVideoPlaying) {
                      e.target.playVideo();
                    }

                    videoIntervalRefs.current[index] = setInterval(() => {
                      const player = e.target;
                      const vol = player.getVolume();
                      const speed = player.getPlaybackRate();
                      const rawTime = player.getCurrentTime();
                      const time =
                        rawTime === 0
                          ? videoDataRef.current[index].startTime
                          : rawTime;
                      const vd = videoDataRef.current[index];
                      const state = player.getPlayerState();
                      const playing = state === 1;
                      const isDefinitiveState = state === 1 || state === 2;
                      if (
                        vol !== vd.volume ||
                        speed !== vd.playbackSpeed ||
                        time !== vd.currentTime ||
                        (isDefinitiveState && playing !== vd.isPlaying)
                      ) {
                        setVideoData &&
                          updateObjectArr(setVideoData, index, {
                            volume: vol,
                            playbackSpeed: speed,
                            currentTime: time,
                            ...(isDefinitiveState && { isPlaying: playing }),
                          });
                      }
                    }, 600);
                    muted && e.target.mute();
                  },
                  onPlaybackRateChange: (e: any) => {
                    // Reschedules the loop if video is currently playing
                    if (e.target.getPlayerState() === 1) {
                      scheduleLoop(e.target, index);
                    }
                  },
                  onStateChange: (e: any) => {
                    switch (e.data) {
                      // Video started playing after being seeking/buffering/being unpaused
                      case 1: {
                        const currentTime = player.getCurrentTime();
                        const startTime =
                          videoDataRef.current[index].startTime || 0;
                        const endTime =
                          videoDataRef.current[index].endTime ||
                          e.target.getDuration();
                        if (currentTime < startTime || currentTime > endTime) {
                          player.seekTo(startTime);
                        } else {
                          scheduleLoop(e.target, index);
                        }
                        break;
                      }
                      // Video paused or buffering, stops the loop timer
                      case 2:
                      case 3: {
                        scheduleLoop(e.target, index, true);
                        break;
                      }
                      // Video cued - should happen when user replaces src link with another
                      case 5: {
                        const cuedVideoId = player.getVideoData().video_id;
                        const currentTitle = player.getVideoData().title;
                        if (
                          cuedVideoId &&
                          cuedVideoId !== prevCuedVideoIdsRef.current[index]
                        ) {
                          prevCuedVideoIdsRef.current[index] = cuedVideoId;
                          prevStartTimesRef.current[index] = 0;
                          // We need to set up all the data / timers again here
                          setVideoData &&
                            updateObjectArr(setVideoData, index, {
                              title: currentTitle,
                              duration: player.getDuration(),
                              startTime: 0,
                              endTime: player.getDuration(),
                              volume: 100,
                              playbackSpeed: 1.0,
                              linkError: undefined,
                            });
                          // Starts playing the video if other videos are playing already,
                          // or if this video itself was playing before the link was replaced
                          const isOtherVideoPlaying =
                            playerRefs.current.some(
                              (p, i) =>
                                p && i !== index && p.getPlayerState() === 1,
                            ) ||
                            videoDataRef.current[index]?.isPlaying === true;
                          if (isOtherVideoPlaying) {
                            e.target.playVideo();
                          }

                          videoIntervalRefs.current[index] = setInterval(() => {
                            const player = e.target;
                            const vol = player.getVolume();
                            const speed = player.getPlaybackRate();
                            const rawTime = player.getCurrentTime();
                            const time =
                              rawTime === 0
                                ? videoDataRef.current[index].startTime
                                : rawTime;
                            const vd = videoDataRef.current[index];
                            const state = player.getPlayerState();
                            const playing = state === 1;
                            const isDefinitiveState =
                              state === 1 || state === 2;
                            if (
                              vol !== vd.volume ||
                              speed !== vd.playbackSpeed ||
                              time !== vd.currentTime ||
                              (isDefinitiveState && playing !== vd.isPlaying)
                            ) {
                              setVideoData &&
                                updateObjectArr(setVideoData, index, {
                                  volume: vol,
                                  playbackSpeed: speed,
                                  currentTime: time,
                                  ...(isDefinitiveState && {
                                    isPlaying: playing,
                                  }),
                                });
                            }
                          }, 600);
                        }
                        break;
                      }
                      // Video ended, needed for custom endTimes
                      case 0: {
                        player.seekTo(
                          videoDataRef.current[index].startTime || 0,
                        );
                        break;
                      }
                    }
                  },
                  onError: (e: any) => {
                    // console.log(`🚨 Player ${index} error:`, e.data);
                    // console.log("Error code:", e.data);
                    if (e.data === 100) {
                      setVideoData &&
                        updateObjectArr(setVideoData, index, {
                          title: undefined,
                          duration: undefined,
                          linkError: `Video not found`,
                        });
                    } else if (e.data === 150 || e.data === 101) {
                      // 150/101 can mean unembeddable or unavailable — check via oEmbed
                      const currentSrc = videoDataRef.current[index].src;
                      const vid = currentSrc?.match(
                        /(?:v=|shorts\/|embed\/)([\w-]+)/,
                      )?.[1];
                      if (vid) {
                        (async () => {
                          try {
                            const res = await fetch(
                              `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${vid}`)}&format=json`,
                            );
                            const text = await res.text();
                            setVideoData &&
                              updateObjectArr(setVideoData, index, {
                                title: undefined,
                                duration: undefined,
                                linkError:
                                  text === "Bad Request"
                                    ? `Video not found`
                                    : `Video cannot be embedded`,
                              });
                          } catch {
                            setVideoData &&
                              updateObjectArr(setVideoData, index, {
                                title: undefined,
                                duration: undefined,
                                linkError: `Video not found`,
                              });
                          }
                        })();
                      }
                    }
                  },
                },
              });
            } catch {
              // Resets the player <div> when user inputs a video id that doesn't exist
              playerRefs.current[index] = null;
              const wrapperElement = document.getElementById(
                `video-wrapper-${index}`,
              );
              const playerElement = document.getElementById(`player-${index}`);
              const newPlayerElement = document.createElement("div");
              newPlayerElement.id = `player-${index}`;
              if (!playerElement) return;
              wrapperElement?.replaceChild(newPlayerElement, playerElement);
              // console.log("video id prob doesn't exist");
              initializingRef.current[index] = false;
              if (
                initializingRef.current.every((entry) => {
                  return entry === false;
                })
              ) {
                setAllPlayersReady(true);
              }
              if (videoDataRef.current[index].linkError) continue; // stops infinite render
              setVideoData &&
                updateObjectArr(setVideoData, index, {
                  title: undefined,
                  duration: undefined,
                  linkError: `Video not found`,
                });
            }
          }
        }
      };

      createNewPlayers();
    };

    // Set up API ready callback
    window.onYouTubeIframeAPIReady = createPlayers;

    // If API is already loaded, create players immediately
    if (window.YT && window.YT.Player) {
      createPlayers();
    }
  };

  // Gives each video a timeout that gets called at their endTime
  const scheduleLoop = useCallback(
    (player: any, index: number, stopping?: boolean) => {
      const videoData = videoDataRef.current[index];
      // Clears existing timeout for this video
      if (timeoutRefs.current[index]) {
        clearTimeout(timeoutRefs.current[index]!);
      }
      if (stopping) return;
      const currentTime = player.getCurrentTime();
      const endTime = videoData.endTime ?? player.getDuration();
      const playbackSpeed = player.getPlaybackRate() || 1;
      const timeRemaining = (endTime - currentTime) / playbackSpeed;
      if (timeRemaining > 0) {
        timeoutRefs.current[index] = setTimeout(() => {
          const videoData = videoDataRef.current[index];
          player.seekTo(videoData.startTime || 0);
        }, timeRemaining * 1000);
      }
    },
    [],
  );

  const play = useCallback(() => {
    if (
      initializingRef.current.length === 0 ||
      initializingRef.current.some((entry) => {
        return entry === true;
      })
    ) {
      return;
    }
    playerRefs.current.forEach((player) => {
      player && player.playVideo();
    });
    if (showPlayOverlay) {
      setShowPlayOverlay(false);
    }
  }, []);

  const pause = useCallback(() => {
    playerRefs.current.forEach((player) => {
      player && player.pauseVideo();
    });
  }, []);

  // Unmutes a single player while respecting an ambianceInput set volume of 0.
  // YouTube's unMute() bumps a silent video to 5% normally
  function unmutePlayer(player: any, index: number) {
    player.unMute();
    if ((videoDataRef.current[index]?.volume ?? 100) === 0) {
      player.setVolume(0);
    }
  }

  const mute = useCallback(() => {
    playerRefs.current.forEach((player) => {
      player && player.mute();
    });
    setMuted(true);
  }, []);

  const unmute = useCallback(() => {
    playerRefs.current.forEach((player, index) => {
      if (!player) return;
      unmutePlayer(player, index);
    });
    setMuted(false);
  }, []);

  const rewind = useCallback(() => {
    playerRefs.current.forEach((player, index) => {
      if (!player) return;
      player.seekTo(videoDataRef.current[index].startTime);
      player.playVideo();
      unmutePlayer(player, index);
    });
    if (showPlayOverlay) {
      setShowPlayOverlay(false);
    }
    setMuted(false);
  }, []);

  const jumpBack = useCallback(() => {
    playerRefs.current.forEach((player, index) => {
      if (!player) return;
      let newTime = player.getCurrentTime() - 10;
      if (
        videoDataRef.current[index].startTime &&
        newTime < videoDataRef.current[index].startTime
      ) {
        newTime = videoDataRef.current[index].startTime;
      }
      player.seekTo(newTime);
      player.playVideo();
      unmutePlayer(player, index);
    });
    if (showPlayOverlay) {
      setShowPlayOverlay(false);
    }
    setMuted(false);
  }, []);

  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  // Start or clear the idle timer when entering/exiting fullscreen
  useEffect(() => {
    if (fullscreenHandle.active) {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(
        () => setControlsVisible(false),
        3000,
      );
    } else {
      setControlsVisible(true);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
    }
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [fullscreenHandle.active]);

  const hasLoadedVideo = videoData.some((v) => v.title);

  const jumpForward = useCallback(() => {
    playerRefs.current.forEach((player, index) => {
      if (!player) return;
      let newTime = player.getCurrentTime() + 10;
      if (
        videoDataRef.current[index] &&
        newTime > (videoDataRef.current[index].endTime || player.getDuration())
      ) {
        newTime =
          (videoDataRef.current[index].startTime || 0) +
          newTime -
          (videoDataRef.current[index].endTime || player.getDuration());
      }
      player.seekTo(newTime);
      player.playVideo();
      unmutePlayer(player, index);
    });
    if (showPlayOverlay) {
      setShowPlayOverlay(false);
    }
    setMuted(false);
  }, []);

  return (
    <div
      style={{ ...style }}
      className={classNames(styles.player, {
        [styles.fullscreen]: fullscreenHandle.active,
      })}
    >
      <FullScreen handle={fullscreenHandle}>
        <div
          onMouseMove={fullscreenHandle.active ? handleMouseMove : undefined}
        >
          {fullscreenHandle.active && !controlsVisible && (
            <div className={styles.idle_overlay} />
          )}
          <div className={styles.videos} id={`videos`}>
            {showPlayOverlay && (
              <button
                className={styles.play_button}
                aria-label="Play Videos"
                onClick={play}
              >
                {allPlayersReady && (
                  <div className={styles.circle}>
                    <PlayIcon />
                  </div>
                )}
              </button>
            )}
            {videoData.map((video, i) => {
              return (
                <div
                  className={classNames(styles.video_wrapper, {
                    [styles.visible]: video.title,
                  })}
                  id={`video-wrapper-${i}`}
                  key={`video-wrapper-${i}`}
                >
                  <div id={`player-${i}`} />
                </div>
              );
            })}
          </div>
          <div
            className={classNames(styles.control_bar, {
              [styles.controls_hidden]:
                fullscreenHandle.active && !controlsVisible,
            })}
          >
            <div className={styles.controls_wrapper}>
              <button
                onClick={play}
                title="Play Videos"
                aria-label="Play Videos"
              >
                <PlayIcon />
              </button>
              <button
                onClick={pause}
                title="Pause Videos"
                aria-label="Pause Videos"
              >
                <PauseIcon />
              </button>
              <button
                onClick={muted ? unmute : mute}
                title={muted ? "Unmute Videos" : "Mute Videos"}
                aria-label={muted ? "Unmute Videos" : "Mute Videos"}
                aria-pressed={muted}
              >
                {muted ? <VolumeMutedIcon /> : <VolumeHighIcon />}
              </button>
            </div>
            <div className={styles.controls_wrapper}>
              <button
                onClick={rewind}
                title="Rewind Videos"
                aria-label="Rewind Videos"
              >
                <Rewind className={styles.rewind} />
              </button>
              <button
                className={styles.desktop_button}
                onClick={jumpBack}
                title="Rewind 10s"
                aria-label="Rewind 10s"
                style={{ paddingRight: "0.2rem" }}
              >
                <Backwards style={{ padding: "0.2rem 0" }} />
              </button>
              <button
                className={styles.desktop_button}
                onClick={jumpForward}
                title="Jump 10s"
                aria-label="Jump 10s"
              >
                <Backwards
                  style={{ transform: "rotateZ(180deg)", padding: "0.2rem 0" }}
                />
              </button>
              {fullscreenHandle.active ? (
                <button
                  className={styles.desktop_button}
                  onClick={fullscreenHandle.exit}
                  title="Exit full screen"
                  aria-label="Exit full screen"
                >
                  <FullscreenClose />
                </button>
              ) : (
                <button
                  className={styles.desktop_button}
                  onClick={fullscreenHandle.enter}
                  disabled={!hasLoadedVideo}
                  title={
                    hasLoadedVideo
                      ? "Full screen"
                      : "Add a video to enter fullscreen"
                  }
                  aria-label="Full screen"
                >
                  <FullscreenOpen style={{ padding: "0.2rem 0" }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </FullScreen>
    </div>
  );
}
