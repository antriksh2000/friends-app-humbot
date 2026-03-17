"use client";

import React, { useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) {
        window.location.replace("/login");
        return;
      }
      const parsed = JSON.parse(raw);
      setUser(parsed || null);
    } catch (err) {
      // parsing error or other localStorage issue: redirect to login
      try {
        localStorage.removeItem("currentUser");
      } catch {}
      window.location.replace("/login");
    }
  }, []);

  const handleEditProfile = useCallback(() => {
    // prefer /profile if that exists, otherwise /register as requested
    window.location.href = "/register";
  }, []);

  const handleNotifications = useCallback(() => {
    // Navigate to notifications if present else fallback to home
    window.location.href = "/notifications";
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("currentUser");
    } catch {}
    window.location.replace("/login");
  }, []);

  return (
    <div role="region" aria-label="Dashboard" className={styles.container}>
      <Header
        user={user || { name: "Anonymous" }}
        onEdit={handleEditProfile}
        onNotifications={handleNotifications}
        onLogout={handleLogout}
      />
      <main style={{ marginTop: 12 }}>
        <SwipePanels user={user || { name: "Anonymous" }} />
      </main>
    </div>
  );
}
