"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
} from "react";
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
import type {
  VideoData,
  PlaybackState,
} from "@/app/components/Ambiance Maker/ambianceMaker";

// Re-exported so existing imports of VideoData from the player keep working
export type { VideoData, PlaybackState };

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
  // Receives currentTime / isPlaying from the 600ms poll
  setPlayback?: React.Dispatch<React.SetStateAction<PlaybackState[]>>;
  initialVideoData?: VideoData[];
  showInitialPlayButton?: boolean;
  style?: React.CSSProperties;
  ref?: React.Ref<AmbiancePlayerHandle>;
}

// Per-video controls the parent can call directly instead of going through state
export interface AmbiancePlayerHandle {
  playPause: (index: number) => void;
  rewind: (index: number) => void;
  jumpBack: (index: number) => void;
  jumpForward: (index: number) => void;
}

// Everything the player tracks about a single video slot
interface PlayerSlot {
  // The YT.Player instance, or null if it hasn't been created / failed to load
  player: any;
  // Previous startTime so we can reset the video when the user changes it
  prevStartTime: number | undefined;
  // Previous src so we can detect when the user swaps the link
  prevSrc: string | undefined;
  // The videoId most recently cued, so we can detect when a new video enters the player
  // This avoids an edge case when old / new video have the same title
  cuedVideoId: string | undefined;
  // Fires at the video's endTime to loop it
  loopTimeout: NodeJS.Timeout | null;
  // Fires at the end of a loop delay to resume the video
  delayTimeout: NodeJS.Timeout | null;
  // Indicates if vid is in a delay phase after a full loop
  // Used to clear the loop delay timer when appropriate
  inDelayPause: boolean;
  // 600ms poll that keeps videoData in sync with the iframe
  syncInterval: NodeJS.Timeout | null;
  // Volume / speed most recently pushed to the player, and whether the player
  // has echoed it back yet. getVolume() / getPlaybackRate() return cached values
  // that lag behind setVolume() / setPlaybackRate(), so until the player echoes
  // a push we ignore its reading instead of treating it as a user change
  lastVolume: number | undefined;
  lastSpeed: number | undefined;
  pendingVolume: boolean;
  pendingSpeed: boolean;
  // undefined = creation never attempted, true = in progress, false = finished
  initializing: boolean | undefined;
}

const createSlot = (): PlayerSlot => ({
  player: null,
  prevStartTime: undefined,
  prevSrc: undefined,
  cuedVideoId: undefined,
  loopTimeout: null,
  delayTimeout: null,
  inDelayPause: false,
  syncInterval: null,
  lastVolume: undefined,
  lastSpeed: undefined,
  pendingVolume: false,
  pendingSpeed: false,
  initializing: undefined,
});

// Pulls the video id out of a /watch?v=id , /shorts/id , or /embed/id link
export function extractYouTubeId(src?: string): string | undefined {
  const match =
    src?.match(
      /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/watch\?v=([\w-]+)/i,
    ) ||
    src?.match(
      /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/shorts\/([\w-]+)/i,
    ) ||
    src?.match(/(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/embed\/([\w-]+)/i) ||
    null;
  return match ? match[1] : undefined;
}

// Fields reset whenever a video is removed, replaced, or fails to load
const clearedMeta = (linkError?: string): Partial<VideoData> => ({
  title: undefined,
  channel: undefined,
  duration: undefined,
  linkError,
});

const oEmbedUrl = (videoId: string) =>
  `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;

// getVideoData().author is empty in the IFrame API, so fetch the channel
// name from the oEmbed endpoint instead.
async function fetchChannelName(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(oEmbedUrl(videoId));
    if (!res.ok) return undefined;
    const data = await res.json();
    return typeof data.author_name === "string" && data.author_name
      ? data.author_name
      : undefined;
  } catch {
    return undefined;
  }
}

// Loads the YouTube IFrame API once per page and resolves when YT.Player is usable.
// Shared across every player instance so remounts don't re-inject or re-hook the API
let youtubeApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise<void>((resolve) => {
      // Polls as a fallback in case the ready callback never fires
      const poll = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(poll);
          resolve();
        }
      }, 100);
      window.onYouTubeIframeAPIReady = () => {
        clearInterval(poll);
        resolve();
      };
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    });
  }
  return youtubeApiPromise;
}

export default React.memo(function AmbiancePlayer({
  videoData,
  initialVideoData,
  setVideoData,
  setPlayback,
  showInitialPlayButton = false,
  style,
  ref,
}: AmbiancePlayerProps) {
  // Per-video player state, one slot per index in videoData
  const slotsRef = useRef<PlayerSlot[]>([]);
  const videoDataRef = useRef<VideoData[]>([]);
  videoDataRef.current = videoData;
  // Mirror of what we've pushed through setPlayback, so the poll can dedupe
  // and the player can read playhead state without subscribing to it
  const playbackRef = useRef<PlaybackState[]>([]);

  // Player controls
  const [muted, setMuted] = useState(false);

  // Handles fullscreen mode on the ambiance player
  const fullscreenHandle = useFullScreenHandle();

  // Hides the control bar after a period of mouse inactivity in fullscreen
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handles the play button that appears on a published video
  const [showPlayOverlay, setShowPlayOverlay] = useState(showInitialPlayButton);
  const [allPlayersReady, setAllPlayersReady] = useState(false);

  // True once the YouTube IFrame API has loaded
  const [apiReady, setApiReady] = useState(false);

  // Makes sure there is a slot for every video index
  const ensureSlots = (count: number) => {
    const slots = slotsRef.current;
    while (slots.length < count) slots.push(createSlot());
  };

  // Records playhead state locally and pushes it to the parent
  const writePlayback = (index: number, updates: PlaybackState) => {
    playbackRef.current[index] = { ...playbackRef.current[index], ...updates };
    setPlayback && updateObjectArr(setPlayback, index, updates);
  };

  // Runs fn for every slot that currently has a live player
  const forEachPlayer = (
    fn: (player: any, index: number, slot: PlayerSlot) => void,
  ) => {
    slotsRef.current.forEach((slot, index) => {
      if (slot.player) fn(slot.player, index, slot);
    });
  };

  const isAnyOtherPlaying = (index: number) =>
    slotsRef.current.some(
      (slot, i) =>
        slot.player && i !== index && slot.player.getPlayerState() === 1,
    );

  const clearLoopTimeout = (slot: PlayerSlot) => {
    if (slot.loopTimeout) {
      clearTimeout(slot.loopTimeout);
      slot.loopTimeout = null;
    }
  };

  const clearSyncInterval = (slot: PlayerSlot) => {
    if (slot.syncInterval) {
      clearInterval(slot.syncInterval);
      slot.syncInterval = null;
    }
  };

  // Clears the pending loop delay timeout for a video
  const clearDelayTimeout = useCallback((index: number) => {
    const slot = slotsRef.current[index];
    if (!slot) return;
    slot.inDelayPause = false;
    if (slot.delayTimeout) {
      clearTimeout(slot.delayTimeout);
      slot.delayTimeout = null;
    }
  }, []);

  // Marks a slot's player creation as finished, and flags all players ready
  // once no slot is still initializing
  const markReady = (index: number) => {
    slotsRef.current[index].initializing = false;
    if (slotsRef.current.every((slot) => slot.initializing !== true)) {
      setAllPlayersReady(true);
    }
  };

  // Returns volume / speed changes made inside the player itself (e.g. via its
  // own controls) that should be adopted into videoData. Readings are ignored
  // while a push is still pending so a stale value can't revert a user's edit
  const getPlayerSideChanges = (player: any, slot: PlayerSlot) => {
    const changes: { volume?: number; playbackSpeed?: number } = {};
    const vol = player.getVolume();
    if (slot.pendingVolume) {
      if (vol === slot.lastVolume) slot.pendingVolume = false;
    } else if (slot.lastVolume !== undefined && vol !== slot.lastVolume) {
      slot.lastVolume = vol;
      changes.volume = vol;
    }
    const speed = player.getPlaybackRate();
    const speedMatches =
      slot.lastSpeed !== undefined && Math.abs(speed - slot.lastSpeed) < 0.001;
    if (slot.pendingSpeed) {
      if (speedMatches) slot.pendingSpeed = false;
    } else if (slot.lastSpeed !== undefined && !speedMatches) {
      slot.lastSpeed = speed;
      changes.playbackSpeed = speed;
    }
    return changes;
  };

  // Starts the 600ms poll that mirrors the iframe's time / play state into the
  // playback channel, and adopts player-side volume & speed edits into videoData
  const startSyncInterval = (player: any, index: number) => {
    const slot = slotsRef.current[index];
    clearSyncInterval(slot);
    slot.syncInterval = setInterval(() => {
      const changes = getPlayerSideChanges(player, slot);
      if (Object.keys(changes).length > 0) {
        setVideoData && updateObjectArr(setVideoData, index, changes);
      }
      const rawTime = player.getCurrentTime();
      const time =
        rawTime === 0 ? videoDataRef.current[index].startTime : rawTime;
      const state = player.getPlayerState();
      const playing = state === 1;
      const isDefinitiveState = state === 1 || state === 2;
      const pb = playbackRef.current[index] ?? {};
      if (
        time !== pb.currentTime ||
        (isDefinitiveState && playing !== pb.isPlaying)
      ) {
        writePlayback(index, {
          currentTime: time,
          ...(isDefinitiveState && { isPlaying: playing }),
        });
      }
    }, 600);
  };

  // Loops a video back to its startTime, pausing for loopDelay seconds first if set.
  // `ended` keeps the original seek / pause ordering for each caller
  const handleLoopEnd = (player: any, index: number, ended: boolean) => {
    const slot = slotsRef.current[index];
    const vd = videoDataRef.current[index];
    const start = vd.startTime || 0;
    if (vd.loopDelay && vd.loopDelay > 0) {
      slot.inDelayPause = true;
      if (ended) {
        player.seekTo(start);
        player.pauseVideo();
      } else {
        player.pauseVideo();
        player.seekTo(start);
      }
      slot.delayTimeout = setTimeout(() => {
        slot.inDelayPause = false;
        player.playVideo();
      }, vd.loopDelay * 1000);
      return;
    }
    player.seekTo(start);
  };

  // Gives each video a timeout that gets called at their endTime
  const scheduleLoop = useCallback(
    (player: any, index: number, stopping?: boolean) => {
      const slot = slotsRef.current[index];
      clearLoopTimeout(slot);
      if (stopping) return;
      const vd = videoDataRef.current[index];
      const currentTime = player.getCurrentTime();
      const endTime = vd.endTime ?? player.getDuration();
      const playbackSpeed = player.getPlaybackRate() || 1;
      const timeRemaining = (endTime - currentTime) / playbackSpeed;
      if (timeRemaining > 0) {
        slot.loopTimeout = setTimeout(
          () => handleLoopEnd(player, index, false),
          timeRemaining * 1000,
        );
      }
    },
    [],
  );

  // Shared setup for a video that just became available in a player, either because
  // the player was created (onReady) or a new link was cued into it (state 5).
  // `initial` seeds config from a saved ambiance; `extra` carries caller-specific fields
  const initializeVideo = (
    player: any,
    index: number,
    videoId: string | undefined,
    initial: VideoData | undefined,
    extra: Partial<VideoData>,
  ) => {
    const slot = slotsRef.current[index];
    slot.cuedVideoId = videoId;
    slot.prevStartTime = initial?.startTime ?? 0;
    const duration = player.getDuration();
    setVideoData &&
      updateObjectArr(setVideoData, index, {
        title: player.getVideoData().title,
        duration,
        startTime: initial?.startTime || 0,
        endTime: initial?.endTime || duration,
        volume: initial?.volume || 100,
        playbackSpeed: initial?.playbackSpeed || 1.0,
        loopDelay: initial?.loopDelay,
        linkError: undefined,
        ...extra,
      });
    // Channel name isn't available from getVideoData(); fetch via oEmbed
    if (videoId) {
      fetchChannelName(videoId).then((channel) => {
        if (channel && slot.cuedVideoId === videoId) {
          setVideoData && updateObjectArr(setVideoData, index, { channel });
        }
      });
    }
    // Starts playing the video if other videos are playing already,
    // or if this video itself was playing before the link was replaced
    if (
      isAnyOtherPlaying(index) ||
      playbackRef.current[index]?.isPlaying === true
    ) {
      player.playVideo();
    }
    startSyncInterval(player, index);
  };

  // Load the YouTube IFrame API once on mount
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (!cancelled) setApiReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Syncs the players whenever the videoData changes
  useEffect(() => {
    if (apiReady) updateVideos();
  }, [videoData, apiReady]);

  // Clears every timer on unmount so orphaned intervals can't keep writing state
  useEffect(() => {
    return () => {
      slotsRef.current.forEach((slot) => {
        clearLoopTimeout(slot);
        if (slot.delayTimeout) clearTimeout(slot.delayTimeout);
        clearSyncInterval(slot);
      });
    };
  }, []);

  // Creates / updates the videos for the ambiance player
  const updateVideos = () => {
    ensureSlots(videoData.length);
    const slots = slotsRef.current;

    // First pass: update all existing players synchronously
    videoData.forEach((video, index) => {
      const slot = slots[index];
      const videoId = extractYouTubeId(video.src);
      if (!slot.player || !videoId) return;
      const player = slot.player;

      const desiredVol = video.volume ?? 100;
      if (desiredVol !== slot.lastVolume) {
        player.setVolume(desiredVol);
        slot.lastVolume = desiredVol;
        slot.pendingVolume = true;
      }
      const desiredSpeed = video.playbackSpeed || 1.0;
      if (desiredSpeed !== slot.lastSpeed) {
        player.setPlaybackRate(desiredSpeed);
        slot.lastSpeed = desiredSpeed;
        slot.pendingSpeed = true;
      }
      const currentTime = player.getCurrentTime();
      const prevStartTime = slot.prevStartTime;
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
          setShowPlayOverlay(false);
          player.seekTo(video.startTime);
          player.playVideo();
        }
      }
      if (slot.prevStartTime !== undefined) {
        slot.prevStartTime = video.startTime;
      }
    });

    // Second pass: create new players sequentially
    const createNewPlayers = async () => {
      for (let index = 0; index < videoData.length; index++) {
        const video = videoData[index];
        const slot = slots[index];
        const playerId = `player-${index}`;
        const playerElement = document.getElementById(playerId);
        const videoId = extractYouTubeId(video.src);

        // Check if link is same from before and resets the video if its different
        if (video.src !== slot.prevSrc) {
          slot.prevSrc = video.src;
          slot.prevStartTime = undefined;
          writePlayback(index, { currentTime: 0 });
          clearLoopTimeout(slot);
          clearDelayTimeout(index);
          slot.lastVolume = undefined;
          slot.lastSpeed = undefined;
          clearSyncInterval(slot);

          if (slot.player) {
            try {
              slot.player.stopVideo();
              slot.player.cueVideoById({ videoId });
            } catch (e) {
              slot.player = null;
              //console.log(`Error reloading player ${index}:`, e);
            }
          }
        }

        // Checking if the url is valid
        if (!videoId) {
          // This resets the ambiance input
          if (video.linkError || video.duration) {
            setVideoData &&
              updateObjectArr(setVideoData, index, clearedMeta(undefined));
          }
          continue;
        }
        // Skip if player already exists
        if (slot.player) continue;

        if (playerElement) {
          // Skip if already initializing
          if (slot.initializing) continue;
          // Mark as initializing
          slot.initializing = true;
          // Add delay between player creations to prevent race conditions
          if (index > 0)
            await new Promise((resolve) => setTimeout(resolve, 200));
          try {
            new window.YT.Player(playerId, {
              height: "200px",
              width: "200px",
              videoId: videoId,
              playerVars: {},
              events: {
                onReady: (e: any) => {
                  const player = e.target;
                  slot.player = player;
                  markReady(index);
                  writePlayback(index, {
                    currentTime: initialVideoData?.[index]?.startTime ?? 0,
                  });
                  initializeVideo(
                    player,
                    index,
                    player.getVideoData().video_id,
                    initialVideoData?.[index],
                    {},
                  );
                  muted && player.mute();
                },
                onPlaybackRateChange: (e: any) => {
                  // Reschedules the loop if video is currently playing
                  if (e.target.getPlayerState() === 1) {
                    scheduleLoop(e.target, index);
                  }
                },
                onStateChange: (e: any) => {
                  const player = e.target;
                  switch (e.data) {
                    // Video started playing after being seeking/buffering/being unpaused
                    case 1: {
                      const currentTime = player.getCurrentTime();
                      const startTime =
                        videoDataRef.current[index].startTime || 0;
                      const endTime =
                        videoDataRef.current[index].endTime ||
                        player.getDuration();
                      if (currentTime < startTime || currentTime > endTime) {
                        player.seekTo(startTime);
                      } else {
                        scheduleLoop(player, index);
                      }
                      break;
                    }
                    // Video paused or buffering, stops the loop timer
                    case 2:
                    case 3: {
                      scheduleLoop(player, index, true);
                      break;
                    }
                    // Video cued - should happen when user replaces src link with another
                    case 5: {
                      const cuedVideoId = player.getVideoData().video_id;
                      const currentTitle = player.getVideoData().title;
                      // Ignore cues without a title; allow same-ID cues when the video is hidden
                      // This is done to avoid ambInput collapse and re-expand when link is replaced
                      // We also need the title condition so deleting and immediately loading the same link works
                      if (
                        cuedVideoId &&
                        currentTitle &&
                        (cuedVideoId !== slot.cuedVideoId ||
                          !videoDataRef.current[index].title)
                      ) {
                        // We need to set up all the data / timers again here
                        initializeVideo(player, index, cuedVideoId, undefined, {
                          channel: undefined,
                        });
                      }
                      break;
                    }
                    // Video ended, needed for custom endTimes
                    case 0: {
                      if (slot.inDelayPause) break;
                      handleLoopEnd(player, index, true);
                      break;
                    }
                  }
                },
                onError: (e: any) => {
                  // console.log(`🚨 Player ${index} error:`, e.data);
                  if (e.data === 100) {
                    setVideoData &&
                      updateObjectArr(
                        setVideoData,
                        index,
                        clearedMeta(`Video not found`),
                      );
                  } else if (e.data === 150 || e.data === 101) {
                    // 150/101 can mean unembeddable or unavailable — check via oEmbed
                    const vid = extractYouTubeId(
                      videoDataRef.current[index].src,
                    );
                    if (vid) {
                      fetch(oEmbedUrl(vid))
                        .then((res) => res.text())
                        .then((text) => {
                          setVideoData &&
                            updateObjectArr(
                              setVideoData,
                              index,
                              clearedMeta(
                                text === "Bad Request"
                                  ? `Video not found`
                                  : `Video cannot be embedded`,
                              ),
                            );
                        })
                        .catch(() => {
                          setVideoData &&
                            updateObjectArr(
                              setVideoData,
                              index,
                              clearedMeta(`Video not found`),
                            );
                        });
                    }
                  }
                },
              },
            });
          } catch {
            // Resets the player <div> when user inputs a video id that doesn't exist
            slot.player = null;
            const wrapperElement = document.getElementById(
              `video-wrapper-${index}`,
            );
            const playerElement = document.getElementById(`player-${index}`);
            const newPlayerElement = document.createElement("div");
            newPlayerElement.id = `player-${index}`;
            if (!playerElement) return;
            wrapperElement?.replaceChild(newPlayerElement, playerElement);
            // console.log("video id prob doesn't exist");
            markReady(index);
            if (videoDataRef.current[index].linkError) continue; // stops infinite render
            setVideoData &&
              updateObjectArr(
                setVideoData,
                index,
                clearedMeta(`Video not found`),
              );
          }
        }
      }
    };

    createNewPlayers();
  };

  const play = useCallback(() => {
    const slots = slotsRef.current;
    // Nothing to play until at least one player has started creating,
    // and never while any player is still being created
    if (
      !slots.some((slot) => slot.initializing !== undefined) ||
      slots.some((slot) => slot.initializing === true)
    ) {
      return;
    }
    forEachPlayer((player, index) => {
      clearDelayTimeout(index);
      player.playVideo();
    });
    setShowPlayOverlay(false);
  }, []);

  const pause = useCallback(() => {
    forEachPlayer((player, index) => {
      clearDelayTimeout(index);
      player.pauseVideo();
    });
  }, []);

  // Unmutes a single player while respecting an ambianceInput set volume of 0.
  // YouTube's unMute() bumps a silent video to 5% normally
  function unmutePlayer(player: any, index: number) {
    player.unMute();
    if ((videoDataRef.current[index]?.volume ?? 100) === 0) {
      player.setVolume(0);
      // Ignore the transient 5% the player may report before it echoes 0 back
      slotsRef.current[index].pendingVolume = true;
    }
  }

  const mute = useCallback(() => {
    forEachPlayer((player) => player.mute());
    setMuted(true);
  }, []);

  const unmute = useCallback(() => {
    forEachPlayer((player, index) => unmutePlayer(player, index));
    setMuted(false);
  }, []);

  // Seeks every player to the time returned by getTime, resumes it, and unmutes
  const seekAll = useCallback(
    (getTime: (player: any, vd: VideoData) => number) => {
      forEachPlayer((player, index) => {
        clearDelayTimeout(index);
        player.seekTo(getTime(player, videoDataRef.current[index]));
        player.playVideo();
        unmutePlayer(player, index);
      });
      setShowPlayOverlay(false);
      setMuted(false);
    },
    [],
  );

  const rewind = useCallback(() => {
    seekAll((_, vd) => vd.startTime as number);
  }, []);

  const jumpBack = useCallback(() => {
    seekAll((player, vd) => {
      let newTime = player.getCurrentTime() - 10;
      if (vd.startTime && newTime < vd.startTime) {
        newTime = vd.startTime;
      }
      return newTime;
    });
  }, []);

  const jumpForward = useCallback(() => {
    seekAll((player, vd) => {
      let newTime = player.getCurrentTime() + 10;
      if (vd && newTime > (vd.endTime || player.getDuration())) {
        newTime =
          (vd.startTime || 0) + newTime - (vd.endTime || player.getDuration());
      }
      return newTime;
    });
  }, []);

  // Seeks a single player to `time` and resumes it (used by the per-video mini controls)
  const seekOne = (index: number, time: number) => {
    const player = slotsRef.current[index]?.player;
    if (!player) return;
    clearDelayTimeout(index);
    player.seekTo(time);
    player.playVideo();
    setShowPlayOverlay(false);
  };

  // Per-video controls exposed to the parent. These mirror what the inputs
  // used to request through videoData.seekTo / pauseVideo
  useImperativeHandle(
    ref,
    () => ({
      playPause: (index) => {
        const player = slotsRef.current[index]?.player;
        if (!player) return;
        if (playbackRef.current[index]?.isPlaying) {
          clearDelayTimeout(index);
          player.pauseVideo();
          return;
        }
        const vd = videoDataRef.current[index];
        // A 0 reading means the player hasn't started, so resume from startTime
        seekOne(index, player.getCurrentTime() || vd.startTime || 0);
      },
      rewind: (index) => {
        seekOne(index, videoDataRef.current[index]?.startTime ?? 0);
      },
      jumpBack: (index) => {
        const player = slotsRef.current[index]?.player;
        if (!player) return;
        const vd = videoDataRef.current[index];
        const current = player.getCurrentTime() || vd.startTime || 0;
        seekOne(index, Math.max(current - 10, vd.startTime ?? 0));
      },
      jumpForward: (index) => {
        const player = slotsRef.current[index]?.player;
        if (!player) return;
        const vd = videoDataRef.current[index];
        const current = player.getCurrentTime() || vd.startTime || 0;
        const end = vd.endTime ?? vd.duration ?? current;
        seekOne(index, Math.min(current + 10, end));
      },
    }),
    [],
  );

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
});
