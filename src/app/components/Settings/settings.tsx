"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";
import Button from "@/app/components/Buttons/Button Set/button";
import ConfirmationBox from "@/app/components/Confirmation Box/confirmationBox";
import Modal from "@/app/components/Modals/Modal Versatile Portal/modal";

interface SettingsUser {
  username: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  hasPublished: boolean;
}

interface SettingsProps {
  user: SettingsUser;
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export default function Settings({ user: initialUser }: SettingsProps) {
  const router = useRouter();
  const [user, setUser] = useState<SettingsUser>(initialUser);

  // Username state
  const [usernameInput, setUsernameInput] = useState(initialUser.username);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usernameSaving) return;

    const trimmed = usernameInput.trim();
    if (trimmed === user.username) {
      setUsernameError("That is already your username.");
      return;
    }

    setUsernameError("");
    setUsernameSuccess("");
    setUsernameSaving(true);

    try {
      const res = await fetch("/api/user/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.logout) {
          router.push("/login");
          return;
        }
        setUsernameError(data.error || "Failed to update username.");
        return;
      }
      setUser((prev) => ({ ...prev, username: data.username }));
      setUsernameSuccess("Username updated successfully.");
      router.refresh();
    } catch {
      setUsernameError("An unexpected error occurred.");
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Failed to delete account.");
        setShowDeleteConfirm(false);
        setDeleting(false);
        return;
      }
      window.location.assign("/");
    } catch {
      setDeleteError("An unexpected error occurred.");
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={styles.settings_card}>
        {/* Profile Card */}
        <section className={styles.profile_section}>
          <div className={styles.avatar_wrapper}>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={`${user.username}'s avatar`}
                width={72}
                height={72}
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatar_placeholder}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.profile_info}>
            <span className={styles.profile_username}>{user.username}</span>
            <span className={styles.profile_detail}>{user.email}</span>
            <span className={styles.profile_detail}>
              Member since {formatMemberSince(user.createdAt)}
            </span>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Account Settings */}
        <section className={styles.settings_section}>
          <h2 className={styles.section_title}>Account</h2>

          {/* Change Username */}
          <div className={styles.setting_row}>
            <div className={styles.setting_label_group}>
              <label htmlFor="username-input" className={styles.setting_label}>
                Username
              </label>
              {user.hasPublished && (
                <span className={styles.setting_locked_note}>
                  Usernames cannot be changed once you have published ambiances.
                </span>
              )}
            </div>
            <form
              className={styles.username_form}
              onSubmit={handleUsernameSubmit}
            >
              <input
                id="username-input"
                className={styles.username_input}
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameError("");
                  setUsernameSuccess("");
                }}
                maxLength={16}
                disabled={user.hasPublished || usernameSaving}
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                variant="secondary"
                onClick={() => {}}
                type="submit"
                disabled={user.hasPublished || usernameSaving}
                width="default"
              >
                {usernameSaving ? "Saving…" : "Save"}
              </Button>
            </form>
            {usernameError && (
              <span className={styles.field_error}>{usernameError}</span>
            )}
            {usernameSuccess && (
              <span className={styles.field_success}>{usernameSuccess}</span>
            )}
          </div>

          {/* Delete Account */}
          <div className={styles.setting_row}>
            <div className={styles.setting_label_group}>
              <span className={styles.setting_label}>Delete Account</span>
              <span className={styles.setting_locked_note}>
                This action is permanent and cannot be undone.
              </span>
            </div>
            <Button
              variant="tertiary"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              width="default"
              style={{
                color: "var(--error-color)",
                borderColor: "var(--error-color)",
                marginTop: "0.4rem",
              }}
            >
              Delete Account
            </Button>
            {deleteError && (
              <span className={styles.field_error}>{deleteError}</span>
            )}
          </div>
        </section>
      </div>

      {showDeleteConfirm && (
        <Modal
          closeFunction={() => setShowDeleteConfirm(false)}
          closeOnBackdropClick
          animate
          unstyled={true}
        >
          <ConfirmationBox
            message="Are you sure you want to delete your account? This will permanently remove all of your ambiances, drafts, and data. This cannot be undone."
            confirmText={deleting ? "Deleting…" : "Delete Account"}
            cancelText="Cancel"
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </Modal>
      )}
    </>
  );
}
