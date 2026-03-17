"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "../dashboard.module.css";

interface DashboardUser {
  id?: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  notificationCount?: number | null;
}

const panels = [
  { key: "overview", title: "Overview" },
  { key: "activity", title: "Activity" },
  { key: "settings", title: "Settings" },
];

export default function SwipePanels({ user }: { user: DashboardUser }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("dashboard:lastPanel") : null;
      if (!raw) return 0;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) return 0;
      return Math.max(0, Math.min(n, panels.length - 1));
    } catch (e) {
      return 0;
    }
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [panelLoading, setPanelLoading] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    panels.forEach(p => (obj[p.key] = false));
    return obj;
  });
  const [panelError, setPanelError] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    panels.forEach(p => (obj[p.key] = false));
    return obj;
  });

  const startX = useRef<number | null>(null);
  const lastTranslate = useRef(0);
  const dragging = useRef(false);
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Persist index
  useEffect(() => {
    try {
      localStorage.setItem("dashboard:lastPanel", String(currentIndex));
    } catch (e) {
      // ignore
    }
    // Snap track to current index
    const el = trackRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const width = container.clientWidth || container.getBoundingClientRect().width;
    const target = -currentIndex * width;
    if (prefersReducedMotion) {
      el.style.transition = "none";
      el.style.transform = `translateX(${target}px)`;
      lastTranslate.current = target;
    } else {
      el.style.transition = "transform 320ms ease";
      setIsAnimating(true);
      requestAnimationFrame(() => {
        el.style.transform = `translateX(${target}px)`;
      });
    }

    const onT = () => setIsAnimating(false);
    el.addEventListener("transitionend", onT);
    return () => el.removeEventListener("transitionend", onT);
  }, [currentIndex, prefersReducedMotion]);

  // Fake fetch for a panel
  const fetchPanel = useCallback((key: string) => {
    setPanelError(prev => ({ ...prev, [key]: false }));
    setPanelLoading(prev => ({ ...prev, [key]: true }));
    // simulate network
    const delay = 600 + Math.floor(Math.random() * 300);
    const id = setTimeout(() => {
      // deterministic no-error by default (per plan)
      setPanelLoading(prev => ({ ...prev, [key]: false }));
      setPanelError(prev => ({ ...prev, [key]: false }));
    }, delay);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    // fetch initial panel
    fetchPanel(panels[currentIndex].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gesture handlers
  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    function getWidth() {
      return container.clientWidth || container.getBoundingClientRect().width || 1;
    }

    function onPointerDown(e: PointerEvent) {
      if (isAnimating) return;
      dragging.current = true;
      startX.current = e.clientX;
      track.style.transition = "none";
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.current || startX.current == null) return;
      const dx = e.clientX - startX.current;
      const width = getWidth();
      const base = -currentIndex * width;
      const translate = base + dx;
      lastTranslate.current = translate;
      track.style.transform = `translateX(${translate}px)`;
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging.current || startX.current == null) return;
      dragging.current = false;
      const dx = e.clientX - startX.current;
      startX.current = null;
      const threshold = 50; // px
      const width = getWidth();
      let nextIndex = currentIndex;
      if (dx < -threshold && currentIndex < panels.length - 1) nextIndex = currentIndex + 1;
      else if (dx > threshold && currentIndex > 0) nextIndex = currentIndex - 1;

      // Trigger fetch if changing
      if (nextIndex !== currentIndex) {
        setCurrentIndex(nextIndex);
        fetchPanel(panels[nextIndex].key);
      } else {
        // snap back
        const target = -currentIndex * width;
        if (prefersReducedMotion) {
          track.style.transition = "none";
          track.style.transform = `translateX(${target}px)`;
          lastTranslate.current = target;
        } else {
          track.style.transition = "transform 260ms ease";
          setIsAnimating(true);
          track.style.transform = `translateX(${target}px)`;
        }
      }
    }

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);

    // Touch fallback for environments without pointer events
    function onTouchStart(ev: TouchEvent) {
      if (isAnimating) return;
      const t = ev.touches[0];
      startX.current = t.clientX;
      dragging.current = true;
      track.style.transition = "none";
    }
    function onTouchMove(ev: TouchEvent) {
      if (!dragging.current || startX.current == null) return;
      const t = ev.touches[0];
      const dx = t.clientX - startX.current;
      const base = -currentIndex * getWidth();
      const translate = base + dx;
      lastTranslate.current = translate;
      track.style.transform = `translateX(${translate}px)`;
    }
    function onTouchEnd(ev: TouchEvent) {
      if (!dragging.current) return;
      dragging.current = false;
      const changed = ev.changedTouches[0];
      const dx = changed.clientX - (startX.current ?? 0);
      startX.current = null;
      const threshold = 50;
      if (dx < -threshold && currentIndex < panels.length - 1) {
        const next = currentIndex + 1;
        setCurrentIndex(next);
        fetchPanel(panels[next].key);
      } else if (dx > threshold && currentIndex > 0) {
        const next = currentIndex - 1;
        setCurrentIndex(next);
        fetchPanel(panels[next].key);
      } else {
        const target = -currentIndex * getWidth();
        if (prefersReducedMotion) {
          track.style.transition = "none";
          track.style.transform = `translateX(${target}px)`;
          lastTranslate.current = target;
        } else {
          track.style.transition = "transform 260ms ease";
          setIsAnimating(true);
          track.style.transform = `translateX(${target}px)`;
        }
      }
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.removeEventListener("touchstart", onTouchStart as any);
      container.removeEventListener("touchmove", onTouchMove as any);
      container.removeEventListener("touchend", onTouchEnd as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isAnimating, fetchPanel, prefersReducedMotion]);

  // Controls
  function goTo(index: number) {
    if (index < 0 || index >= panels.length) return;
    if (isAnimating) return;
    setCurrentIndex(index);
    fetchPanel(panels[index].key);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      goTo(Math.max(0, currentIndex - 1));
    } else if (e.key === "ArrowRight") {
      goTo(Math.min(panels.length - 1, currentIndex + 1));
    }
  }

  // Panel content renderers
  function renderOverview() {
    const key = "overview";
    if (panelLoading[key]) return <div className={styles.loader}>Loading overview…</div>;
    if (panelError[key])
      return (
        <div className={styles.errorBox} role="alert">
          <div>Failed to load overview.</div>
          <button className={styles.button} onClick={() => fetchPanel(key)} aria-label="Retry overview">
            Retry
          </button>
        </div>
      );
    return (
      <div>
        <h3>Welcome{user?.name ? `, ${user.name}` : ""}!</h3>
        {user?.email && <div style={{ opacity: 0.8 }}>{user.email}</div>}
        <p style={{ marginTop: 8 }}>You have {user?.notificationCount ?? 0} unread notifications.</p>
      </div>
    );
  }

  function renderActivity() {
    const key = "activity";
    if (panelLoading[key])
      return (
        <div>
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
          <div className={styles.skeletonItem} />
        </div>
      );
    if (panelError[key])
      return (
        <div className={styles.errorBox} role="alert">
          <div>Failed to load activity.</div>
          <button className={styles.button} onClick={() => fetchPanel(key)} aria-label="Retry activity">
            Retry
          </button>
        </div>
      );
    return (
      <ul>
        <li>Activity item 1</li>
        <li>Activity item 2</li>
        <li>Activity item 3</li>
      </ul>
    );
  }

  function renderSettings() {
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            <input type="checkbox" /> Email notifications
          </label>
          <label>
            <input type="checkbox" /> Show profile publicly
          </label>
          <button
            className={styles.button}
            onClick={() => {
              // simulate save
              const key = "settings-save";
              setPanelLoading(prev => ({ ...prev, [key]: true }));
              setTimeout(() => setPanelLoading(prev => ({ ...prev, [key]: false })), 700);
            }}
            aria-label="Save settings"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      className={styles.swipeContainer}
      ref={containerRef}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Dashboard panels"
    >
      <div className={styles.panelsTrack} ref={trackRef} style={{ width: `${panels.length * 100}%`, display: "flex" }}>
        {panels.map((p, idx) => {
          const active = idx === currentIndex;
          return (
            <article
              key={p.key}
              className={`${styles.panel} ${active ? styles.panelActive : ""}`}
              style={{ width: `${100 / panels.length}%`, boxSizing: "border-box" }}
              aria-hidden={!active}
              tabIndex={active ? 0 : -1}
              aria-roledescription="slide"
              aria-label={p.title}
              id={`panel-${p.key}`}
            >
              <h2>{p.title}</h2>
              <div>
                {p.key === "overview" && renderOverview()}
                {p.key === "activity" && renderActivity()}
                {p.key === "settings" && renderSettings()}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.controls} aria-hidden={false}>
        <button
          className={styles.chevronButton}
          onClick={() => goTo(Math.max(0, currentIndex - 1))}
          aria-label="Previous panel"
          disabled={currentIndex === 0 || isAnimating}
        >
          ◀
        </button>

        <div className={styles.dots} role="tablist" aria-label="Panel navigation">
          {panels.map((p, i) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={i === currentIndex}
              aria-controls={`panel-${p.key}`}
              className={styles.dotButton}
              onClick={() => goTo(i)}
              aria-label={`Go to ${p.title}`}
            >
              {i === currentIndex ? "●" : "○"}
            </button>
          ))}
        </div>

        <button
          className={styles.chevronButton}
          onClick={() => goTo(Math.min(panels.length - 1, currentIndex + 1))}
          aria-label="Next panel"
          disabled={currentIndex === panels.length - 1 || isAnimating}
        >
          ▶
        </button>
      </div>
    </section>
  );
}
