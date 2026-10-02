"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "./ambianceMaker.module.css";
import classNames from "classnames";
import AmbianceInput from "@/app/components/Ambiance Input/ambianceInput";
import AmbiancePlayer from "@/app/components/Ambiance Player/ambiancePlayer";
import Button from "@/app/components/Buttons/Button Set/button";
import Modal from "@/app/components/Modals/Modal Versatile Portal/modal";
import SubmitAmbiance from "@/app/components/Submit Ambiance/submitAmbiance";
import ConfirmationBox from "@/app/components/Confirmation Box/confirmationBox";
import ExtraOptions from "@/app/components/Dropdown Menu/Extra Options/extraOptions";
import ReportAmbiance from "@/app/components/Report Ambiance/reportAmbiance";
import { updateObjectArr } from "@/app/lib/setStateFunctions";
import { useRouter } from "next/navigation";
import StarRatingInput from "@/app/components/Star Rating/starRatingInput";
import BookmarkIcon from "@/app/components/Icons/bookmark";

interface AmbianceMakerProps {
  mode: "create" | "draft" | "shared" | "published";
  ambianceData?: AmbianceData;
  user?: any;
  status?: "draft" | "submitted";
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
  loopDelay?: number;
  isPlaying?: boolean;
  seekTo?: number;
  pauseVideo?: boolean;
}

export interface AmbianceData {
  id?: string;
  title?: string;
  author?: string;
  dateUpdated?: Date;
  datePublished?: Date;
  views?: number;
  ratingTotal?: number;
  ratingCount?: number;
  description?: string;
  thumbnail?: string;
  status?: "draft" | "submitted" | "published";
  category?: { name: string; href: string };
  videoData: VideoData[];
}

const maxVideos = 6;
export const createVideoEntry = (): VideoData => ({
  src: undefined,
  linkError: undefined,
  title: undefined,
  duration: undefined,
  startTime: undefined,
  endTime: undefined,
  currentTime: undefined,
  volume: undefined,
  playbackSpeed: undefined,
  loopDelay: undefined,
  isPlaying: undefined,
  seekTo: undefined,
  pauseVideo: undefined,
});

export default function AmbianceMaker({
  mode,
  ambianceData,
  user,
  status: initialStatus,
  style,
}: AmbianceMakerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"draft" | "submitted">(
    initialStatus || "draft",
  );
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  // Handles when an inputs link / src changes
  const onLinkChange = useCallback((link: string, index = 0) => {
    updateObjectArr(setVideoData, index, { src: link });
  }, []);

  // Handles when an inputs timeframe changes
  const onTimeframeChange = useCallback(
    (start: number, end: number, index = 0) => {
      updateObjectArr(setVideoData, index, { startTime: start, endTime: end });
    },
    [],
  );

  // Handles when an inputs volume changes
  const onVolumeChange = useCallback((volume: string, index = 0) => {
    updateObjectArr(setVideoData, index, { volume: parseInt(volume) });
  }, []);

  // Handles when an inputs playback rate changes
  const onSpeedChange = useCallback((speed: string, index = 0) => {
    updateObjectArr(setVideoData, index, { playbackSpeed: parseFloat(speed) });
  }, []);

  // Handles when an inputs loop delay changes
  const onDelayChange = useCallback((delay: number, index = 0) => {
    updateObjectArr(setVideoData, index, { loopDelay: delay });
  }, []);

  // Handles per-video play / pause
  function onPlayPause(index = 0) {
    if (videoData[index].isPlaying) {
      updateObjectArr(setVideoData, index, { pauseVideo: true });
    } else {
      updateObjectArr(setVideoData, index, {
        seekTo: videoData[index].currentTime ?? videoData[index].startTime ?? 0,
      });
    }
  }

  // Handles per-video rewind to start
  function onRewind(index = 0) {
    updateObjectArr(setVideoData, index, {
      seekTo: videoData[index].startTime ?? 0,
    });
  }

  // Handles per-video jump back 10s
  function onJumpBack(index = 0) {
    const current =
      videoData[index].currentTime ?? videoData[index].startTime ?? 0;
    const start = videoData[index].startTime ?? 0;
    updateObjectArr(setVideoData, index, {
      seekTo: Math.max(current - 10, start),
    });
  }

  // Handles per-video jump forward 10s
  function onJumpForward(index = 0) {
    const current =
      videoData[index].currentTime ?? videoData[index].startTime ?? 0;
    const end =
      videoData[index].endTime ?? videoData[index].duration ?? current;
    updateObjectArr(setVideoData, index, {
      seekTo: Math.min(current + 10, end),
    });
  }

  // Creates the video data
  const [videoData, setVideoData] = useState<VideoData[]>(
    Array.from({ length: maxVideos }, createVideoEntry),
  );

  // Shows the buttons fully when there is at least 2 videos, makes them clickable
  const [showButtons, setShowButtons] = useState(false);
  useEffect(() => {
    setShowButtons(
      videoData.filter((video) => {
        return video.title;
      }).length > 1,
    );
  }, [videoData]);

  // Checks if user is on iOs and displays a message that ambiance player is incompatible
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIPhone = /iPhone/i.test(ua);
    const isIPad = /iPad/i.test(ua);
    const isIPod = /iPod/i.test(ua);
    const isIPadOS =
      /Macintosh/i.test(ua) && typeof navigator !== "undefined"
        ? (navigator as any).maxTouchPoints > 1
        : false;
    setIsIOS(isIPhone || isIPad || isIPod || isIPadOS);
  }, []);

  // Fetches the current user's existing rating and favorite status for this ambiance on mount
  useEffect(() => {
    if (mode !== "published" || !user || !ambianceData?.id) return;
    fetch(`/api/ambiance/rate?id=${ambianceData.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rating) setUserRating(data.rating);
      })
      .catch(() => {});
    if (user.username !== ambianceData?.author) {
      fetch(`/api/ambiance/favorite?id=${ambianceData.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.favorited) setIsFavorited(true);
        })
        .catch(() => {});
    }
  }, []);

  // Toggles the favorite status for this ambiance
  const favoriteInFlight = useRef(false);
  async function handleFavorite() {
    if (!ambianceData?.id || favoriteInFlight.current) return;
    favoriteInFlight.current = true;
    const newFavorited = !isFavorited;
    setIsFavorited(newFavorited);
    try {
      const res = await fetch("/api/ambiance/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ambianceData.id }),
      });
      const data = await res.json();
      if (typeof data.favorited === "boolean") {
        setIsFavorited(data.favorited);
      } else {
        setIsFavorited(!newFavorited);
      }
    } catch {
      setIsFavorited(!newFavorited);
    } finally {
      favoriteInFlight.current = false;
    }
  }

  // Submits the user's star rating
  async function handleRate(stars: number) {
    if (!ambianceData?.id) return;
    try {
      await fetch("/api/ambiance/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ambianceData.id, rating: stars }),
      });
      setUserRating(stars);
      router.refresh();
    } catch {}
    setShowRatingInput(false);
  }

  // Takes video data and creates a sharable link out of it
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [shareButtonText, setShareButtonText] = useState("Copy Link");
  async function shareLink() {
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
    }
    let text = `${process.env.NEXT_PUBLIC_PROTOCOL}${process.env.NEXT_PUBLIC_DOMAIN}/share?`;
    let ampersand = false;
    videoData.forEach((video, index) => {
      const match =
        video.src?.match(
          /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/watch\?v=([\w-]+)/i,
        ) ||
        video.src?.match(
          /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/shorts\/([\w-]+)/i,
        ) ||
        video.src?.match(
          /(?:https?:\/\/)?(?:[\w-]+\.)*youtube\.com\/embed\/([\w-]+)/i,
        ) ||
        null;
      if (!match) return;
      const videoId = match[1];
      const delayToken = video.loopDelay ? `d${video.loopDelay}` : ``;
      text += `${ampersand ? `&` : ``}v${index + 1}=s${video.startTime}e${video.endTime}v${video.volume}r${Math.round(Number(video.playbackSpeed) * 100)}${delayToken}id${videoId}`;
      ampersand = true;
    });
    async function writeClipboardItem(text: string) {
      try {
        const clipboardItem = new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } catch (err) {}
    }
    await writeClipboardItem(text);
    setShareButtonText("Link copied!");
    shareTimeoutRef.current = setTimeout(() => {
      setShareButtonText("Copy Link");
    }, 1600);
  }

  // Shared lock to prevent save and publish from overlapping
  const busy = useRef(false);

  // Saves an ambiance for a logged in user
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveButtonText, setSaveButtonText] = useState(
    mode === "draft" ? `Save Draft` : `Save as Draft`,
  );
  // Save function
  async function saveAmbiance() {
    if (busy.current) return;
    setSaveButtonText("Saving...");
    busy.current = true;
    try {
      const options = {
        method: "POST",
        body: JSON.stringify({
          id: ambianceData?.id,
          published: mode === "published",
          title: mode === "published" ? "" : inputData.title,
          description: mode === "published" ? "" : inputData.description,
          ...videoData.reduce((acc, video, index) => {
            return { ...acc, [`v${index + 1}`]: video };
          }, {}),
        }),
        headers: { "Content-Type": "application/json" },
      };
      const res = await fetch("/api/ambiance/save", options);
      const data = await res.json();
      if (data.error) {
        setSaveButtonText(
          data.code === "MAX_DRAFTS"
            ? "Max Reached"
            : data.code === "NOT_FOUND"
              ? "Draft Not Found"
              : "Try Again",
        );
      } else {
        setSaveButtonText("Saved!");
      }
      if (data.ambiance?.id && (!ambianceData?.id || mode === "published")) {
        mode === "published"
          ? router.push(`/drafts/${data.ambiance.id}`)
          : router.replace(`/drafts/${data.ambiance.id}`);
      } else {
        busy.current = false;
      }
      saveTimeoutRef.current && clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaveButtonText(mode === "draft" ? `Save Draft` : `Save as Draft`);
      }, 1200);
    } catch {}
  }

  // Used to show / hide the submit ambiance modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const publishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [publishButtonText, setPublishButtonText] = useState(
    initialStatus === "submitted" ? "Categories" : "Publish",
  );

  async function handlePublishClick() {
    if (busy.current) return;
    busy.current = true;
    setPublishButtonText("Checking...");
    try {
      const url = ambianceData?.id
        ? `/api/ambiance/submit?id=${ambianceData.id}`
        : `/api/ambiance/submit`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.canSubmit) {
        setPublishButtonText(status === "submitted" ? "Categories" : "Publish");
        setShowSubmitModal(true);
        busy.current = false;
        return;
      }
      if (data.code === "NOT_FOUND") {
        setPublishButtonText("Draft Not Found");
      } else {
        setPublishButtonText("Max Reached");
      }
    } catch {
      setPublishButtonText("Try Again");
    }
    busy.current = false;
    publishTimeoutRef.current && clearTimeout(publishTimeoutRef.current);
    publishTimeoutRef.current = setTimeout(() => {
      setPublishButtonText(status === "submitted" ? "Categories" : "Publish");
    }, 2400);
  }

  // Called when submitAmbiance succeeds
  const handleSubmitSuccess = useCallback(() => {
    setStatus("submitted");
    setPublishButtonText("Categories");
  }, []);

  // Withdraws a submitted ambiance back to draft
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const withdrawTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [withdrawButtonText, setWithdrawButtonText] = useState(
    "Withdraw Submission",
  );

  async function handleWithdraw() {
    setShowWithdrawModal(false);
    if (busy.current || !ambianceData?.id) return;
    busy.current = true;
    setWithdrawButtonText("Withdrawing...");
    let withdrawn = false;
    try {
      const res = await fetch("/api/ambiance/withdraw", {
        method: "POST",
        body: JSON.stringify({ id: ambianceData.id }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setStatus("draft");
        setWithdrawButtonText("Withdraw Submission");
        setPublishButtonText("Publish");
        withdrawn = true;
      } else {
        setWithdrawButtonText(
          data.code === "NOT_FOUND" ? "Draft Not Found" : "Try Again",
        );
      }
    } catch {
      setWithdrawButtonText("Try Again");
    }
    busy.current = false;
    if (!withdrawn) {
      withdrawTimeoutRef.current && clearTimeout(withdrawTimeoutRef.current);
      withdrawTimeoutRef.current = setTimeout(() => {
        setWithdrawButtonText("Withdraw Submission");
      }, 2400);
    }
  }

  // Used to show / hide the report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const extraOptionsRef = useRef<HTMLButtonElement>(null);

  // Handles the title and description inputs
  const [inputData, setInputData] = useState({
    title: ambianceData?.title || "Untitled",
    description: ambianceData?.description || "",
  });
  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;
      setInputData((prevData) => ({ ...prevData, [name]: value }));
    },
    [],
  );
  const handleTitleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setInputData((prevData) =>
        prevData.title.trim().length === 0
          ? { ...prevData, title: "Untitled" }
          : prevData,
      );
    },
    [],
  );

  const canRate =
    mode === "published" && !!user && user.username !== ambianceData?.author;
  const canFavorite =
    mode === "published" &&
    !!user &&
    !!ambianceData?.id &&
    user.username !== ambianceData?.author;
  const hasDisplayRating =
    ambianceData?.ratingCount !== undefined &&
    ambianceData.ratingCount >= 8 &&
    ambianceData?.ratingTotal !== undefined;

  return (
    <div style={{ ...style }} className={styles.ambiance_maker}>
      {mode === "published" && ambianceData?.title ? (
        <div className={styles.header_wrapper}>
          <div
            className={classNames(styles.header, {
              [styles.published]: mode === "published",
            })}
          >
            <div className={styles.title_row}>
              <h1 className={styles.title}>{ambianceData.title}</h1>
              {canFavorite && (
                <button
                  className={classNames(styles.bookmark_button, {
                    [styles.bookmarked]: isFavorited,
                  })}
                  onClick={handleFavorite}
                  aria-label={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                  aria-pressed={isFavorited}
                  title={
                    isFavorited ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <BookmarkIcon filled={isFavorited} />
                </button>
              )}
            </div>
            {ambianceData.author && (
              <div className={styles.author_wrapper}>
                {ambianceData.category && (
                  <>
                    <div className={styles.in}>{`in`}</div>
                    <Link
                      href={ambianceData.category.href}
                      className={styles.category}
                    >
                      {ambianceData.category.name}
                    </Link>
                  </>
                )}
                <div className={styles.by}>{`by`}</div>
                <Link
                  href={`/@${ambianceData.author}`}
                  className={styles.author}
                >
                  {ambianceData.author}
                </Link>
              </div>
            )}
            <div className={styles.metadata_wrapper}>
              <div className={styles.metadata}>
                {ambianceData.views !== undefined && (
                  <span className={styles.views}>
                    {ambianceData.views.toLocaleString()} views
                  </span>
                )}
                {hasDisplayRating ? (
                  canRate ? (
                    <div className={styles.rating_button_wrapper}>
                      <button
                        className={styles.rating_button}
                        onClick={() => setShowRatingInput((v) => !v)}
                        aria-expanded={showRatingInput}
                        aria-label={`Rate this ambiance. Current rating: ${ambianceData!.ratingTotal!.toFixed(1)} out of 5`}
                      >
                        {`★ ${ambianceData!.ratingTotal!.toFixed(1)} (${ambianceData!.ratingCount!.toLocaleString()})`}
                      </button>
                    </div>
                  ) : (
                    <span className={styles.rating}>
                      {`★ ${ambianceData!.ratingTotal!.toFixed(1)} (${ambianceData!.ratingCount!.toLocaleString()})`}
                    </span>
                  )
                ) : canRate && userRating !== null ? (
                  // Confirm rating received for sub-threshold ambiances
                  <button
                    className={styles.rating_button}
                    onClick={() => setShowRatingInput((v) => !v)}
                    aria-expanded={showRatingInput}
                    aria-label="Change your rating"
                  >
                    {`★ Rated`}
                  </button>
                ) : canRate ? (
                  <button
                    className={styles.rating_button}
                    onClick={() => setShowRatingInput((v) => !v)}
                    aria-expanded={showRatingInput}
                    aria-label="Rate this ambiance"
                  >
                    {`☆ Rate`}
                  </button>
                ) : null}
                {ambianceData.datePublished &&
                  ambianceData.views !== undefined && (
                    <span className={styles.separator}>{`●`}</span>
                  )}
                {ambianceData.datePublished && (
                  <span className={styles.date_published}>
                    {new Date(ambianceData.datePublished).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </span>
                )}
                {user && ambianceData?.id && (
                  <div className={styles.extra_options}>
                    <ExtraOptions
                      ref={extraOptionsRef}
                      label={"..."}
                      menu={[
                        {
                          type: "action",
                          label: "Report",
                          onClick: () => setShowReportModal(true),
                        },
                      ]}
                      title="More Options"
                    />
                  </div>
                )}
              </div>
            </div>
            {canRate && showRatingInput && (
              <div className={styles.rating_section}>
                <span className={styles.your_rating}>
                  {userRating ? `Your rating:` : `Rate this ambiance:`}
                </span>
                <StarRatingInput
                  initialRating={userRating}
                  onRate={handleRate}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        mode !== "shared" &&
        user && (
          <div className={styles.header_wrapper}>
            <div className={classNames(styles.header, styles.with_input)}>
              <input
                id="title"
                name="title"
                type="text"
                value={inputData.title}
                onChange={handleInputChange}
                className={styles.title}
                maxLength={32}
                onBlur={handleTitleBlur}
                spellCheck={false}
                aria-label="Edit title"
              />
            </div>
          </div>
        )
      )}
      <div className={styles.player_wrapper}>
        <AmbiancePlayer
          videoData={videoData}
          initialVideoData={ambianceData?.videoData}
          setVideoData={setVideoData}
          showInitialPlayButton={mode === "shared" || mode === "published"}
        />
      </div>
      {isIOS && (
        <div className={styles.ios_notice} role="status">
          iOS can only play one audio track at a time. For multi-track
          ambiances, use desktop.
        </div>
      )}
      <div className={styles.inputs_wrapper}>
        {videoData.map((video, videoIndex) => {
          return (
            <AmbianceInput
              videoTitle={video.title}
              videoDuration={video.duration}
              startTime={video.startTime}
              endTime={video.endTime}
              currentTime={video.currentTime}
              volume={video.volume}
              playbackSpeed={video.playbackSpeed}
              loopDelay={video.loopDelay}
              linkError={video.linkError}
              onLinkChange={onLinkChange}
              onTimeframeChange={onTimeframeChange}
              onVolumeChange={onVolumeChange}
              onSpeedChange={onSpeedChange}
              onDelayChange={onDelayChange}
              isPlaying={video.isPlaying}
              onPlayPause={onPlayPause}
              onRewind={onRewind}
              onJumpBack={onJumpBack}
              onJumpForward={onJumpForward}
              videoIndex={videoIndex}
              isIos={isIOS}
              initialLink={
                ambianceData && ambianceData.videoData[videoIndex]
                  ? ambianceData.videoData[videoIndex].src
                  : undefined
              }
              key={`input-${videoIndex}`}
            />
          );
        })}
      </div>
      {mode === "published" && ambianceData?.description ? (
        <div className={styles.description_wrapper}>
          <div className={styles.description}>{ambianceData.description}</div>
        </div>
      ) : (
        mode !== "shared" &&
        user && (
          <div className={styles.description_wrapper}>
            <textarea
              id="description"
              name="description"
              value={inputData.description}
              onChange={handleInputChange}
              className={styles.description}
              maxLength={500}
              spellCheck={false}
              placeholder="Describe your ambiance..."
              aria-label="Edit description"
              rows={4}
            />
          </div>
        )
      )}
      <div className={styles.share}>
        <div className={styles.buttons_wrapper}>
          <Button
            variant="primary"
            onClick={shareLink}
            disabled={!showButtons}
            style={{ minWidth: "20rem", maxWidth: "60%", flex: "1" }}
          >
            {shareButtonText}
          </Button>
          {user && (
            <Button
              variant="primary"
              onClick={saveAmbiance}
              disabled={!showButtons}
              style={{ minWidth: "20rem", maxWidth: "60%", flex: "1" }}
            >
              {saveButtonText}
            </Button>
          )}
          {user && (mode === "create" || mode === "draft") && (
            <Button
              variant="primary"
              onClick={handlePublishClick}
              disabled={!showButtons}
              style={{ minWidth: "20rem", maxWidth: "60%", flex: "1" }}
            >
              {publishButtonText}
            </Button>
          )}
        </div>

        {user && mode === "draft" && status === "submitted" && (
          <div className={styles.buttons_wrapper}>
            <Button
              variant="tertiary"
              onClick={() => {
                if (!busy.current) {
                  setShowWithdrawModal(true);
                }
              }}
              style={{ maxWidth: "60%", flex: "1" }}
            >
              {withdrawButtonText}
            </Button>
          </div>
        )}
      </div>
      {showSubmitModal && (
        <Modal
          closeFunction={() => setShowSubmitModal(false)}
          closeOnEscape={false}
          unstyled={true}
          animate={true}
          closeOnBackdropClick={false}
          backdropStyle={{ padding: "0 0 10vh" }}
        >
          <SubmitAmbiance
            username={user.username}
            id={ambianceData?.id}
            title={inputData.title}
            description={inputData.description}
            videoData={videoData}
            closeFunction={() => setShowSubmitModal(false)}
            onSuccess={handleSubmitSuccess}
          />
        </Modal>
      )}
      {showWithdrawModal && (
        <Modal
          closeFunction={() => setShowWithdrawModal(false)}
          closeOnEscape={true}
          unstyled={true}
          animate={true}
          closeOnBackdropClick={false}
        >
          <ConfirmationBox
            message="Are you sure you want to withdraw this submission?"
            onCancel={() => setShowWithdrawModal(false)}
            onConfirm={handleWithdraw}
            confirmText="Withdraw"
            cancelText="Cancel"
          />
        </Modal>
      )}
      {showReportModal && ambianceData?.id && (
        <Modal
          closeFunction={() => {
            setShowReportModal(false);
            requestAnimationFrame(() => extraOptionsRef.current?.focus());
          }}
          closeOnEscape={true}
          unstyled={true}
          animate={true}
          closeOnBackdropClick={false}
        >
          <ReportAmbiance
            ambianceId={ambianceData.id}
            closeFunction={() => {
              setShowReportModal(false);
              requestAnimationFrame(() => extraOptionsRef.current?.focus());
            }}
          />
        </Modal>
      )}
    </div>
  );
}
