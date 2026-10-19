"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./submitAmbiance.module.css";
import { VideoData } from "@/app/components/Ambiance Maker/ambianceMaker";
import { convertToTimecode } from "@/app/components/Sliders/Video Range Slider/videoRangeSlider";
import Button from "@/app/components/Buttons/Button Set/button";
import { getVideoId } from "@/app/lib/schemas/ambiance";
import MessageBox from "@/app/components/Message Box/messageBox";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { categories, categoryMeta } from "@/app/lib/categories";

interface SubmitAmbianceProps {
  username: string;
  id?: string;
  title: string;
  description: string;
  videoData: VideoData[];
  closeFunction: () => void;
  onSuccess?: () => void;
  showCloseButton?: boolean;
  style?: React.CSSProperties;
}

export default function SubmitAmbiance({
  username,
  id,
  title,
  description,
  videoData,
  closeFunction,
  onSuccess,
  showCloseButton = true,
  style,
}: SubmitAmbianceProps) {
  const router = useRouter();
  const [panel, setPanel] = useState<
    "default" | "submitting" | "success" | "failure"
  >("default");
  const [isDisabled, setIsDisabled] = useState(true);
  const redirectLink = useRef("");
  const failureMessage = useRef("");
  const [formData, setFormData] = useState<{
    categories: string[];
    checked: boolean;
  }>({
    categories: [``],
    checked: false,
  });
  const selectRefs = useRef<HTMLSelectElement[]>([]);
  const firstVideo = useRef(videoData.find((v) => v.src && getVideoId(v.src)));
  const thumbnail = useRef(
    firstVideo.current
      ? `https://img.youtube.com//vi/${getVideoId(firstVideo.current.src!)}/mqdefault.jpg`
      : null,
  );

  // Checks if the form has valid inputs and enables / disables the submit button
  useEffect(() => {
    setIsDisabled(
      !formData.checked || !formData.categories[formData.categories.length - 1],
    );
  }, [formData]);

  // Submits the ambiance form
  async function submit() {
    setPanel("submitting");
    try {
      const selectedName = formData.categories.filter(Boolean).at(-1);
      const category_id = selectedName
        ? categoryMeta[selectedName]?.id
        : undefined;
      const options = {
        method: "POST",
        body: JSON.stringify({
          id: id,
          title: title,
          description: description,
          category_id,
          ...videoData.reduce((acc, video, index) => {
            return { ...acc, [`v${index + 1}`]: video };
          }, {}),
        }),
        headers: { "Content-Type": "application/json" },
      };
      const res = await fetch("/api/ambiance/submit", options);
      const data = await res.json();
      if (data.success) {
        if (data.ambiance && data.ambiance.id) {
          redirectLink.current = `/drafts/${data.ambiance.id}`;
        }
        onSuccess?.();
        setPanel("success");
      } else {
        if (data.code === "MAX_SUBMISSIONS") {
          failureMessage.current =
            "You've reached the maximum of 5 pending submissions. Withdraw one to make room for this ambiance.";
        } else if (data.code === "MAX_DRAFTS") {
          failureMessage.current =
            "You've reached the maximum of 50 drafts. Delete some drafts to make room for new ones.";
        } else if (data.code === "NOT_FOUND") {
          failureMessage.current =
            "This draft could not be found. It may have been deleted.";
        } else {
          failureMessage.current =
            "Something went wrong while submitting your ambiance. Try again soon...";
        }
        setPanel("failure");
      }
    } catch {
      failureMessage.current =
        "Something went wrong while submitting your ambiance. Try again soon...";
      setPanel("failure");
    }
  }

  // Gives arrow controls to the select elemnts
  function handleSelectKeydown(e: React.KeyboardEvent, i: number) {
    if (e.key === "ArrowLeft" && i > 0) {
      selectRefs.current[i - 1].focus();
    }
    if (e.key === "ArrowRight" && i < selectRefs.current.length - 1) {
      selectRefs.current[i + 1].focus();
    }
  }

  // Closes the modal if not currently submitting
  function close() {
    if (panel !== "submitting") {
      closeFunction();
    }
  }

  // Lets user escape when focus'd on the "x"
  function escapeKeydown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    }
  }

  return panel === "default" ? (
    <div style={{ ...style }} className={styles.submit_ambiance}>
      {showCloseButton && (
        <button
          className={styles.close_button}
          onClick={close}
          aria-label={"Close Modal"}
          tabIndex={0}
          onKeyDown={escapeKeydown}
        >
          <svg
            id="close-icon"
            width="122.878px"
            height="122.88px"
            viewBox="0 0 122.878 122.88"
            className={styles.close_icon}
          >
            <g>
              <path d="M1.426,8.313c-1.901-1.901-1.901-4.984,0-6.886c1.901-1.902,4.984-1.902,6.886,0l53.127,53.127l53.127-53.127 c1.901-1.902,4.984-1.902,6.887,0c1.901,1.901,1.901,4.985,0,6.886L68.324,61.439l53.128,53.128c1.901,1.901,1.901,4.984,0,6.886 c-1.902,1.902-4.985,1.902-6.887,0L61.438,68.326L8.312,121.453c-1.901,1.902-4.984,1.902-6.886,0 c-1.901-1.901-1.901-4.984,0-6.886l53.127-53.128L1.426,8.313L1.426,8.313z" />
            </g>
          </svg>
        </button>
      )}
      <h1>Before you submit...</h1>
      <div className={styles.instructions}>
        <div className={styles.instruction}>
          <h2>
            <div>1.</div>
            <div>Confirm your username</div>
          </h2>
          <p>
            Your username{" "}
            <span style={{ whiteSpace: "nowrap" }}>"{username}"</span> will be
            locked in after you publish your first ambiance. Make sure it's
            original and appropriate for the site.
          </p>
        </div>

        <div className={styles.instruction}>
          <h2>
            <div>2.</div>
            <div>Make sure your ambiance is suitable for all audiences</div>
          </h2>
          <p>
            Whatever its mood, your ambiance should create an atmosphere anyone
            can enjoy. Keep it timeless, not topical, and free of graphic or
            explicit material.
          </p>
        </div>

        <div className={styles.instruction}>
          <h2>
            <div>3.</div>
            <div>Blend and layer your sounds</div>
          </h2>
          <p>
            The most immersive ambiances weave together several sources instead
            of leaning on just one. Mix, trim, and balance your clips so no
            single video carries the whole experience.
          </p>
        </div>

        <div className={styles.instruction}>
          <h2>
            <div>4.</div>
            <div>Polish your title and description</div>
          </h2>
          <p>
            Your title should be clear and descriptive, something a first-time
            visitor would immediately understand. Use the description to set the
            scene and give your ambiance some context.
          </p>
        </div>

        <div className={styles.instruction}>
          <h2>
            <div>5.</div>
            <div>Choose the perfect thumbnail</div>
          </h2>
          <p>
            Your ambiance will use the first video's thumbnail. If you'd prefer
            a different one, move that video into the first slot before
            submitting.
          </p>
        </div>

        <div className={styles.instruction}>
          <h2>
            <div>6.</div>
            <div>Select the right category</div>
          </h2>
          <p>
            Take a moment to explore the categories and choose the one that best
            fits your ambiance. The right category helps your ambiance reach
            listeners looking for that kind of experience.
          </p>
        </div>

        <div className={styles.instruction}>
          <h2>
            <div>7.</div>
            <div>Check the box below</div>
          </h2>
          <p>
            Check the box below to confirm you've read and followed these
            instructions before submitting.
          </p>
        </div>
      </div>
      <h3>Your Submission</h3>
      <div className={styles.ambiance_wrapper}>
        <div className={styles.ambiance}>
          <h4>{title}</h4>
          <img
            className={styles.thumbnail}
            src={thumbnail.current || ""}
            alt="Video thumbnail"
          />
          <div className={styles.videos_wrapper}>
            {videoData.map((video, index) => {
              if (video.title) {
                return (
                  <div className={styles.video} key={`video-${index}`}>
                    <a href={video.src} target="_blank">
                      {video.title}
                    </a>
                    <div className={styles.video_details}>
                      {`Start: ${convertToTimecode(video.startTime || 0)} ● End: ${convertToTimecode(video.endTime || 0)} ● Volume: ${video.volume} ● Speed: ${video.playbackSpeed}`}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
        <div className={styles.description}>{description}</div>
      </div>
      <form className={styles.submit_form}>
        <h5>Select Categories:</h5>
        <div className={styles.categories_wrapper}>
          {(() => {
            const selects = [];
            let categoryObject: any = categories;
            for (let i = 0; i <= formData.categories.length; i++) {
              const keys = Object.keys(categoryObject);
              if (keys.length === 0) break;
              selects.push(
                <select
                  key={`category-select-${i}`}
                  value={formData.categories[i] || ""}
                  onChange={(e) => {
                    const newArr = [
                      ...formData.categories.slice(0, i),
                      e.target.value,
                    ];
                    let lastObject: any = categories;
                    for (let j = 0; j < newArr.length; j++) {
                      lastObject = lastObject[newArr[j]];
                    }
                    if (Object.keys(lastObject).length > 0) {
                      newArr.push(``);
                    }
                    setFormData((prev) => ({
                      ...prev,
                      categories: newArr,
                    }));
                  }}
                  ref={(el) => {
                    if (el) selectRefs.current[i] = el;
                  }}
                  onKeyDown={(e) => handleSelectKeydown(e, i)}
                >
                  <option value="" disabled></option>
                  {keys.map((key, index) => (
                    <option value={key} key={`${index}-${key}`}>
                      {key}
                    </option>
                  ))}
                </select>,
              );
              // Uses the formData to go deeper into the categoryObject
              if (formData.categories[i]) {
                categoryObject = categoryObject[formData.categories[i]];
                if (!categoryObject) break;
              } else {
                break;
              }
            }
            return selects;
          })()}
        </div>
        <div className={styles.checkbox_wrapper}>
          <input
            type="checkbox"
            checked={formData.checked}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, checked: e.target.checked }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setFormData((prev) => ({ ...prev, checked: !prev.checked }));
              }
            }}
            aria-label={
              formData.checked === true
                ? `Agreement has been signed. Click to undo`
                : `Sign agreement`
            }
          />
          <div>
            <div>
              I've read and followed the instructions above. I'm now ready to
              submit my ambiance for review.
            </div>
          </div>
        </div>
        <div className={styles.buttons_wrapper}>
          <Button
            variant="tertiary"
            onClick={close}
            width={"full"}
            tabIndex={0}
          >{`Cancel`}</Button>
          <Button
            variant="primary"
            onClick={submit}
            width={"full"}
            disabled={isDisabled}
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  ) : panel === "submitting" ? (
    <MessageBox ariaLive="polite" role="status" message="Submitting..." />
  ) : panel === "success" ? (
    <MessageBox
      ariaLive="polite"
      role="status"
      message="Your ambiance has been submitted! You can still make edits to your draft while it's pending review."
      buttonText="Return to Draft"
      onClick={
        redirectLink.current ? () => router.push(redirectLink.current) : close
      }
    />
  ) : (
    <MessageBox
      ariaLive="polite"
      role="status"
      message={failureMessage.current}
      buttonText="Okay"
      onClick={close}
    />
  );
}
