"use client";
import styles from "./page.module.css";
import ViewSubmitted from "@/app/components/Admin/View Submitted/viewSubmitted";
import { useRef } from "react";

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.page} ref={containerRef}>
      <ViewSubmitted containerRef={containerRef} />
    </div>
  );
}
