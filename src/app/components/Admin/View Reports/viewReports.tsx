"use client";
import React, { useState, useEffect, JSX } from "react";
import Link from "next/link";
import styles from "./viewReports.module.css";
import classNames from "classnames";
import { useSearchParams, usePathname } from "next/navigation";
import Button from "@/app/components/Buttons/Button Set/button";

interface ReportItem {
  id: string;
  ambianceId: string;
  ambianceTitle: string;
  thumbnail: string;
  reportType: "broken" | "other";
  message: string;
  reporter: string;
  createdAt: string;
}

export default function ViewReports() {
  const DEFAULT_PAGE_SIZE = 24;
  const DEFAULT_SORT = "oldest";
  const [items, setItems] = useState<ReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [sort, setSort] = useState<string>();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const searchParams = useSearchParams();
  const path = usePathname();

  useEffect(() => {
    getItems();
  }, [searchParams]);

  async function getItems() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?${searchParams}`);
      const data = await res.json();
      if (data.errors) throw new Error();
      setPage(data.page);
      setNumPages(data.numPages);
      setSort(data.sort);
      setPageSize(data.pageSize);
      setItems(data.items);
      if (isError) setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function sortOptions() {
    const sortLink = (text: string, sortOption: string, key: string) => {
      const params: string[] = [];
      if (pageSize !== DEFAULT_PAGE_SIZE) params.push(`page_size=${pageSize}`);
      params.push(`sort=${sortOption}`);
      const queryString = params.length ? `?${params.join("&")}` : "";
      return (
        <Link
          href={`${queryString}`}
          key={key}
          className={classNames(styles.sort_option, {
            [styles.active]: sort === sortOption,
          })}
          aria-label={`Sort by ${sortOption}`}
        >
          <div className={styles.option_content}>{text}</div>
        </Link>
      );
    };
    return (
      <div className={styles.sort_options} aria-label="Sort options">
        {sortLink("Newest", "newest", "newest")}
        {sortLink("Oldest", "oldest", "oldest")}
      </div>
    );
  }

  function sizeOptions() {
    const pageSizeButton = (text: string, newPageSize: number) => {
      const params: string[] = [];
      if (page !== 1) params.push(`page=${page}`);
      params.push(`page_size=${newPageSize}`);
      if (sort !== DEFAULT_SORT) params.push(`sort=${sort}`);
      const queryString = params.length ? `?${params.join("&")}` : "";
      return (
        <Link
          href={`${queryString}`}
          key={newPageSize}
          className={classNames(styles.size_option, {
            [styles.active]: pageSize === newPageSize,
          })}
          aria-label={`Change page size to ${newPageSize} items`}
        >
          <div className={styles.option_content}>{text}</div>
        </Link>
      );
    };
    return (
      <div className={styles.size_options} aria-label="Page size options">
        {pageSizeButton("12", 12)}
        {pageSizeButton("24", 24)}
        {pageSizeButton("36", 36)}
        {pageSizeButton("48", 48)}
      </div>
    );
  }

  function paginationMenu() {
    const menuLink = (
      text: string,
      targetPage: number,
      key: string,
      className?: string,
      ariaLabel?: string,
    ) => {
      const params: string[] = [];
      if (targetPage !== 1) params.push(`page=${targetPage}`);
      if (pageSize !== DEFAULT_PAGE_SIZE) params.push(`page_size=${pageSize}`);
      if (sort !== DEFAULT_SORT) params.push(`sort=${sort}`);
      const queryString = params.length ? `?${params.join("&")}` : "";
      return (
        <Link
          href={`${queryString}`}
          key={key}
          className={styles[className || ``]}
          aria-label={ariaLabel ? ariaLabel : `Go to page ${targetPage}`}
        >
          {text}
        </Link>
      );
    };
    const menuArr: JSX.Element[] = [];
    const range = 2;

    let startPage = Math.max(page - range, 1);
    let endPage = Math.min(page + range, numPages);
    if (startPage === 1) endPage = Math.min(1 + 2 * range, numPages);
    if (endPage === numPages) startPage = Math.max(numPages - 2 * range, 1);

    if (page > 1) {
      menuArr.push(
        menuLink("<", page - 1, "left-arrow", "arrow", "Previous page"),
      );
    }
    if (page > 1 + range && numPages > 2 * range + 1) {
      menuArr.push(menuLink("1", 1, "page-1"));
      if (startPage > 2) {
        menuArr.push(
          <div className={styles.ellipsis} key="left-ellipsis" aria-hidden>
            ...
          </div>,
        );
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      i === page
        ? menuArr.push(
            <div
              className={styles.current_page}
              key={`page-${page}`}
              aria-current="page"
            >
              {page}
            </div>,
          )
        : menuArr.push(menuLink(`${i}`, i, `page-${i}`));
    }
    if (page < numPages - range && numPages > 2 * range + 1) {
      if (endPage < numPages - 1) {
        menuArr.push(
          <div className={styles.ellipsis} key="right-ellipsis" aria-hidden>
            ...
          </div>,
        );
      }
      menuArr.push(menuLink(`${numPages}`, numPages, `page-${numPages}`));
    }
    if (page < numPages) {
      menuArr.push(
        menuLink(">", page + 1, "right-arrow", "arrow", "Next Page"),
      );
    }
    return (
      <nav className={styles.pagination_menu} aria-label="Pagination">
        {menuArr}
      </nav>
    );
  }

  function goToReport(id: string) {
    window.open(`${path}/${id}`, "_blank");
  }

  return isError ? (
    <div className={styles.view_reports}>
      <div className={styles.options_container}>
        {sortOptions()}
        {sizeOptions()}
      </div>
      <div className={styles.error_container}>
        <div className={styles.error_message} aria-live="assertive">
          Something went wrong loading!
        </div>
        <Button
          text="Try Again"
          variant="secondary"
          onClick={getItems}
          style={{ minHeight: "5.4rem", fontSize: "1.8rem", minWidth: "90%" }}
        />
      </div>
    </div>
  ) : numPages ? (
    <div className={styles.view_reports}>
      <div className={styles.options_container}>
        {sortOptions()}
        {sizeOptions()}
      </div>
      <div
        className={classNames(styles.reports_list, {
          [styles.loading]: isLoading,
        })}
        aria-busy={isLoading}
      >
        {items.map((item) => (
          <div
            className={styles.report_row}
            key={item.id}
            onClick={() => goToReport(item.id)}
          >
            {item.thumbnail && (
              <img
                className={styles.thumbnail}
                src={item.thumbnail}
                alt=""
                loading="lazy"
              />
            )}
            <div className={styles.report_info}>
              <div className={styles.report_title}>{item.ambianceTitle}</div>
              <div className={styles.report_meta}>
                <span>by {item.reporter}</span>
                {item.message && (
                  <span>
                    &quot;
                    {item.message.length > 60
                      ? item.message.slice(0, 60) + "..."
                      : item.message}
                    &quot;
                  </span>
                )}
              </div>
            </div>
            <div
              className={classNames(styles.report_type, {
                [styles.broken]: item.reportType === "broken",
                [styles.other]: item.reportType === "other",
              })}
            >
              {item.reportType === "broken" ? "Broken Link" : "Other"}
            </div>
            <div className={styles.report_date}>
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        ))}
      </div>
      {paginationMenu()}
    </div>
  ) : null;
}
