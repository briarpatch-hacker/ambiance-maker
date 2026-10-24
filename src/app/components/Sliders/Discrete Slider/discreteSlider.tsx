"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./discreteSlider.module.css";
import classNames from "classnames";

// Creates a slider from an array of values
interface DiscreteSliderProps {
  values: string[];
  defaultValue: string;
  currentValue?: string;
  onValueChange: (value: string, videoIndex?: number) => void;
  ariaLabel: string;
  videoIndex?: number;
  editable?: boolean;
  // Optional override for how typed text becomes a number (defaults to parseFloat)
  parseEditValue?: (editValue: string) => number;
  style?: React.CSSProperties;
}

export default function DiscreteSlider({
  values,
  defaultValue,
  currentValue,
  onValueChange,
  ariaLabel,
  videoIndex,
  editable,
  parseEditValue = parseFloat,
  style,
}: DiscreteSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const index = useRef(values.findIndex((value) => value === defaultValue));
  const [fill, setFill] = useState((100 * index.current) / (values.length - 1));
  const [isDragging, setIsDragging] = useState(false);
  const [showTransition, setShowTransition] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const thumbRef = useRef<null | HTMLDivElement>(null);
  const trackRef = useRef<null | HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  // When a track press ends an edit, skip the blur-commit so the click-move wins
  const skipCommitRef = useRef(false);
  // After committing/canceling via keyboard, focus the thumb to keep flow going
  const shouldFocusThumbRef = useRef(false);

  // Longest numeric portion across values[], used to cap the editable input
  const inputMaxLength = Math.max(
    1,
    ...values.map((v) => v.match(/[\d.]+/)?.[0].length ?? 1),
  );

  // Uses the currentValue prop to sync the slider
  useEffect(() => {
    if (!currentValue || currentValue === value) return;
    let currentIndex = values.findIndex((value) => value === currentValue);
    let newValue = currentValue;
    if (currentIndex < 0) {
      currentIndex = values.findIndex((value) => value === defaultValue);
      newValue = defaultValue;
    }
    index.current = currentIndex;
    setFill((100 * currentIndex) / (values.length - 1));
    setValue(newValue);
  }, [currentValue]);

  // Handles dragging the thumb
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      const newIndex = Math.round(percentage * (values.length - 1));
      index.current = newIndex;
      setFill((100 * newIndex) / (values.length - 1));
      setValue(values[newIndex]);
      onValueChange(values[newIndex], videoIndex);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !trackRef.current) return;
      e.preventDefault(); // Prevent scrolling
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (e.touches[0].clientX - rect.left) / rect.width),
      );
      const newIndex = Math.round(percentage * (values.length - 1));
      index.current = newIndex;
      setFill((100 * newIndex) / (values.length - 1));
      setValue(values[newIndex]);
      onValueChange(values[newIndex], videoIndex);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setShowTransition(true);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setShowTransition(true);
    };

    if (isDragging) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowTransition(false);
      }, 200);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  // Moves the thumb when user presses on arrow keys
  function handleKeydown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (editable) {
        e.preventDefault();
        startEditing();
      }
    } else if (e.key === "ArrowRight") {
      if (index.current < values.length - 1) {
        index.current++;
        setFill((100 * index.current) / (values.length - 1));
        setValue(values[index.current]);
        onValueChange(values[index.current], videoIndex);
      }
    } else if (e.key === "ArrowLeft") {
      if (index.current > 0) {
        index.current--;
        setFill((100 * index.current) / (values.length - 1));
        setValue(values[index.current]);
        onValueChange(values[index.current], videoIndex);
      }
    }
  }

  // Shared logic for handling start of dragging (mouse or touch)
  function handleDragStart(clientX: number, track: HTMLElement) {
    if (isDragging) return;
    setIsDragging(true);
    const rect = track.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width),
    );
    let newIndex = Math.round(percentage * (values.length - 1));
    // We are assuming at least 30 values, otherwise this would need to be removed
    // This makes it so clicks lock to the edge of the slider when intended
    if (newIndex < values.length / 10 && index.current > values.length / 5) {
      newIndex = 0;
    } else if (
      newIndex > (values.length * 9) / 10 &&
      index.current < (values.length * 4) / 5
    ) {
      newIndex = values.length - 1;
    }
    index.current = newIndex;
    setFill((100 * newIndex) / (values.length - 1));
    setValue(values[newIndex]);
    onValueChange(values[newIndex], videoIndex);
    setTimeout(() => {
      thumbRef.current?.focus();
    }, 0);
  }

  // Moves the thumb when user presses down on the track
  function handleMouseDown(e: React.MouseEvent) {
    skipCommitRef.current = true;
    handleDragStart(e.clientX, e.currentTarget as HTMLElement);
  }

  // Moves the thumb when user touches the track
  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    skipCommitRef.current = true;
    handleDragStart(e.touches[0].clientX, e.currentTarget as HTMLElement);
  }

  // Grabs the thumb for dragging, anchored at its current position so a click
  // on the handle doesn't jump it to the press point (and snap back on release)
  function handleThumbPointerDown() {
    if (!trackRef.current) return;
    skipCommitRef.current = true;
    const rect = trackRef.current.getBoundingClientRect();
    const thumbX = rect.left + (fill / 100) * rect.width;
    handleDragStart(thumbX, trackRef.current);
  }

  // Finds the values[] index whose number is closest to a typed value
  function findNearestIndex(input: string): number | null {
    const parsed = parseEditValue(input);
    if (Number.isNaN(parsed)) return null;
    let nearest = 0;
    let nearestDiff = Infinity;
    for (let i = 0; i < values.length; i++) {
      const diff = Math.abs(parseFloat(values[i]) - parsed);
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearest = i;
      }
    }
    return nearest;
  }

  // Strips the unit off a value ("50%" -> "50", "1.00x" -> "1.00") for the input
  function toEditValue(value: string) {
    return value.replace(/[^\d.]/g, "");
  }

  // Enters edit mode, seeding the input with the current numeric value
  function startEditing() {
    skipCommitRef.current = false;
    setEditValue(toEditValue(value));
    setIsEditing(true);
  }

  // Commits a typed value by snapping to the nearest entry in values[]
  function commitEdit() {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
    } else {
      const nearest = findNearestIndex(editValue);
      if (nearest !== null) {
        index.current = nearest;
        setFill((100 * nearest) / (values.length - 1));
        setValue(values[nearest]);
        onValueChange(values[nearest], videoIndex);
      }
    }
    setIsEditing(false);
    if (shouldFocusThumbRef.current) {
      shouldFocusThumbRef.current = false;
      setTimeout(() => {
        thumbRef.current?.focus();
      }, 0);
    }
  }

  // Moves the current value by one step and keeps the editing input in sync
  function stepValue(direction: 1 | -1) {
    const nearest = findNearestIndex(editValue);
    const base = nearest !== null ? nearest : index.current;
    const nextIndex = Math.min(
      values.length - 1,
      Math.max(0, base + direction),
    );
    index.current = nextIndex;
    setFill((100 * nextIndex) / (values.length - 1));
    setValue(values[nextIndex]);
    onValueChange(values[nextIndex], videoIndex);
    setEditValue(toEditValue(values[nextIndex]));
  }

  // On the editable label: a clean click opens the input, while a drag past a
  // small threshold moves the thumb. The whole drag is handled here (no handoff,
  // so no lag), and crucially no drag is started on a clean click — so opening
  // the input never coincides with a drag ending.
  function handleLabelPointerDown(clientX: number, clientY: number) {
    const DRAG_THRESHOLD = 4;
    let started = false;

    function cleanup() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    }
    // Moves the thumb to the nearest value for a pointer position
    function moveTo(moveX: number) {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (moveX - rect.left) / rect.width),
      );
      const newIndex = Math.round(percentage * (values.length - 1));
      index.current = newIndex;
      setFill((100 * newIndex) / (values.length - 1));
      setValue(values[newIndex]);
      onValueChange(values[newIndex], videoIndex);
    }
    function onMove(moveX: number, moveY: number) {
      if (started) {
        moveTo(moveX);
        return;
      }
      if (
        Math.abs(moveX - clientX) > DRAG_THRESHOLD ||
        Math.abs(moveY - clientY) > DRAG_THRESHOLD
      ) {
        started = true;
        thumbRef.current?.focus();
        setShowTransition(false);
        moveTo(moveX);
      }
    }
    function onMouseMove(e: MouseEvent) {
      onMove(e.clientX, e.clientY);
    }
    function onMouseUp() {
      cleanup();
      if (started) {
        setShowTransition(true);
      } else {
        startEditing();
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (started) e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
    function onTouchEnd() {
      cleanup();
      if (started) {
        setShowTransition(true);
      } else {
        startEditing();
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }
  return (
    <div
      style={{ ...style }}
      className={styles.track}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      ref={trackRef}
    >
      <div
        className={classNames(styles.fill, {
          [styles.transition]: showTransition,
        })}
        style={{ width: `${fill}%` }}
      ></div>
      <div
        className={classNames(styles.thumb, {
          [styles.transition]: showTransition,
        })}
        style={{ left: `${fill}%` }}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={values.length - 1}
        aria-valuenow={index.current}
        aria-valuetext={value}
        aria-label={ariaLabel}
        aria-keyshortcuts={editable ? "Enter" : undefined}
        onKeyDown={handleKeydown}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleThumbPointerDown();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleThumbPointerDown();
        }}
        ref={thumbRef}
      >
        <div
          className={styles.thumb_label}
          onMouseDown={editable ? (e) => e.stopPropagation() : undefined}
          onTouchStart={editable ? (e) => e.stopPropagation() : undefined}
        >
          {editable && isEditing ? (
            <input
              className={styles.thumb_input}
              value={editValue}
              inputMode="decimal"
              maxLength={inputMaxLength}
              autoFocus
              aria-label={ariaLabel}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setEditValue(toEditValue(e.target.value))}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  shouldFocusThumbRef.current = true;
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  skipCommitRef.current = true;
                  shouldFocusThumbRef.current = true;
                  e.currentTarget.blur();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  stepValue(1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  stepValue(-1);
                }
              }}
            />
          ) : (
            <div
              className={styles.text_wrapper}
              onMouseDown={
                editable
                  ? (e) => {
                      e.stopPropagation();
                      handleLabelPointerDown(e.clientX, e.clientY);
                    }
                  : undefined
              }
              onTouchStart={
                editable
                  ? (e) => {
                      e.stopPropagation();
                      handleLabelPointerDown(
                        e.touches[0].clientX,
                        e.touches[0].clientY,
                      );
                    }
                  : undefined
              }
            >
              {value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
