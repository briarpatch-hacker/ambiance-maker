"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./categoryCard.module.css";

export interface CategoryCardProps {
  title: string;
  tags: string[];
  description: string;
  href: string;
  image: string;
  imageAlt?: string;
  imageCredit?: string;
  imageStyle?: React.CSSProperties;
  color?: string;
  style?: React.CSSProperties;
}

export default function CategoryCard({
  title,
  tags,
  description,
  href,
  image,
  imageAlt,
  imageCredit,
  imageStyle,
  color,
  style,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={styles.category}
      style={{ ...style }}
      aria-label={`Go to the ${title} category.`}
    >
      <h1 style={{ color }}>{title}</h1>
      <p className={styles.description}>{description}</p>
      <div className={styles.tags}>
        {tags.map((tag, index) => {
          return (
            <div className={styles.tag} key={`${tag}-${index}`}>
              {index > 0 && <div className={styles.tag_bullet}></div>}
              {tag}
            </div>
          );
        })}
      </div>
      <div className={styles.image_wrapper} data-credit={imageCredit}>
        <Image
          className={styles.image}
          height="400"
          width="800"
          src={image || "/images/categories/default.jpg"}
          style={imageStyle}
          alt={imageAlt ? imageAlt : ""}
        />
      </div>
    </Link>
  );
}
