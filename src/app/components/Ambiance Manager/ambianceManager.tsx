"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./ambianceManager.module.css";
import classNames from "classnames";
import TrashIcon from "@/app/components/Icons/trash";
import Button from "@/app/components/Buttons/Button Set/button";
import Modal from "@/app/components/Modals/Modal Versatile Portal/modal";
import AmbianceLoader from "@/app/components/Loaders/Ambiance Loader/loader";
import LoaderFullscreen from "@/app/components/Loaders/Loader Fullscreen/loaderFullscreen";
import ConfirmationBox from "@/app/components/Confirmation Box/confirmationBox";
import { useRouter } from "next/navigation";
import { AmbianceData } from "@/app/components/Ambiance Maker/ambianceMaker";
import AmbianceCard from "@/app/components/Ambiance Card/ambianceCard";
import DraftIcon from "@/app/components/Icons/draft";

interface SelectionManagerProps {
  itemsArr: AmbianceData[];
  itemType: "draft" | "published";
  headlineText: string;
  containerRef: React.RefObject<HTMLElement | null>;
  isLoading?: boolean;
}

export default function SelectionManager({
  itemsArr,
  itemType,
  headlineText,
  containerRef,
  isLoading = false,
}: SelectionManagerProps) {
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

  // Update the items when itemsArr changes
  useEffect(() => {
    setItems(itemsArr);
  }, [itemsArr]);

  // Initalizes the component with correct width value for the entries container, updates it on resize
  const [entriesWidth, setEntriesWidth] = useState(100); // in rem, should start wide
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

  // We are assuming the entry has fixed width which is smaller at large vw than it is at small vw.
  const initialEntryWidth = useRef(0);
  // Calculates the new entries width in rem
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
      // The -32 essentially places 16 padding on the sides of the entriesContainer
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

  // Adds escape / backspace functionality to the delete menu
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

  //Allows shift click selecting of checkboxes
  function handleCheckboxClick(e: React.MouseEvent, index: number) {
    if (itemType === "published") {
      if (checkboxRefs.current[index]?.checked) {
        checkboxRefs.current.forEach((checkbox, i) => {
          if (index != i && checkbox) {
            checkbox.checked = false;
          }
        });
      }
    }
    checkboxRefs.current.some((checkbox) => {
      return checkbox?.checked === true;
    })
      ? setShowDeleteButton(true)
      : setShowDeleteButton(false);
    if (itemType === "published") return;
    if (e.shiftKey && checkboxRefs.current[index]?.checked) {
      for (
        let i = Math.min(index, lastCheckboxChecked.current);
        i < Math.max(index, lastCheckboxChecked.current);
        i++
      ) {
        const checkbox = checkboxRefs.current[i];
        if (checkbox) {
          checkbox.checked = true;
        }
      }
    }
    if (checkboxRefs.current[index]?.checked) {
      lastCheckboxChecked.current = index;
    } else {
      if (selectAllRef.current) {
        selectAllRef.current.checked = false;
      }
    }
    const allChecked = checkboxRefs.current.every(
      (checkbox) => checkbox?.checked === true,
    );
    if (selectAllRef.current) {
      selectAllRef.current.checked = allChecked;
    }
  }

  //Does identical things as handleCheckboxClick for keydown
  function handleCheckboxKeydown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLDivElement>,
    index: number,
  ) {
    if (e.key === "Enter" || e.key === "Space") {
      const checkbox = checkboxRefs.current[index];
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      if (itemType === "published") {
        if (checkboxRefs.current[index]?.checked) {
          checkboxRefs.current.forEach((checkbox, i) => {
            if (index != i && checkbox) {
              checkbox.checked = false;
            }
          });
        }
        checkboxRefs.current.some((checkbox) => {
          return checkbox?.checked === true;
        })
          ? setShowDeleteButton(true)
          : setShowDeleteButton(false);
        return;
      }
      if (e.shiftKey && checkboxRefs.current[index]?.checked) {
        for (
          let i = Math.min(index, lastCheckboxChecked.current);
          i < Math.max(index, lastCheckboxChecked.current);
          i++
        ) {
          const checkbox = checkboxRefs.current[i];
          if (checkbox) {
            checkbox.checked = true;
          }
        }
      }
      if (checkboxRefs.current[index]?.checked) {
        lastCheckboxChecked.current = index;
      } else {
        if (selectAllRef.current) {
          selectAllRef.current.checked = false;
        }
      }
      checkboxRefs.current.some((checkbox) => {
        return checkbox?.checked === true;
      })
        ? setShowDeleteButton(true)
        : setShowDeleteButton(false);
      // Check if all checkboxes are now checked
      const allChecked = checkboxRefs.current.every(
        (checkbox) => checkbox?.checked === true,
      );
      if (selectAllRef.current) {
        selectAllRef.current.checked = allChecked;
      }
    }
  }

  //Deletes all entries selected
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
    const res = await fetch("/api/ambiance/delete", options);
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

  // Opens the dialog box to confirm deleting the entries
  function confirmDeletion() {
    const toBeDeleted = checkboxRefs.current
      .map((checkbox) =>
        checkbox?.checked === true ? checkbox.dataset.itemId : -1,
      )
      .filter((result) => result !== -1);
    let plural = toBeDeleted.length > 1;
    let message = `Are you sure you want to delete `;
    if (toBeDeleted.length === items.length && plural) {
      message += `all of your `;
    } else {
      message += `${plural ? `these ${toBeDeleted.length} ` : "this "}`;
    }
    message += `${itemType === "published" ? "published ambiance" : "draft"}${plural ? "s" : ""}? You won't be able to get ${plural ? "them" : "it"} back.`;
    confirmDeleteMessage.current = message;
    setShowConfirmDelete(true);
  }

  function handleSelectAll() {
    if (selectAllRef.current && selectAllRef.current.checked) {
      checkboxRefs.current.forEach((checkbox) => {
        if (checkbox) {
          checkbox.checked = true;
        }
      });
      setShowDeleteButton(true);
    } else {
      checkboxRefs.current.forEach((checkbox) => {
        if (checkbox) {
          checkbox.checked = false;
        }
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
            ariaLabel={`Confirm Deletion Panel`}
          />
        </Modal>
      )}
      {showLoading && (
        <LoaderFullscreen ariaLabel={`Deleting... Please wait.`}>
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
            {itemType === "draft" && <DraftIcon />}
            {headlineText}
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
              style={{}}
            >{`Cancel`}</Button>
            {showDeleteButton ? (
              <Button
                variant="primary"
                title="Delete selected items"
                onClick={confirmDeletion}
              >{`Delete`}</Button>
            ) : (
              <Button
                variant="tertiary"
                ariaLabel="Select items to enable this delete button"
                aria-disabled="true"
                disabled={true}
                onClick={() => {}}
              >{`Delete`}</Button>
            )}
          </div>
        )}
        <div className={styles.entries_and_select_all_wrapper}>
          {showDeleteMenu && itemType === "draft" && (
            <div className={styles.select_all_wrapper}>
              <input
                type={"checkbox"}
                className={styles.checkbox}
                onClick={handleSelectAll}
                onKeyDown={handleSelectAllKeydown}
                ref={selectAllRef}
                aria-label="Select all items"
              />
              <div>{`Select All`}</div>
            </div>
          )}
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
                          checkboxRefs.current[index] &&
                          checkboxRefs.current[index].checked
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
                    linkTo={item.datePublished ? "ambiance" : "draft"}
                    linkTarget={showDeleteMenu ? "_blank" : "_self"}
                    containerRef={containerRef}
                    views={item.views}
                    author={item.author}
                    ratingTotal={item.ratingTotal}
                    ratingCount={item.ratingCount}
                    datePublished={item.datePublished}
                    dateUpdated={item.dateUpdated}
                    description={item.description}
                    banner={
                      item.status === "submitted" ? "submitted" : undefined
                    }
                    mode={entriesWidth <= 40 ? "horizontal" : "vertical"}
                    key={index}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className={styles.selection_manager}>
      <div className={styles.content_wrapper}>
        <div className={classNames(styles.selection_manager_header)}>
          <h1>
            {itemType === "draft" && <DraftIcon />}
            {headlineText}
          </h1>
        </div>
        <div className={styles.message_wrapper}>
          <div className={styles.message}>
            {itemType === "draft"
              ? `You don't have any drafts yet. Ambiances you save will appear here.`
              : `You haven't published any ambiances. Create a draft to get started.`}
          </div>
        </div>
      </div>
    </div>
  );
}
