"use client";
import Pagination from "@/app/components/Pagination/pagination";
import styles from "./page.module.css";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AmbianceManager from "@/app/components/Ambiance Manager/ambianceManager";
import ExpectedError from "@/app/components/Errors/Expected Error/errorExpected";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import classNames from "classnames";

type SortOption = "newest" | "oldest" | "popular" | "best";

export interface InitialOwnerData {
  items: Array<{
    id: string;
    title: string;
    status: string;
    thumbnail: string;
    views: number;
    ratingTotal?: number;
    ratingCount?: number;
    datePublished: string | undefined;
    videoData: never[];
  }>;
  numPages: number;
  page: number;
  sort: SortOption;
}

export default function UsernameClient({
  username,
  isOwner = false,
  initialData = null,
}: {
  username: string;
  isOwner?: boolean;
  initialData?: InitialOwnerData | null;
}) {
  if (isOwner) {
    return <OwnerView username={username} initialData={initialData} />;
  }
  return <PublicView username={username} />;
}

function PublicView({ username }: { username: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className={styles.user_page} ref={containerRef}>
      <div className={styles.pagination_wrapper}>
        <Pagination
          title={username}
          collection={`user_${username}`}
          containerRef={containerRef}
        />
      </div>
    </div>
  );
}

function convertDates(items: InitialOwnerData["items"]): AmbianceData[] {
  return items.map((item) => ({
    ...item,
    status: item.status as AmbianceData["status"],
    datePublished: item.datePublished
      ? new Date(item.datePublished)
      : undefined,
  }));
}

function OwnerView({
  username,
  initialData,
}: {
  username: string;
  initialData: InitialOwnerData | null | undefined;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [ambiances, setAmbiances] = useState<AmbianceData[]>(() =>
    convertDates(initialData?.items ?? []),
  );
  const [page, setPage] = useState(initialData?.page ?? 1);
  const [numPages, setNumPages] = useState(initialData?.numPages ?? 1);
  const [sort, setSort] = useState<SortOption>(initialData?.sort ?? "newest");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(initialData != null);

  useEffect(() => {
    router.refresh();
  }, [router]);

  const fetchPage = useCallback(
    async (targetPage: number, targetSort: SortOption) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch(
          `/api/pagination/published?page=${targetPage}&sort=${targetSort}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data.errors) throw new Error(data.errors);
        setAmbiances(
          data.items.map((item: AmbianceData & { datePublished?: string }) => ({
            ...item,
            datePublished: item.datePublished
              ? new Date(item.datePublished)
              : undefined,
          })),
        );
        setPage(data.page);
        setNumPages(data.numPages);
        setSort(data.sort);
        setIsError(false);
        setIsInitialized(true);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setIsError(true);
        setIsInitialized(true);
      } finally {
        // An aborted request means a newer one is in flight; let that one clear the flag
        if (abortControllerRef.current === controller) setIsLoading(false);
      }
    },
    [],
  );

  // Only fetch on mount if server didn't provide initial data
  useEffect(() => {
    if (!isInitialized) {
      fetchPage(1, "newest");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    fetchPage(newPage, sort);
    containerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fetchPage, sort]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    fetchPage(1, newSort);
  }, [fetchPage]);

  function paginationNav() {
    if (numPages <= 1) return null;
    const range = 2;
    let startPage = Math.max(page - range, 1);
    let endPage = Math.min(page + range, numPages);
    if (endPage <= 1) return null;
    if (startPage === 1) endPage = Math.min(1 + 2 * range, numPages);
    if (endPage === numPages) startPage = Math.max(numPages - 2 * range, 1);

    const items: React.ReactNode[] = [];

    if (page > 1) {
      items.push(
        <button
          key="prev"
          className={styles.page_arrow}
          onClick={() => handlePageChange(page - 1)}
          aria-label="Previous page"
        >
          {"<"}
        </button>,
      );
    }
    if (page > 1 + range && numPages > 2 * range + 1) {
      items.push(
        <button
          key="page-1"
          className={styles.page_btn}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>,
      );
      if (startPage > 2) {
        items.push(
          <span key="left-ellipsis" className={styles.ellipsis}>
            ...
          </span>,
        );
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      if (i === page) {
        items.push(
          <span
            key={`page-${i}`}
            className={styles.current_page}
            aria-current="page"
          >
            {i}
          </span>,
        );
      } else {
        items.push(
          <button
            key={`page-${i}`}
            className={styles.page_btn}
            onClick={() => handlePageChange(i)}
            aria-label={`Go to page ${i}`}
          >
            {i}
          </button>,
        );
      }
    }
    if (page < numPages - range && numPages > 2 * range + 1) {
      if (endPage < numPages - 1) {
        items.push(
          <span key="right-ellipsis" className={styles.ellipsis}>
            ...
          </span>,
        );
      }
      items.push(
        <button
          key={`page-${numPages}`}
          className={styles.page_btn}
          onClick={() => handlePageChange(numPages)}
          aria-label={`Go to page ${numPages}`}
        >
          {numPages}
        </button>,
      );
    }
    if (page < numPages) {
      items.push(
        <button
          key="next"
          className={styles.page_arrow}
          onClick={() => handlePageChange(page + 1)}
          aria-label="Next page"
        >
          {">"}
        </button>,
      );
    }

    return (
      <nav className={styles.pagination_nav} aria-label="Pagination">
        {items}
      </nav>
    );
  }

  function sortMenu() {
    const options: { label: string; value: SortOption }[] = [
      { label: "Newest", value: "newest" },
      { label: "Oldest", value: "oldest" },
      { label: "Popular", value: "popular" },
      { label: "Best", value: "best" },
    ];
    return (
      <div className={styles.sort_menu} aria-label="Sort options">
        {options.map((opt) => (
          <button
            key={opt.value}
            className={classNames(styles.sort_btn, {
              [styles.sort_active]: sort === opt.value,
            })}
            onClick={() => handleSortChange(opt.value)}
            aria-label={`Sort by ${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.owner_view}>
        <div className={styles.error_wrapper}>
          <ExpectedError
            errorMessage="Something went wrong getting your ambiances."
            buttonText="Try Again"
            reset={() => fetchPage(page, sort)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.owner_view} ref={containerRef}>
      {isInitialized && (
        <div className={styles.manager_wrapper}>
          <div className={styles.sort_menu_wrapper}>{sortMenu()}</div>
          <AmbianceManager
            // Remounting per page/sort closes the delete menu and clears its
            // index-based checkbox selection so it can't carry over to new items
            key={`${page}-${sort}`}
            itemsArr={ambiances}
            containerRef={containerRef}
            headlineText={username}
            itemType="published"
            isLoading={isLoading}
          />
          {paginationNav()}
        </div>
      )}
    </div>
  );
}
