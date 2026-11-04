"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import styles from "./ambianceCard.module.css";
import TooltipLink from "@/app/components/Tooltip Link/tooltipLink";
import classNames from "classnames";

// The description that appears as a tooltip
export function Description({
  description,
}: {
  description: string | undefined;
}) {
  return (
    description && (
      <div
        id="description"
        className={styles.description_wrapper}
        role="tooltip"
      >
        <div className={styles.description}>{description}</div>
      </div>
    )
  );
}

export type AmbianceCardBanner = "submitted" | "featured";

export interface AmbianceCardProps {
  id: string;
  title: string;
  thumbnail: string;
  linkTo: "ambiance" | "draft";
  linkTarget?: React.HTMLAttributeAnchorTarget;
  containerRef: React.RefObject<HTMLElement | null>;
  author?: string;
  description?: string;
  views?: number;
  ratingTotal?: number;
  ratingCount?: number;
  datePublished?: Date;
  dateUpdated?: Date;
  mode?: "vertical" | "horizontal";
  style?: React.CSSProperties;
  banner?: AmbianceCardBanner;
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  if (diffSeconds < 60) return `Just now`;
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? `` : `s`} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? `` : `s`} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? `` : `s`} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks === 1 ? `` : `s`} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths === 1 ? `` : `s`} ago`;
  return `${diffYears} year${diffYears === 1 ? `` : `s`} ago`;
}

// Takes the number of views and abbreviates it
function formatViews(views: number): string {
  if (views < 2) {
    return `No views`;
  }
  if (views < 1000) {
    return `${views} views`;
  }
  if (views < 10000) {
    return `${Math.floor(views / 100) / 10}k views`;
  }
  if (views < 1000000) {
    return `${Math.floor(views / 1000)}k views`;
  }
  return `${Math.floor(views / 100000) / 10}M views`;
}

export default function AmbianceCard({
  id,
  title,
  thumbnail,
  linkTo,
  linkTarget = "_self",
  containerRef,
  views,
  author,
  description,
  ratingTotal,
  ratingCount,
  datePublished,
  dateUpdated,
  mode,
  style,
  banner,
}: AmbianceCardProps) {
  const relativeUpdated = useMemo(
    // Memoized so hover-driven re-renders don't recompute the label against a newer Date.now()
    () => (dateUpdated ? formatRelativeTime(dateUpdated) : undefined),
    [dateUpdated?.getTime()],
  );

  return (
    <div
      className={classNames(styles.card_wrapper, {
        [styles.vertical]: mode === "vertical",
        [styles.horizontal]: mode === "horizontal",
      })}
    >
      <TooltipLink
        href={`/${linkTo === "ambiance" ? `ambiance` : `drafts`}/${id}`}
        target={linkTarget}
        direction="bottom"
        tooltip={
          description ? <Description description={description} /> : undefined
        }
        tooltipId={description ? "description" : ""}
        offset={0.0}
        containerRef={containerRef}
        delay={800}
        closingTime={400}
      >
        <span className={styles.sr_only}>
          {`Go to ${linkTo === "ambiance" ? "ambiance" : "draft"} "${title}"`}
        </span>
      </TooltipLink>
      <div style={{ ...style }} className={styles.card}>
        {banner && (
          <div
            className={classNames(styles.ribbon, {
              [styles.ribbon_submitted]: banner === "submitted",
              [styles.ribbon_featured]: banner === "featured",
            })}
          >
            {banner}
          </div>
        )}
        <div className={styles.image_wrapper}>
          <img
            className={styles.thumbnail}
            src={thumbnail}
            alt="Ambiance Thumbnail"
          />
        </div>

        <div className={styles.meta_wrapper}>
          <h1 className={styles.title} title={title}>
            {title}
          </h1>
          {linkTo === "ambiance" ? (
            <div className={styles.meta_section}>
              <div className={styles.meta_row}>
                <div className={styles.meta_row_left}>
                  {views != undefined && (
                    <div className={styles.views}>{formatViews(views)}</div>
                  )}
                  {ratingCount !== undefined &&
                    ratingCount >= 8 &&
                    ratingTotal !== undefined && (
                      <div className={styles.rating}>
                        <div>{`★`}</div>
                        <div>{`${ratingTotal.toFixed(1)}`}</div>
                      </div>
                    )}
                </div>
                {datePublished && (
                  <div className={styles.date}>
                    {datePublished.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>
              {author && (
                <div className={styles.byline}>
                  <Link
                    href={`/@${author}`}
                    className={styles.author_link}
                    aria-label={`Go to ${author}'s page`}
                  >
                    {author}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.meta_wrapper}>
              <div className={styles.meta_row}>
                {relativeUpdated && (
                  <div className={styles.date}>{relativeUpdated}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
