"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./relatedAmbiances.module.css";
import AmbianceCard from "@/app/components/Ambiance Card/ambianceCard";

interface RelatedItem {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  views?: number;
  datePublished?: string;
  ratingTotal?: number;
  ratingCount?: number;
  author?: string;
}

export default function RelatedAmbiances({ id }: { id: string }) {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchRelatedAmbiances() {
      try {
        const res = await fetch(
          `/api/ambiance/related?id=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setItems(data.items ?? []);
      } catch {}
    }
    void fetchRelatedAmbiances();
    return () => controller.abort();
  }, [id]);

  if (items.length === 0) return <div className={styles.bottom_padding}></div>;

  return (
    <section className={styles.related} ref={containerRef}>
      <h2 className={styles.heading}>More like this…</h2>
      <div className={styles.entries}>
        {items.map((item) => (
          <AmbianceCard
            key={item.id}
            id={item.id}
            title={item.title}
            thumbnail={item.thumbnail || ``}
            linkTo="ambiance"
            containerRef={containerRef}
            views={item.views}
            author={item.author}
            ratingTotal={item.ratingTotal}
            ratingCount={item.ratingCount}
            datePublished={
              item.datePublished ? new Date(item.datePublished) : undefined
            }
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}
