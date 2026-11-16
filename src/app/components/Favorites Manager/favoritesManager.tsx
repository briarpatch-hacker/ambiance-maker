"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./favoritesManager.module.css";
import classNames from "classnames";
import TrashIcon from "@/app/components/Icons/trash";
import BookmarkIcon from "@/app/components/Icons/bookmark";
import Button from "@/app/components/Buttons/Button Set/button";
import Modal from "@/app/components/Modals/Modal Versatile Portal/modal";
import AmbianceLoader from "@/app/components/Loaders/Ambiance Loader/loader";
import LoaderFullscreen from "@/app/components/Loaders/Loader Fullscreen/loaderFullscreen";
import ConfirmationBox from "@/app/components/Confirmation Box/confirmationBox";
import { useRouter } from "next/navigation";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import AmbianceCard from "@/app/components/Ambiance Card/ambianceCard";

interface FavoritesManagerProps {
  itemsArr: AmbianceData[];
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function FavoritesManager({
  itemsArr,
  containerRef,
}: FavoritesManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(itemsArr);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const confirmDeleteMessage = useRef("");

  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);
  const entryContainersRef = useRef<(HTMLDivElement | null)[]>([]);
  const componentRef = useRef<HTMLDivElement | null>(null);
  const lastCheckboxChecked = useRef(0);

  useEffect(() => {
    setItems(itemsArr);
  }, [itemsArr]);

  const [entriesWidth, setEntriesWidth] = useState(100);
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (!componentRef.current) return;
    const observer = new ResizeObserver(() => {
      setEntriesWidth(calcEntriesWidth());
      setIsInitialized(true);
    });
    observer.observe(componentRef.current);
    setEntriesWidth(calcEntriesWidth());
    return () => observer.disconnect();
  }, [items]);

  const initialEntryWidth = useRef(0);
  function calcEntriesWidth() {
    if (
      entryContainersRef.current &&
      entryContainersRef.current[0] &&
      componentRef.current
    ) {
      const entryWidth =
        entryContainersRef.current[0].getBoundingClientRect().width;
      if (!initialEntryWidth.current) {
        initialEntryWidth.current = entryWidth;
      }
      const componentWidth =
        componentRef.current.getBoundingClientRect().width - 32;
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
    }
    return 0;
  }

  useEffect(() => {
    if (showDeleteMenu) {
      window.addEventListener("keydown", handleKeydown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [showDeleteMenu, showDeleteButton]);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeDeleteMenu();
    } else if (e.key === "Backspace") {
      if (showDeleteButton) {
        confirmDeletion();
      }
    }
  }

  function openDeleteMenu() {
    lastCheckboxChecked.current = 0;
    setShowDeleteMenu(true);
  }

  function closeDeleteMenu() {
    setShowDeleteMenu(false);
    setShowDeleteButton(false);
  }

  function handleCheckboxClick(e: React.MouseEvent, index: number) {
    checkboxRefs.current.some((checkbox) => checkbox?.checked === true)
      ? setShowDeleteButton(true)
      : setShowDeleteButton(false);

    if (e.shiftKey && checkboxRefs.current[index]?.checked) {
      for (
        let i = Math.min(index, lastCheckboxChecked.current);
        i < Math.max(index, lastCheckboxChecked.current);
        i++
      ) {
        const checkbox = checkboxRefs.current[i];
        if (checkbox) checkbox.checked = true;
      }
    }
    if (checkboxRefs.current[index]?.checked) {
      lastCheckboxChecked.current = index;
    } else {
      if (selectAllRef.current) selectAllRef.current.checked = false;
    }
    const allChecked = checkboxRefs.current.every(
      (checkbox) => checkbox?.checked === true,
    );
    if (selectAllRef.current) selectAllRef.current.checked = allChecked;
  }

  function handleCheckboxKeydown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>,
    index: number,
  ) {
    if (e.key === "Enter" || e.key === "Space") {
      const checkbox = checkboxRefs.current[index];
      if (checkbox) checkbox.checked = !checkbox.checked;

      if (e.shiftKey && checkboxRefs.current[index]?.checked) {
        for (
          let i = Math.min(index, lastCheckboxChecked.current);
          i < Math.max(index, lastCheckboxChecked.current);
          i++
        ) {
          const cb = checkboxRefs.current[i];
          if (cb) cb.checked = true;
        }
      }
      if (checkboxRefs.current[index]?.checked) {
        lastCheckboxChecked.current = index;
      } else {
        if (selectAllRef.current) selectAllRef.current.checked = false;
      }
      checkboxRefs.current.some((cb) => cb?.checked === true)
        ? setShowDeleteButton(true)
        : setShowDeleteButton(false);
      const allChecked = checkboxRefs.current.every(
        (cb) => cb?.checked === true,
      );
      if (selectAllRef.current) selectAllRef.current.checked = allChecked;
    }
  }

  async function deleteEntries() {
    setShowConfirmDelete(false);
    setShowLoading(true);
    const indexesToBeDeleted = checkboxRefs.current
      .map((checkbox, index) => (checkbox?.checked === true ? index : -1))
      .filter((index) => index !== -1);
    const itemsToBeDeleted = checkboxRefs.current
      .map((checkbox) =>
        checkbox?.checked === true ? checkbox.dataset.itemId : -1,
      )
      .filter((itemId) => itemId !== -1);
    const options = {
      method: "DELETE",
      body: JSON.stringify({ items: itemsToBeDeleted }),
      headers: { "Content-Type": "application/json" },
    };
    const res = await fetch("/api/favorites/delete", options);
    const data = await res.json();
    if (data.success) {
      const newItems: AmbianceData[] = [];
      items.map((item, index) => {
        indexesToBeDeleted[0] === index
          ? indexesToBeDeleted.shift()
          : newItems.push(item);
      });
      setItems(newItems);
    } else {
      if (data.logout) {
        router.push("/login");
      }
    }
    setShowLoading(false);
    setShowDeleteButton(false);
    setShowDeleteMenu(false);
  }

  function confirmDeletion() {
    const toBeDeleted = checkboxRefs.current
      .map((checkbox) =>
        checkbox?.checked === true ? checkbox.dataset.itemId : -1,
      )
      .filter((result) => result !== -1);
    const plural = toBeDeleted.length > 1;
    let message = `Are you sure you want to remove `;
    if (toBeDeleted.length === items.length && plural) {
      message += `all ${toBeDeleted.length} `;
    } else {
      message += plural ? `these ${toBeDeleted.length} ` : `this `;
    }
    message += `${plural ? "ambiances" : "ambiance"} from your favorites? You can always re-add ${plural ? "them" : "it"} later.`;
    confirmDeleteMessage.current = message;
    setShowConfirmDelete(true);
  }

  function handleSelectAll() {
    if (selectAllRef.current?.checked) {
      checkboxRefs.current.forEach((cb) => {
        if (cb) cb.checked = true;
      });
      setShowDeleteButton(true);
    } else {
      checkboxRefs.current.forEach((cb) => {
        if (cb) cb.checked = false;
      });
      setShowDeleteButton(false);
    }
  }

  function handleSelectAllKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectAllRef.current) {
        selectAllRef.current.checked = !selectAllRef.current.checked;
        handleSelectAll();
      }
    }
  }

  return items.length > 0 ? (
    <div
      className={classNames(styles.selection_manager, {
        [styles.hidden]: !isInitialized,
      })}
      ref={componentRef}
    >
      {showConfirmDelete && (
        <Modal
          closeFunction={() => setShowConfirmDelete(false)}
          animate={true}
          unstyled={true}
        >
          <ConfirmationBox
            message={confirmDeleteMessage.current}
            onConfirm={deleteEntries}
            onCancel={() => setShowConfirmDelete(false)}
            ariaLabel="Confirm Remove from Favorites"
          />
        </Modal>
      )}
      {showLoading && (
        <LoaderFullscreen ariaLabel="Removing... Please wait.">
          <AmbianceLoader color="var(--grey-text)" />
        </LoaderFullscreen>
      )}
      <div className={styles.content_wrapper}>
        <div
          className={classNames(styles.selection_manager_header, {
            [styles.show_delete_menu]: showDeleteMenu,
          })}
        >
          <h1>
            <BookmarkIcon
              style={{ transform: "scale(1.4) translateY(0.1rem)" }}
            />
            Favorites
          </h1>
          <div>
            {!showDeleteMenu && (
              <div className={styles.trash_btn_wrapper}>
                <Button
                  variant="tertiary"
                  onClick={openDeleteMenu}
                  title="Open Delete Menu"
                  width="smallest"
                >
                  <TrashIcon />
                </Button>
              </div>
            )}
          </div>
        </div>
        {showDeleteMenu && (
          <div className={styles.delete_menu}>
            <Button
              variant="tertiary"
              title="Close Delete Menu"
              onClick={closeDeleteMenu}
            >{`Cancel`}</Button>
            {showDeleteButton ? (
              <Button
                variant="primary"
                title="Remove selected favorites"
                onClick={confirmDeletion}
              >{`Remove`}</Button>
            ) : (
              <Button
                variant="tertiary"
                ariaLabel="Select items to enable this remove button"
                aria-disabled="true"
                disabled={true}
                onClick={() => {}}
              >{`Remove`}</Button>
            )}
          </div>
        )}
        <div className={styles.entries_and_select_all_wrapper}>
          {showDeleteMenu && (
            <div className={styles.select_all_wrapper}>
              <input
                type={"checkbox"}
                className={styles.checkbox}
                onClick={handleSelectAll}
                onKeyDown={handleSelectAllKeydown}
                ref={selectAllRef}
                aria-label="Select all favorites"
              />
              <div>{`Select All`}</div>
            </div>
          )}
          <div
            className={classNames(styles.entries_wrapper, {
              [styles.mobile]: entriesWidth <= 40,
              [styles.one_item]: items.length === 1,
            })}
            style={{ width: entriesWidth > 40 ? `${entriesWidth}rem` : `` }}
          >
            {items.map((item, index) => (
              <div
                className={styles.entry_container}
                key={`entry-${index}`}
                ref={(el) => {
                  if (entryContainersRef.current) {
                    entryContainersRef.current[index] = el;
                  }
                }}
              >
                {showDeleteMenu && (
                  <div className={styles.checkbox_wrapper}>
                    <input
                      type={"checkbox"}
                      className={styles.checkbox}
                      ref={(el) => {
                        checkboxRefs.current[index] = el;
                      }}
                      onClick={(e) => handleCheckboxClick(e, index)}
                      onKeyDown={(e) => handleCheckboxKeydown(e, index)}
                      data-item-id={item.id}
                      data-item-title={item.title}
                      aria-label={
                        checkboxRefs.current[index]?.checked
                          ? `Deselect item`
                          : `Select item`
                      }
                    />
                  </div>
                )}
                <AmbianceCard
                  id={item.id || ``}
                  title={item.title || ``}
                  thumbnail={item.thumbnail || ``}
                  linkTo="ambiance"
                  linkTarget={showDeleteMenu ? "_blank" : "_self"}
                  containerRef={containerRef}
                  views={item.views}
                  author={item.author}
                  ratingTotal={item.ratingTotal}
                  ratingCount={item.ratingCount}
                  datePublished={item.datePublished}
                  description={item.description}
                  mode={
                    entriesWidth <= 40 && items.length > 1
                      ? "horizontal"
                      : "vertical"
                  }
                  key={index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.selection_manager}>
      <div className={styles.content_wrapper}>
        <div className={classNames(styles.selection_manager_header)}>
          <h1>
            <BookmarkIcon
              style={{ transform: "scale(1.4) translateY(0.1rem)" }}
            />
            Favorites
          </h1>
        </div>
        <div className={styles.message_wrapper}>
          <div
            className={styles.message}
          >{`You don't have any favorite ambiances yet. Browse and bookmark the ones you enjoy.`}</div>
        </div>
      </div>
    </div>
  );
}
