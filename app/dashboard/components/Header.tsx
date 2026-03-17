"use client";

import React from "react";
import styles from "../dashboard.module.css";

interface HeaderProps {
  user: { name?: string; email?: string; avatarUrl?: string; notificationCount?: number | null };
  onEdit: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}

export default function Header({ user, onEdit, onNotifications, onLogout }: HeaderProps) {
  const initials = (user?.name || "").split(" ").map(s => s[0]).slice(0,2).join("");

  return (
    <header role="banner" className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={`${user.name || 'User'} avatar`}
            className={styles.avatar}
            width={48}
            height={48}
            loading="lazy"
          />
        ) : (
          <div className={styles.avatar} aria-hidden="true" title={user?.name || 'User'}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="24" fill="#ddd" />
              <text x="50%" y="54%" textAnchor="middle" fill="#555" fontSize="16" fontFamily="Arial, Helvetica, sans-serif" dy=".35em">{initials || "U"}</text>
            </svg>
          </div>
        )}
        <div>
          <div className={styles.name}>{user?.name || "Anonymous"}</div>
          {user?.email && <div className={styles.email}>{user.email}</div>}
        </div>
      </div>

      <div className={styles.quickActions}>
        <button
          className={styles.button}
          onClick={onEdit}
          aria-label="Edit profile"
          title="Edit profile"
        >
          Edit
        </button>

        <button
          className={styles.button}
          onClick={onNotifications}
          aria-label={`Notifications${user?.notificationCount ? ` (${user.notificationCount})` : ''}`}
          title="Notifications"
        >
          Notifications{user?.notificationCount ? ` (${user.notificationCount})` : ''}
        </button>

        <button
          className={styles.button}
          onClick={onLogout}
          aria-label="Logout"
          title="Logout"
        >
          Logout
        </button>
      </div>

      <div className={styles.swipeHint} aria-hidden>
        <span style={{ opacity: 0.9 }}>Swipe</span>
        <span style={{ marginLeft: 6 }}>← →</span>
      </div>
    </header>
  );
}
