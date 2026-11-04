"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./viewSubmitted.module.css";
import classNames from "classnames";
import { JSX } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Button from "@/app/components/Buttons/Button Set/button";
import AmbianceCard from "@/app/components/Ambiance Card/ambianceCard";
import { AmbianceCardProps } from "@/app/components/Ambiance Card/ambianceCard";

// Pagination view of the submitted ambiances
export default function ViewSubmitted({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const DEFAULT_PAGE_SIZE = 24;
  const DEFAULT_SORT = "oldest";
  const [items, setItems] = useState<AmbianceCardProps[]>([]);
  const [page, setPage] = useState(1);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [sort, setSort] = useState();
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const searchParams = useSearchParams();
  const path = usePathname();

  useEffect(() => {
    getItems();
  }, [searchParams]);

  //Fetches items from the backend
  async function getItems() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/submitted?${searchParams}`);
      const data = await res.json();
      if (data.errors) throw new Error();
      setPage(data.page);
      setNumPages(data.numPages);
      setSort(data.sort);
      setPageSize(data.pageSize);
      setItems(data.items);
      if (isError) setIsError(false);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Initalizes the component with correct width value for the entries container, updates it on resize
  const entryContainersRef = useRef<(HTMLDivElement | null)[]>([]);
  const componentRef = useRef<HTMLDivElement | null>(null);
  const [entriesWidth, setEntriesWidth] = useState(0); // in rem
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (!componentRef.current) return;
    const observer = new ResizeObserver(() => {
      setEntriesWidth(calcEntriesWidth());
    });
    observer.observe(componentRef.current);
    setEntriesWidth(calcEntriesWidth());

    setIsInitialized(true);
    return () => observer.disconnect();
  }, [items]);

  // Calculates the new entries width in rem
  function calcEntriesWidth() {
    if (
      entryContainersRef.current &&
      entryContainersRef.current[0] &&
      componentRef.current
    ) {
      const entryWidth =
        entryContainersRef.current[0].getBoundingClientRect().width;
      const componentWidth = componentRef.current.getBoundingClientRect().width;
      return (entryWidth * Math.floor(componentWidth / entryWidth)) / 10;
    }
    return 0;
  }

  //Creates the sort menu at the top of component
  function sortOptions() {
    const sortLink = (text: string, sortOption: string, key: string) => {
      let params: string[] = [];
      if (pageSize !== DEFAULT_PAGE_SIZE) params.push(`page_size=${pageSize}`);
      params.push(`sort=${sortOption}`);
      const queryString = params.toString() ? `?${params.join("&")}` : "";
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
    const sortOptionsArr: JSX.Element[] = [
      sortLink("Newest", "newest", "newest"),
      sortLink("Oldest", "oldest", "oldest"),
      //  sortLink("Popular", "popular", "popular"),
      //  sortLink("Best", "best", "best"),
    ];
    return (
      <div className={styles.sort_options} aria-label="Sort options">
        {sortOptionsArr}
      </div>
    );
  }

  //Creates a menu for changing page size at the top of the component
  function sizeOptions() {
    const pageSizeButton = (text: string, newPageSize: number) => {
      let params: string[] = [];
      if (page !== 1) params.push(`page=${page}`);

      params.push(`page_size=${newPageSize}`);

      if (sort !== DEFAULT_SORT) params.push(`sort=${sort}`);
      const queryString = params.toString() ? `?${params.join("&")}` : "";
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
    const pageSizesArr: JSX.Element[] = [
      pageSizeButton("12", 12),
      pageSizeButton("24", 24),
      pageSizeButton("36", 36),
      pageSizeButton("48", 48),
    ];
    return (
      <div className={styles.size_options} aria-label="Page size options">
        {pageSizesArr}
      </div>
    );
  }

  //Creates the pagination menu
  function paginationMenu() {
    const menuLink = (
      text: string,
      page: number,
      key: string,
      className?: string,
      ariaLabel?: string,
    ) => {
      let params: string[] = [];
      if (page !== 1) params.push(`page=${page}`);
      if (pageSize !== DEFAULT_PAGE_SIZE) params.push(`page_size=${pageSize}`);
      if (sort !== DEFAULT_SORT) params.push(`sort=${sort}`);
      const queryString = params.toString() ? `?${params.join("&")}` : "";
      return (
        <Link
          href={`${queryString}`}
          key={key}
          className={styles[className || ``]}
          aria-label={ariaLabel ? ariaLabel : `Go to page ${page}`}
        >
          {text}
        </Link>
      );
    };
    const menuArr: JSX.Element[] = [];
    const range = 2; //The +/- range for clickable pages from the one you're on

    let startPage = Math.max(page - range, 1);
    let endPage = Math.min(page + range, numPages);
    if (startPage === 1) {
      endPage = Math.min(1 + 2 * range, numPages);
    }
    if (endPage === numPages) {
      startPage = Math.max(numPages - 2 * range, 1);
    }
    if (page > 1) {
      menuArr.push(
        menuLink("<", page - 1, "left-arrow", "arrow", "Previous page"),
      );
    }
    if (page > 1 + range && numPages > 2 * range + 1) {
      menuArr.push(menuLink("1", 1, `page-1`));
      if (startPage > 2) {
        menuArr.push(
          <div
            className={styles.ellipsis}
            key="left-ellipsis"
            aria-hidden={true}
          >
            {`...`}
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
          <div
            className={styles.ellipsis}
            key="right-ellipsis"
            aria-hidden={true}
          >
            {`...`}
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

  function goToAmbiance(id: string) {
    window.open(`${path}/${id}`, "_blank");
  }

  return isError ? (
    <div className={styles.pagination}>
      <div className={styles.options_container}>
        {sortOptions()}
        {sizeOptions()}
      </div>

      <div className={styles.error_container}>
        <div
          className={styles.error_message}
          aria-live="assertive"
        >{`Something went wrong loading!`}</div>
        <Button
          text="Try Again"
          variant="secondary"
          onClick={getItems}
          style={{ minHeight: "5.4rem", fontSize: "1.8rem", minWidth: "90%" }}
        />
      </div>
    </div>
  ) : numPages ? (
    <div
      className={classNames(styles.pagination, {
        [styles.hidden]: !isInitialized,
      })}
      ref={componentRef}
    >
      <div className={styles.options_container}>
        {sortOptions()}
        {sizeOptions()}
      </div>

      <div
        className={classNames(styles.entries_wrapper, {
          [styles.mobile]: entriesWidth <= 40,
          [styles.loading]: isLoading,
        })}
        style={{ width: entriesWidth > 40 ? `${entriesWidth}rem` : `` }}
        aria-busy={isLoading}
      >
        {items.map((item, index) => {
          return (
            <div
              className={styles.entry_container}
              key={`entry-${page}-${sort}-${pageSize}-${index}`}
              ref={(el) => {
                if (entryContainersRef.current) {
                  entryContainersRef.current[index] = el;
                }
              }}
              onClick={() => goToAmbiance(item.id)}
            >
              <AmbianceCard
                id={item.id || ``}
                title={item.title || ``}
                thumbnail={item.thumbnail || ``}
                linkTo={"ambiance"}
                linkTarget={"_self"}
                containerRef={containerRef}
                views={item.views}
                author={item.author}
                ratingTotal={item.ratingTotal}
                ratingCount={item.ratingCount}
                datePublished={new Date(item.datePublished as Date)}
                description={item.description}
                mode={entriesWidth <= 40 ? "horizontal" : "vertical"}
              />
            </div>
          );
        })}
      </div>

      {paginationMenu()}
    </div>
  ) : null;
}
