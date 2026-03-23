"use client";

import React, { useEffect, useRef, useState } from "react";

export default function SwipeCard(props: {
  item: { id: string; title?: string; subtitle?: string; avatarUrl?: string };
  onAction: (payload: {
    itemId: string;
    action: "like" | "dislike";
    method: "swipe" | "keyboard" | "programmatic";
    velocity?: number;
    timestamp: number;
  }) => void;
  disabled?: boolean;
  className?: string;
}): JSX.Element {
  const { item, onAction, disabled, className } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);
  const lastTranslate = useRef(0);
  const dragging = useRef(false);
  const animating = useRef(false);
  const positions = useRef<Array<{ t: number; x: number }>>([]);
  const [overlay, setOverlay] = useState<{ dir: "like" | "dislike" | null; opacity: number }>({ dir: null, opacity: 0 });

  useEffect(() => {
    return () => {
      // cleanup: release pointer capture if any
      try {
        const el = rootRef.current;
        if (el) {
          // There's no stable pointerId to release; rely on pointerup/cancel flows.
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  function resetTransform(transition = "transform 260ms ease") {
    const el = rootRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = `translateX(0px) rotate(0deg)`;
    setOverlay({ dir: null, opacity: 0 });
    lastTranslate.current = 0;
  }

  function applyTranslate(dx: number) {
    const el = rootRef.current;
    if (!el) return;
    const width = el.clientWidth || el.getBoundingClientRect().width || 1;
    const rot = Math.max(-12, Math.min(12, (dx / width) * 8));
    el.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
    lastTranslate.current = dx;
    const abs = Math.abs(dx);
    const opacity = Math.min(1, abs / (width * 0.5));
    if (dx > 0) setOverlay({ dir: "like", opacity });
    else if (dx < 0) setOverlay({ dir: "dislike", opacity });
    else setOverlay({ dir: null, opacity: 0 });
  }

  function computeVelocity(): number | undefined {
    const list = positions.current;
    if (list.length < 2) return undefined;
    const now = performance.now();
    // use last 100ms window
    const windowStart = now - 100;
    let start = list[0];
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].t <= windowStart) {
        start = list[i];
        break;
      }
    }
    const last = list[list.length - 1];
    const dt = last.t - start.t;
    if (dt <= 0) return undefined;
    const dx = last.x - start.x;
    const vel = (dx / dt) * 1000; // px/s
    return vel;
  }

  function confirmDismiss(direction: "like" | "dislike", method: "swipe" | "keyboard" | "programmatic", velocity?: number) {
    if (animating.current) return;
    const el = rootRef.current;
    if (!el) return;
    animating.current = true;
    el.style.transition = "transform 260ms ease-out";
    const w = el.clientWidth || el.getBoundingClientRect().width || 320;
    const sign = direction === "like" ? 1 : -1;
    const tx = sign * w * 1.5;
    const rot = sign * 24;
    // animate off-screen
    requestAnimationFrame(() => {
      el.style.transform = `translateX(${tx}px) rotate(${rot}deg)`;
      setOverlay(prev => ({ dir: direction, opacity: 1 }));
    });

    const onTransitionEnd = (ev: TransitionEvent) => {
      if (ev.propertyName !== "transform") return;
      el.removeEventListener("transitionend", onTransitionEnd);
      animating.current = false;
      // emit action
      try {
        onAction({ itemId: item.id, action: direction, method, velocity, timestamp: Date.now() });
      } catch (e) {
        // swallow
      }
    };

    el.addEventListener("transitionend", onTransitionEnd);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (animating.current || disabled) return;
    // ignore non-primary buttons
    if ((e as any).button && (e as any).button !== 0) return;
    // multitouch: if touch and more than 1 pointer, ignore (can't easily detect here). We'll trust pointerType.
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
    dragging.current = true;
    startX.current = e.clientX;
    positions.current = [{ t: performance.now(), x: e.clientX }];
    const el = rootRef.current;
    if (el) el.style.transition = "none";
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current || startX.current == null) return;
    const clientX = e.clientX;
    const dx = clientX - startX.current;
    positions.current.push({ t: performance.now(), x: clientX });
    if (positions.current.length > 6) positions.current.shift();
    applyTranslate(dx);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch (err) {
      // ignore
    }
    const el = rootRef.current;
    if (!el) return;
    const dx = lastTranslate.current;
    const vel = computeVelocity();
    const width = el.clientWidth || el.getBoundingClientRect().width || 1;
    const displacementThreshold = 0.3 * width;
    const velocityThreshold = 1000; // px/s
    const dir = dx > 0 ? "like" : "dislike";
    const should = Math.abs(dx) > displacementThreshold || (typeof vel === "number" && Math.abs(vel) > velocityThreshold && Math.sign(vel) === Math.sign(dx));
    if (should) {
      confirmDismiss(dir, "swipe", vel === undefined ? undefined : Math.abs(vel));
    } else {
      resetTransform();
    }
  }

  function handlePointerCancel(_e: React.PointerEvent) {
    dragging.current = false;
    resetTransform();
  }

  // Touch fallback (in addition to pointer events)
  function handleTouchStart(e: React.TouchEvent) {
    if (animating.current || disabled) return;
    const t = e.touches[0];
    if (!t) return;
    dragging.current = true;
    startX.current = t.clientX;
    positions.current = [{ t: performance.now(), x: t.clientX }];
    const el = rootRef.current;
    if (el) el.style.transition = "none";
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging.current || startX.current == null) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - startX.current;
    positions.current.push({ t: performance.now(), x: t.clientX });
    if (positions.current.length > 6) positions.current.shift();
    applyTranslate(dx);
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const changed = e.changedTouches[0];
    const dx = changed ? changed.clientX - (startX.current ?? 0) : lastTranslate.current;
    const vel = computeVelocity();
    const el = rootRef.current;
    if (!el) return;
    const width = el.clientWidth || el.getBoundingClientRect().width || 1;
    const displacementThreshold = 0.3 * width;
    const velocityThreshold = 1000;
    const dir = dx > 0 ? "like" : "dislike";
    const should = Math.abs(dx) > displacementThreshold || (typeof vel === "number" && Math.abs(vel) > velocityThreshold && Math.sign(vel) === Math.sign(dx));
    if (should) {
      confirmDismiss(dir, "swipe", vel === undefined ? undefined : Math.abs(vel));
    } else {
      resetTransform();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled || animating.current) return;
    if (e.key === "ArrowRight" || e.key === "Enter") {
      // programmatic right
      confirmDismiss("like", "keyboard", undefined);
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      confirmDismiss("dislike", "keyboard", undefined);
      e.preventDefault();
    }
  }

  // small inline styles
  const containerStyle: React.CSSProperties = {
    width: 320,
    maxWidth: "90vw",
    height: 420,
    maxHeight: "80vh",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    position: "relative",
    overflow: "hidden",
    touchAction: "pan-y",
    userSelect: "none",
    WebkitUserSelect: "none",
    display: "flex",
    flexDirection: "column",
  };

  const avatarStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: 10,
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    marginRight: 12,
    overflow: "hidden",
  };

  const overlayCommon: React.CSSProperties = {
    position: "absolute",
    top: 16,
    padding: "8px 12px",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transform: "translateZ(0)",
  };

  return (
    <div
      ref={rootRef}
      role="article"
      aria-roledescription="swipe card"
      aria-label={`${item.title || "Card"}. Swipe right to like, left to dislike.`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
      style={{ ...containerStyle, outline: "none" }}
      aria-disabled={disabled || undefined}
    >
      {/* overlays */}
      <div
        aria-hidden
        style={{
          ...overlayCommon,
          left: 16,
          background: "rgba(34,197,94,0.9)",
          opacity: overlay.dir === "like" ? overlay.opacity : 0,
        }}
      >
        <span style={{ fontSize: 18 }}>👍</span>
        <span style={{ fontSize: 14 }}>Like</span>
      </div>

      <div
        aria-hidden
        style={{
          ...overlayCommon,
          right: 16,
          background: "rgba(239,68,68,0.9)",
          opacity: overlay.dir === "dislike" ? overlay.opacity : 0,
        }}
      >
        <span style={{ fontSize: 18 }}>👎</span>
        <span style={{ fontSize: 14 }}>Nope</span>
      </div>

      <div style={{ padding: 18, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={avatarStyle}>
          {item.avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={item.avatarUrl} alt={`${item.title || "avatar"}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ fontSize: 22, color: "#374151" }}>{(item.title || "?").charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{item.title || "Untitled"}</div>
          {item.subtitle ? <div style={{ color: "#6b7280", marginTop: 4 }}>{item.subtitle}</div> : null}
        </div>
      </div>

      <div style={{ padding: 18, marginTop: "auto", color: "#6b7280" }}>
        <div style={{ fontSize: 13 }}>Tip: drag left/right or use ← → keys to act.</div>
      </div>
    </div>
  );
}
