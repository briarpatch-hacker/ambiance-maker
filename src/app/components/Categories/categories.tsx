"use client";
import React, { useRef } from "react";
import { notFound } from "next/navigation";
import styles from "./categories.module.css";
import CategoryCard from "@/app/components/Category Card/categoryCard";
import BreadcrumbMenu from "@/app/components/Breadcrumb Menu/breadcrumb";
import type { Breadcrumb } from "@/app/components/Breadcrumb Menu/breadcrumb";
import Pagination from "@/app/components/Pagination/pagination";
import { categories, categoryMeta } from "@/app/lib/categories";

interface CategoriesPageProps {
  slug: string[] | undefined;
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/ /g, "-");
}

function slugToName(slug: string, pool: string[]): string | undefined {
  return pool.find((name) => nameToSlug(name) === slug);
}

export default function CategoriesPage({ slug }: CategoriesPageProps) {
  const componentRef = useRef<HTMLDivElement | null>(null);

  // Resolve slug to category/subcategory names
  const topLevelKeys = Object.keys(categories);
  const catSlug = slug?.[0];
  const subcatSlug = slug?.[1];

  if (slug && slug.length > 2) notFound();

  const catName = catSlug ? slugToName(catSlug, topLevelKeys) : undefined;
  if (catSlug && !catName) notFound();

  const subcatKeys = catName ? Object.keys(categories[catName]) : [];
  const subcatName =
    catName && subcatSlug ? slugToName(subcatSlug, subcatKeys) : undefined;
  if (subcatSlug && !subcatName) notFound();

  // Determine which keys to display and the page heading
  let displayKeys: string[];
  let heading: string;
  let hrefPrefix: string;

  if (!catName) {
    // /categories — show all top-level categories
    displayKeys = topLevelKeys;
    heading = "Categories";
    hrefPrefix = "/categories";
  } else if (!subcatName && subcatKeys.length > 0) {
    // /categories/moods — show subcategories
    displayKeys = subcatKeys;
    heading = catName;
    hrefPrefix = `/categories/${catSlug}`;
  } else {
    // Endpoint: no subcategories, or reached a leaf subcategory
    displayKeys = [];
    heading = subcatName ?? catName;
    hrefPrefix = "";
  }

  // Build breadcrumb with proper casing from category key names
  const breadcrumbMenu: Breadcrumb[] = [
    { title: "Categories", href: "/categories" },
    ...(catName
      ? [
          {
            title: catName,
            href: `/categories/${catSlug}`,
            color: categoryMeta[catName]?.color,
          },
        ]
      : []),
    ...(subcatName
      ? [
          {
            title: subcatName,
            href: `/categories/${catSlug}/${subcatSlug}`,
            color: categoryMeta[subcatName]?.color,
          },
        ]
      : []),
  ];

  return (
    <div className={styles.categories_page}>
      <div className={styles.content_wrapper} ref={componentRef}>
        {catName && (
          <div className={styles.breadcrumb_wrapper}>
            <BreadcrumbMenu linkOnLast={false} menu={breadcrumbMenu} />
          </div>
        )}
        {displayKeys.length > 0 && (
          <div className={styles.header}>
            <h1 style={{ color: categoryMeta[heading]?.color }}>{heading}</h1>
          </div>
        )}
        {displayKeys.length > 0 ? (
          <div className={styles.cards_wrapper}>
            {displayKeys.map((name) => {
              const meta = categoryMeta[name];
              if (!meta) return null;
              const { src, alt, author, sourceUrl } = meta.image;
              const imageCredit =
                author || sourceUrl
                  ? [author ? `Photo by ${author}` : null, sourceUrl ?? null]
                      .filter(Boolean)
                      .join(" — ")
                  : undefined;
              return (
                <div key={name} className={styles.card_container}>
                  <CategoryCard
                    title={name}
                    tags={meta.tags.map(
                      (tag) => tag.charAt(0).toUpperCase() + tag.slice(1),
                    )}
                    description={meta.description}
                    href={`${hrefPrefix}/${nameToSlug(name)}`}
                    image={src}
                    imageAlt={alt}
                    imageCredit={imageCredit}
                    imageStyle={meta.imageStyle}
                    color={meta.color}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <Pagination
            title={heading}
            titleColor={categoryMeta[heading]?.color}
            collection={String(categoryMeta[heading]?.id)}
            containerRef={componentRef}
          />
        )}
      </div>
    </div>
  );
}
