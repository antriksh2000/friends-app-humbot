"use client";

import React from "react";
import styles from "../dashboard.module.css";

export interface HeaderUser {
  name?: string;
  email?: string;
  avatarUrl?: string;
  notificationCount?: number | null;
}

interface HeaderProps {
  user: HeaderUser;
  onEdit: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}

export default function Header({ user, onEdit, onNotifications, onLogout }: HeaderProps) {
  const initials = (user.name || "").split(" ").map(s => s.charAt(0)).join("").substring(0, 2).toUpperCase();

  return (
    <header className={styles.header} role="banner">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className={styles.avatar} aria-hidden={!user.avatarUrl}>
          {user.avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={user.avatarUrl} alt={`${user.name || "User"} avatar`} width={48} height={48} loading="lazy" />
          ) : (
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="48" height="48" rx="24" fill="#e5e7eb" />
              <text x="50%" y="55%" textAnchor="middle" fontSize="18" fill="#111" fontFamily="Arial, Helvetica, sans-serif">{initials || "U"}</text>
            </svg>
          )}
        </div>
        <div>
          <div className={styles.name}>{user.name || "Anonymous"}</div>
          {user.email ? <div className={styles.email}>{user.email}</div> : null}
        </div>
      </div>

      <div className={styles.quickActions}>
        <button className={styles.button} onClick={onEdit} aria-label="Edit profile" title="Edit profile">
          Edit
        </button>
        <button
          className={styles.button}
          onClick={onNotifications}
          aria-label="View notifications"
          title="Notifications"
        >
          {typeof user.notificationCount === "number" && user.notificationCount > 0 ? (
            <span aria-live="polite">🔔 {user.notificationCount}</span>
          ) : (
            "🔔"
          )}
        </button>
        <button className={styles.button} onClick={onLogout} aria-label="Log out" title="Log out">
          Logout
        </button>
      </div>

      <div className={styles.swipeHint} aria-hidden>
        <span style={{ opacity: 0.8 }}>Swipe →</span>
      </div>
    </header>
  );
}
