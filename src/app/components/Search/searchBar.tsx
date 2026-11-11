"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MagnifyingGlassIcon from "@/app/components/Icons/magnifying_glass";
import styles from "./searchBar.module.css";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f-]/g, "");
}

export default function SearchBar({
  query,
  words,
  maxLength,
}: {
  query: string;
  words: string[];
  maxLength: number;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const prefix = normalize(value.trim());
  const suggestions =
    prefix.length >= 1
      ? words.filter((word) => normalize(word).startsWith(prefix)).slice(0, 5)
      : [];
  const expanded = open && suggestions.length > 0;

  function search(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setValue(trimmed);
    setOpen(false);
    setActive(-1);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div
      className={styles.searchBar}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        className={styles.searchForm}
        role="search"
        action="/search"
        onSubmit={(event) => {
          event.preventDefault();
          search(expanded && active >= 0 ? suggestions[active] : value);
        }}
      >
        <input
          ref={inputRef}
          name="q"
          type="text"
          role="combobox"
          aria-label="Search ambiances"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            expanded && active >= 0 ? `${listId}-${active}` : undefined
          }
          value={value}
          maxLength={maxLength}
          placeholder="Search ambiances"
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={!query}
          onChange={(event) => {
            setValue(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            } else if (
              (event.key === "ArrowDown" || event.key === "ArrowUp") &&
              suggestions.length
            ) {
              event.preventDefault();
              setOpen(true);
              setActive(
                event.key === "ArrowDown"
                  ? (active + 1) % suggestions.length
                  : (active <= 0 ? suggestions.length : active) - 1,
              );
            }
          }}
        />
        <button type="submit" aria-label="Search" title="Search">
          <MagnifyingGlassIcon />
        </button>
      </form>
      {expanded && (
        <ul
          id={listId}
          className={styles.suggestions}
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((word, index) => (
            <li
              key={word}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={active === index}
              className={styles.suggestion}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                search(word);
                inputRef.current?.focus();
              }}
            >
              <MagnifyingGlassIcon />
              {word}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
