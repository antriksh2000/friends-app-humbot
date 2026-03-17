"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";

type DashboardUser = {
  id?: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  notificationCount?: number | null;
};

const PANELS = [
  { key: "overview", title: "Overview" },
  { key: "activity", title: "Activity" },
  { key: "settings", title: "Settings" },
];

export default function SwipePanels({ user }: { user: DashboardUser }) {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("dashboard:lastPanel");
      const n = raw ? parseInt(raw, 10) : 0;
      if (Number.isFinite(n)) return Math.max(0, Math.min(n, PANELS.length - 1));
    } catch {}
    return 0;
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [panelLoading, setPanelLoading] = useState<Record<string, boolean>>({});
  const [panelError, setPanelError] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const lastTranslateRef = useRef<number>(0); // percent offset applied during drag
  const draggingRef = useRef(false);
  const timeoutRefs = useRef<Record<string, number>>({});

  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // load current panel
    loadPanel(PANELS[currentIndex].key);
    // persist
    try {
      localStorage.setItem("dashboard:lastPanel", String(currentIndex));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      // cleanup timeouts
      Object.values(timeoutRefs.current).forEach((id) => clearTimeout(id));
    };
  }, []);

  function loadPanel(key: string) {
    setPanelError((s) => ({ ...s, [key]: false }));
    setPanelLoading((s) => ({ ...s, [key]: true }));
    // deterministic: Math.random() < 0.0 -> no errors by default
    const t = window.setTimeout(() => {
      const willError = Math.random() < 0.0;
      setPanelLoading((s) => ({ ...s, [key]: false }));
      if (willError) setPanelError((s) => ({ ...s, [key]: true }));
    }, 600 + Math.floor(Math.random() * 300));
    timeoutRefs.current[key] = t;
  }

  const goToIndex = useCallback((next: number) => {
    if (isAnimating || next === currentIndex) return;
    const clamped = Math.max(0, Math.min(next, PANELS.length - 1));
    setIsAnimating(true);
    setCurrentIndex(clamped);
    // animation end handled via transitionend listener
  }, [currentIndex, isAnimating]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function onTransitionEnd() {
      setIsAnimating(false);
      lastTranslateRef.current = 0;
      if (el) el.style.transition = "";
    }
    el.addEventListener("transitionend", onTransitionEnd);
    return () => el.removeEventListener("transitionend", onTransitionEnd);
  }, []);

  const applyTranslate = (percent: number, animate = false) => {
    const el = trackRef.current;
    if (!el) return;
    if (animate && !prefersReducedMotion) {
      el.style.transition = "transform 260ms ease";
    } else {
      el.style.transition = "none";
    }
    el.style.transform = `translateX(${percent}%)`;
  };

  // ensure track reflects currentIndex when not dragging
  useEffect(() => {
    const base = -currentIndex * 100;
    applyTranslate(base, true);
    // load panel if not already
    const key = PANELS[currentIndex].key;
    if (!panelLoading[key] && !panelError[key]) {
      loadPanel(key);
    }
    try {
      localStorage.setItem("dashboard:lastPanel", String(currentIndex));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  function onPointerDown(e: React.PointerEvent) {
    if (isAnimating) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startXRef.current = e.clientX;
    draggingRef.current = true;
    lastTranslateRef.current = 0;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || startXRef.current == null) return;
    const delta = e.clientX - startXRef.current;
    const container = containerRef.current;
    if (!container) return;
    const width = container.getBoundingClientRect().width || 1;
    const deltaPercent = (delta / width) * 100;
    const base = -currentIndex * 100;
    lastTranslateRef.current = deltaPercent;
    applyTranslate(base + deltaPercent, false);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!draggingRef.current || startXRef.current == null) return;
    const delta = e.clientX - startXRef.current;
    finishDrag(delta);
    draggingRef.current = false;
    startXRef.current = null;
  }

  // touch events fallback
  function onTouchStart(e: React.TouchEvent) {
    if (isAnimating) return;
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
    lastTranslateRef.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!draggingRef.current || startXRef.current == null) return;
    const delta = e.touches[0].clientX - startXRef.current;
    const container = containerRef.current;
    if (!container) return;
    const width = container.getBoundingClientRect().width || 1;
    const deltaPercent = (delta / width) * 100;
    const base = -currentIndex * 100;
    lastTranslateRef.current = deltaPercent;
    applyTranslate(base + deltaPercent, false);
  }
  function onTouchEnd(_e: React.TouchEvent) {
    if (!draggingRef.current || startXRef.current == null) return;
    const delta = lastTranslateRef.current; // percent
    const container = containerRef.current;
    const width = container ? container.getBoundingClientRect().width : 1;
    const deltaPx = (delta / 100) * width;
    finishDrag(deltaPx);
    draggingRef.current = false;
    startXRef.current = null;
  }

  function finishDrag(deltaPx: number) {
    const threshold = 30; // px
    if (Math.abs(deltaPx) > threshold) {
      if (deltaPx < 0) {
        // swipe left => next
        goToIndex(currentIndex + 1);
      } else {
        // swipe right => prev
        goToIndex(currentIndex - 1);
      }
    } else {
      // snap back
      applyTranslate(-currentIndex * 100, true);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToIndex(currentIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goToIndex(currentIndex + 1);
    }
  };

  const retryPanel = (key: string) => {
    loadPanel(key);
  };

  const saveSettings = async () => {
    setPanelLoading((s) => ({ ...s, settings: true }));
    await new Promise((res) => setTimeout(res, 700));
    setPanelLoading((s) => ({ ...s, settings: false }));
  };

  return (
    <section
      className={styles.swipeContainer}
      ref={containerRef}
      onKeyDown={onKeyDown}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Dashboard panels"
    >
      <div
        className={styles.panelsTrack}
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        role="group"
        style={{ display: "flex", width: `${PANELS.length * 100}%` }}
      >
        {PANELS.map((p, idx) => {
          const loading = !!panelLoading[p.key];
          const error = !!panelError[p.key];
          const active = idx === currentIndex;
          return (
            <article
              key={p.key}
              className={[styles.panel, active ? styles.panelActive : ""].join(" ")}
              style={{ width: `${100 / PANELS.length}%` }}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
            >
              <h3>{p.title}</h3>

              {loading && (
                <div className={styles.loader} aria-live="polite">
                  <div className={styles.skeletonItem} style={{ height: 12, width: '60%', marginBottom: 8 }} />
                  <div className={styles.skeletonItem} style={{ height: 10, width: '90%', marginBottom: 6 }} />
                  <div className={styles.skeletonItem} style={{ height: 10, width: '80%', marginBottom: 6 }} />
                </div>
              )}

              {!loading && error && (
                <div className={styles.errorBox} role="alert">
                  <div>Failed to load {p.title}.</div>
                  <button onClick={() => retryPanel(p.key)} className={styles.button} aria-label={`Retry loading ${p.title}`}>
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div>
                  {p.key === 'overview' && (
                    <div>
                      <p>Welcome back{user?.name ? `, ${user.name}` : ''}.</p>
                      {user?.email && <p style={{ color: '#666' }}>{user.email}</p>}
                      <p>You have {user?.notificationCount ?? 0} unread notifications.</p>
                    </div>
                  )}

                  {p.key === 'activity' && (
                    <div>
                      <ul style={{ paddingLeft: 18 }}>
                        <li>Recent activity 1</li>
                        <li>Recent activity 2</li>
                        <li>Recent activity 3</li>
                      </ul>
                    </div>
                  )}

                  {p.key === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label>
                        <input type="checkbox" /> Email notifications
                      </label>
                      <label>
                        <input type="checkbox" /> Show profile
                      </label>
                      <div>
                        <button onClick={saveSettings} className={styles.button} aria-label="Save settings">
                          {panelLoading['settings'] ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.chevronButton}
          onClick={() => goToIndex(currentIndex - 1)}
          aria-label="Previous panel"
          disabled={currentIndex === 0 || isAnimating}
        >
          ◀
        </button>

        <div className={styles.dots} role="tablist" aria-label="Panel navigation">
          {PANELS.map((p, idx) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-controls={`panel-${p.key}`}
              className={styles.dotButton}
              onClick={() => goToIndex(idx)}
              aria-label={`Go to ${p.title}`}
            >
              {idx === currentIndex ? '●' : '○'}
            </button>
          ))}
        </div>

        <button
          className={styles.chevronButton}
          onClick={() => goToIndex(currentIndex + 1)}
          aria-label="Next panel"
          disabled={currentIndex === PANELS.length - 1 || isAnimating}
        >
          ▶
        </button>
      </div>
    </section>
  );
}
