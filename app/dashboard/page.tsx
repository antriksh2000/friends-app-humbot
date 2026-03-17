"use client";

import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import SwipePanels from "./components/SwipePanels";
import styles from "./dashboard.module.css";

interface DashboardUser {
  id?: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  notificationCount?: number | null;
}

export default function DashboardPage(): JSX.Element {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) {
        // Not authenticated
        window.location.replace("/login");
        return;
      }
      const parsed = JSON.parse(raw) as DashboardUser;
      setUser(parsed);
    } catch (err) {
      // Bad data — redirect to login to be safe
      try {
        localStorage.removeItem("currentUser");
      } catch (e) {
        // ignore
      }
      window.location.replace("/login");
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  function handleEditProfile() {
    // Prefer /profile if exists; fallback to /register which exists in this repo
    window.location.href = "/profile";
  }

  function handleNotifications() {
    // Navigate to notifications if present; otherwise go home
    window.location.href = "/notifications";
  }

  function handleLogout() {
    try {
      localStorage.removeItem("currentUser");
    } catch (e) {
      // ignore
    }
    window.location.replace("/login");
  }

  return (
    <div className={styles.container} role="region" aria-label="Dashboard">
      <Header
        user={user || {}}
        onEdit={handleEditProfile}
        onNotifications={handleNotifications}
        onLogout={handleLogout}
      />

      <main style={{ marginTop: 12 }}>
        {loading ? (
          <div style={{ padding: 24 }}>Loading...</div>
        ) : user ? (
          <SwipePanels user={user} />
        ) : (
          <div style={{ padding: 24 }}>Redirecting…</div>
        )}
      </main>
    </div>
  );
}
