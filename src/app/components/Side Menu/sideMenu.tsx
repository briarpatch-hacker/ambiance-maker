"use client";
import React, { useState, useEffect, useRef } from "react";
import { preload } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import styles from "./sideMenu.module.css";
import classNames from "classnames";
import Profile from "@/app/components/Icons/profile";
import Modal from "@/app/components/Modals/Modal Versatile Portal/modal";
import LoginCard from "@/app/components/Login Card/loginCard";
import Hamburger from "@/app/components/Icons/hamburger";
import CloseMenuIcon from "@/app/components/Icons/close_menu";
import DraftIcon from "@/app/components/Icons/draft";
import LogoutIcon from "@/app/components/Icons/logout";
import PencilIcon from "@/app/components/Icons/pencil";
import SettingsIcon from "@/app/components/Icons/settings";
import BooksIcon from "@/app/components/Icons/books";
import BookmarkIcon from "@/app/components/Icons/bookmark";
import { useUser } from "@/app/contexts/userContext";

interface SideMenuProps {
  style?: React.CSSProperties;
  defaultExpanded?: boolean;
}

export default function SideMenu({
  style,
  defaultExpanded = true,
}: SideMenuProps) {
  const user = useUser();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const breakpoint = useRef(580);
  const [showModal, setShowModal] = useState(false);

  // Preloads and caches login banner
  // Appears instantly when non-logged user hits "Login"
  if (!user) {
    preload("/images/login-banner.jpg", { as: "image" });
  }

  const [showContactModal, setShowContactModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isExpanding, setIsExpanding] = useState(false);
  const expandTimeout = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    return () => {
      if (expandTimeout.current) {
        clearTimeout(expandTimeout.current);
      }
    };
  }, []);

  // Collapses the menu after a link is clicked on mobile
  function linkClicked() {
    if (window.innerWidth < breakpoint.current) {
      setIsExpanded(false);
    }
  }

  // Expands the menu with an expanding visual effect
  function expand() {
    setIsExpanded(true);
    setIsExpanding(true);
    if (expandTimeout.current) {
      clearTimeout(expandTimeout.current);
    }
    window.localStorage.setItem("menuExpanded", "true");
    expandTimeout.current = setTimeout(() => {
      setIsExpanding(false);
    }, 150);
  }

  // Collapses the menu
  function collapse() {
    setIsExpanded(false);
    window.localStorage.setItem("menuExpanded", "false");
  }

  async function logout() {
    try {
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      };
      await fetch("/api/auth/logout", options);
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }

  return (
    <nav
      style={{ ...style }}
      className={classNames(styles.side_menu, {
        [styles.expanded]: isExpanded,
        [styles.expanding]: isExpanding,
      })}
      ref={menuRef}
    >
      <div
        className={classNames(styles.fixed_wrapper, {
          [styles.expanded]: isExpanded,
          [styles.expanding]: isExpanding,
        })}
      >
        {showModal && (
          <Modal
            closeFunction={() => setShowModal(false)}
            closeButton={true}
            animate={true}
            closeOnEscape={true}
            closeOnBackdropClick={true}
            unstyled={true}
            modalStyle={{ paddingBottom: "4vh" }}
          >
            <LoginCard path={window.location.pathname} />
          </Modal>
        )}
        {showContactModal && (
          <Modal
            closeFunction={() => setShowContactModal(false)}
            closeButton={true}
            animate={true}
            closeOnEscape={true}
            closeOnBackdropClick={true}
            unstyled={true}
            centered={true}
          >
            <div className={styles.contact_card}>
              <p className={styles.contact_card_title}>Contact Us</p>
              <p className={styles.contact_card_text}>
                For questions or support, reach us at:
              </p>
              <div className={styles.contact_card_email}>
                support@ambiancemaker.com
              </div>
            </div>
          </Modal>
        )}
        <header className={styles.header}>
          <Link
            href="/"
            onClick={linkClicked}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Image
              height="80"
              width="80"
              alt="Ambiance Maker Logo"
              src="/images/logo.jpg"
              style={{ borderRadius: "20%", transform: "scale(.8)" }}
              unoptimized
            />
          </Link>
        </header>
        <div className={styles.menu_controls}>
          {isExpanded ? (
            <button title="Collapse Menu" onClick={collapse}>
              <CloseMenuIcon />
            </button>
          ) : (
            <button title="Expand Menu" onClick={expand}>
              <Hamburger style={{ padding: "0.4rem" }} />
            </button>
          )}
        </div>
        <div className={styles.menu_items}>
          <Link
            href="/categories"
            title="Browse"
            className={styles.menu_item}
            onClick={linkClicked}
          >
            <div className={styles.item_content}>
              <BooksIcon />
              <span>Browse</span>
            </div>
          </Link>
          <Link
            href="/create"
            title="Create"
            className={styles.menu_item}
            onClick={linkClicked}
          >
            <div className={styles.item_content}>
              <PencilIcon />
              <span>Create</span>
            </div>
          </Link>
          {!user && (
            <button
              className={classNames(styles.menu_item, styles.profile_button)}
              onClick={() => setShowModal(true)}
              aria-label={"Open login options"}
              title="Login"
            >
              <div className={styles.item_content}>
                <Profile />
                <span>Login</span>
              </div>
            </button>
          )}
          {user && (
            <Link
              href="/drafts"
              title="Drafts"
              className={styles.menu_item}
              onClick={linkClicked}
            >
              <div className={styles.item_content}>
                <DraftIcon />
                <span>Drafts</span>
              </div>
            </Link>
          )}
          {user && (
            <Link
              href="/favorites"
              title="Favorites"
              className={styles.menu_item}
              onClick={linkClicked}
            >
              <div className={styles.item_content}>
                <BookmarkIcon
                  style={{ transform: "scale(1.3333) translateX(-0.1rem)" }}
                />
                <span>Favorites</span>
              </div>
            </Link>
          )}
          {user && (
            <Link
              href={`/@${user.username}`}
              title="Profile"
              className={classNames(styles.menu_item, styles.profile_button)}
              onClick={linkClicked}
            >
              <div className={styles.item_content}>
                {user && user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile picture"
                    width={256}
                    height={256}
                    style={{
                      height: "auto",
                      width: "3.0rem",
                      borderRadius: "3.0rem",
                    }}
                  />
                ) : (
                  <Profile />
                )}
                <span>Profile</span>
              </div>
            </Link>
          )}
          {user && (
            <Link
              href="/settings"
              title="Settings"
              className={styles.menu_item}
              onClick={linkClicked}
            >
              <div className={styles.item_content}>
                <SettingsIcon />
                <span>Settings</span>
              </div>
            </Link>
          )}
        </div>

        <div className={styles.footer_wrapper}>
          {user && (
            <button
              onClick={logout}
              className={classNames(styles.menu_item, styles.logout)}
              title="Logout"
              aria-label="Logout"
            >
              <div className={styles.item_content}>
                <LogoutIcon />
                <span>Logout</span>
              </div>
            </button>
          )}
          <footer className={styles.footer}>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <button onClick={() => setShowContactModal(true)}>Contact</button>
          </footer>
        </div>
      </div>
    </nav>
  );
}
