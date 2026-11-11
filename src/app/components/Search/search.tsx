"use client";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import SearchBar from "./searchBar";
import styles from "./search.module.css";
import classNames from "classnames";
import AmbianceCard, {
  AmbianceCardProps,
} from "@/app/components/Ambiance Card/ambianceCard";
import ExpectedError from "@/app/components/Errors/Expected Error/errorExpected";
import MessageBox from "@/app/components/Message Box/messageBox";

const INITIAL_ENTRIES_WIDTH = 100; // in rem, needs to start wide

export default function Search({
  query,
  maxQueryLength,
  suggestionWords,
}: {
  query: string;
  maxQueryLength: number;
  suggestionWords: string[];
}) {
  // null until a search has completed
  const [items, setItems] = useState<AmbianceCardProps[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [entriesWidth, setEntriesWidth] = useState(INITIAL_ENTRIES_WIDTH);
  const [isInitialized, setIsInitialized] = useState(false);

  //Fetches the results from the backend
  const runSearch = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal,
        });
        const data = await res.json();
        // A newer search has started; leave its state alone
        if (signal?.aborted) return;
        if (data.errors) throw new Error();
        setItems(data.items);
        // New cards must be measured at full width, not in the last search's layout
        setEntriesWidth(INITIAL_ENTRIES_WIDTH);
        setIsError(false);
      } catch {
        if (signal?.aborted) return;
        setIsError(true);
      }
      setIsLoading(false);
    },
    [query],
  );

  useEffect(() => {
    if (!query) {
      setItems(null);
      setIsError(false);
      return;
    }
    const controller = new AbortController();
    runSearch(controller.signal);
    return () => controller.abort();
  }, [query, runSearch]);

  // Sizes the results container to a whole number of cards, same as Pagination
  const entryContainersRef = useRef<(HTMLDivElement | null)[]>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const initialEntryWidth = useRef(0);

  const calcEntriesWidth = useCallback(() => {
    if (!items || !entryContainersRef.current[0] || !resultsRef.current) {
      return 0;
    }
    const entryWidth =
      entryContainersRef.current[0].getBoundingClientRect().width;
    if (!initialEntryWidth.current) {
      initialEntryWidth.current = entryWidth;
    }
    const componentWidth =
      resultsRef.current.getBoundingClientRect().width - 32;
    let numEntries = Math.floor(componentWidth / entryWidth);
    if (
      numEntries === 1 &&
      initialEntryWidth.current &&
      Math.floor(componentWidth / initialEntryWidth.current) > 1
    ) {
      return (initialEntryWidth.current * 2) / 10;
    }
    if (items.length < numEntries) numEntries = items.length;
    return (entryWidth * numEntries) / 10;
  }, [items]);

  // A layout effect, so the measured width is applied before the new results are painted
  useLayoutEffect(() => {
    if (!resultsRef.current) return;
    const observer = new ResizeObserver(() => {
      setEntriesWidth(calcEntriesWidth());
      setIsInitialized(true);
    });
    observer.observe(resultsRef.current);
    setEntriesWidth(calcEntriesWidth());
    return () => observer.disconnect();
  }, [calcEntriesWidth]);

  return (
    <div
      className={classNames(styles.search, { [styles.landing]: !query })}
      ref={containerRef}
    >
      {!query && <h1 className={styles.heading}>Find the Perfect Sound</h1>}
      <SearchBar key={query} query={query} words={suggestionWords} maxLength={maxQueryLength} />

      {query && isError ? (
        <div className={styles.message_wrapper}>
          <ExpectedError
            reset={() => runSearch()}
            errorMessage="Something went wrong searching!"
            buttonText="Try Again"
          />
        </div>
      ) : query && items && items.length > 0 ? (
        <div
          className={classNames(styles.results, {
            [styles.hidden]: !isInitialized,
          })}
          ref={resultsRef}
        >
          <div
            className={classNames(styles.entries_wrapper, {
              [styles.mobile]: entriesWidth <= 40,
              [styles.one_item]: items.length === 1,
              [styles.loading]: isLoading,
            })}
            style={{ width: entriesWidth > 40 ? `${entriesWidth}rem` : `` }}
            aria-busy={isLoading}
          >
            {items.map((item, index) => {
              return (
                <div
                  className={styles.entry_container}
                  key={`entry-${item.id}`}
                  ref={(el) => {
                    entryContainersRef.current[index] = el;
                  }}
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
        </div>
      ) : (
        query &&
        items &&
        !isLoading && (
          <div className={styles.message_wrapper}>
            <MessageBox
              message={`No ambiances found for "${query}".`}
              buttonText="Browse Categories"
              href="/categories"
              ariaLive="polite"
              role="status"
            />
          </div>
        )
      )}
    </div>
  );
}
