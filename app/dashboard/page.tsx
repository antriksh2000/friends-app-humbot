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
  const [error, setError] = useState<string | null>(null);

  async function fetchCurrent() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/current');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        try {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        } catch (e) {
          // ignore storage errors
        }
        setLoading(false);
      } else if (res.status === 401) {
        // Not authenticated — redirect to login with returnUrl
        const returnUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/dashboard';
        window.location.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      } else {
        setError('Unable to load dashboard. Try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('Unable to load dashboard. Check your network and try again.');
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEditProfile() {
    // Prefer /profile if exists; fallback to /register which exists in this repo
    window.location.href = "/profile";
  }

  function handleNotifications() {
    // Navigate to notifications if present; otherwise go home
    window.location.href = "/notifications";
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore network errors — still clear local state
    } finally {
      try { localStorage.removeItem('currentUser'); } catch (e) {}
      window.location.replace('/login');
    }
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
        ) : error ? (
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 12 }} className={styles.errorBox || undefined}>
              <strong>{error}</strong>
            </div>
            <div>
              <button onClick={fetchCurrent} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Retry</button>
            </div>
          </div>
        ) : user ? (
          <SwipePanels user={user} />
        ) : (
          <div style={{ padding: 24 }}>Redirecting…</div>
        )}
      </main>
    </div>
  );
}
