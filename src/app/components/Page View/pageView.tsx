"use client";
import { useEffect, useRef } from "react";

export type TrackedPage = "home" | "create" | "share" | "categories" | "ambiance";

/**
 * Records one page view per mount via /api/analytics/page-view.
 * The ref guard prevents React Strict Mode's simulated remount (dev only)
 * from firing the request twice; refs survive that remount, state does not.
 */
export function usePageView(page: TrackedPage, shareParams?: string) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, shareParams }),
      keepalive: true,
    }).catch(() => {});
    // Intentionally mount-only: a page view is a mount event, not a prop change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Drop-in for server components that can't call hooks directly. */
export default function PageView({ page }: { page: TrackedPage }) {
  usePageView(page);
  return null;
}
