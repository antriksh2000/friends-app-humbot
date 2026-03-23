"use client";

import React, { useEffect, useRef, useState } from "react";

type Item = { id: string; title?: string; subtitle?: string; avatarUrl?: string };

export default function SwipeCard(props: {
  item: Item;
  onAction: (payload: { itemId: string; action: "like" | "dislike"; method: "swipe" | "keyboard" | "programmatic"; velocity?: number; timestamp: number }) => void;
  disabled?: boolean;
  className?: string;
}): JSX.Element {
  const { item, onAction, disabled, className } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);
  const lastTranslate = useRef<number>(0);
  const dragging = useRef(false);
  const animating = useRef(false);
  const positions = useRef<Array<{ t: number; x: number }>>([]);
  const pointerIdRef = useRef<number | null>(null);
  const calledActionRef = useRef(false);

  const [, setTick] = useState(0); // force update for overlay render

  // helpers
  function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
  }

  function getWidth() {
    const el = rootRef.current;
    if (!el) return 1;
    return el.clientWidth || el.getBoundingClientRect().width || 1;
  }

  function applyTransform(dx: number) {
    const el = rootRef.current;
    if (!el) return;
    const width = getWidth();
    const rot = clamp((dx / width) * 8, -12, 12);
    el.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
    el.style.willChange = "transform";
  }

  function setTransition(v: string) {
    const el = rootRef.current;
    if (!el) return;
    el.style.transition = v;
  }

  function resetOverlays() {
    // trigger re-render so overlay styles update
    setTick(t => t + 1);
  }

  function computeVelocity(): number | undefined {
    const pos = positions.current;
    if (pos.length < 2) return undefined;
    const now = performance.now();
    // take last 100ms window
    const cutoff = now - 100;
    let first = pos.find(p => p.t >= cutoff) ?? pos[0];
    const last = pos[pos.length - 1];
    const dt = (last.t - first.t) / 1000; // seconds
    if (dt <= 0) return undefined;
    const dx = last.x - first.x;
    return dx / dt; // px/s
  }

  // pointer / touch handlers
  function onPointerDown(e: React.PointerEvent) {
    if (animating.current || disabled) return;
    if (e.pointerType === "touch" && e.isPrimary === false) return; // multitouch ignore
    dragging.current = true;
    startX.current = e.clientX;
    positions.current = [{ t: performance.now(), x: e.clientX }];
    lastTranslate.current = 0;
    setTransition("none");
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      pointerIdRef.current = e.pointerId;
    } catch (err) {
      // ignore
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || startX.current == null) return;
    const dx = e.clientX - startX.current;
    lastTranslate.current = dx;
    const now = performance.now();
    positions.current.push({ t: now, x: e.clientX });
    if (positions.current.length > 6) positions.current.shift();
    applyTransform(dx);
    resetOverlays();
  }

  function finalizeAction(action: "like" | "dislike", method: "swipe" | "keyboard" | "programmatic", velocity?: number) {
    if (calledActionRef.current) return;
    calledActionRef.current = true;
    const payload = {
      itemId: item.id,
      action,
      method,
      velocity,
      timestamp: Date.now(),
    };
    try {
      onAction(payload);
    } catch (err) {
      // swallow
    }
  }

  function onPointerUp(e?: React.PointerEvent | PointerEvent | TouchEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = lastTranslate.current;
    const velocity = computeVelocity();
    const el = rootRef.current;
    if (!el) return;
    const width = getWidth();
    const displacementThreshold = 0.3 * width;
    const velocityThreshold = 1000; // px/s

    const sign = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const meetsDisplacement = Math.abs(dx) > displacementThreshold;
    const meetsVelocity = velocity !== undefined && Math.abs(velocity) > velocityThreshold && Math.sign(velocity) === Math.sign(dx || velocity);

    // release pointer capture
    try {
      if (pointerIdRef.current != null) {
        el.releasePointerCapture?.(pointerIdRef.current);
      }
    } catch (err) {
      // ignore
    }
    pointerIdRef.current = null;

    if (meetsDisplacement || meetsVelocity) {
      // confirm and animate off-screen
      animating.current = true;
      setTransition("transform 260ms ease-out");
      const targetX = (sign || 1) * width * 1.5;
      const rot = (sign || 1) * 24;
      el.style.transform = `translateX(${targetX}px) rotate(${rot}deg)`;

      const onT = (ev: TransitionEvent) => {
        if (ev.propertyName !== "transform") return;
        el.removeEventListener("transitionend", onT);
        // call action after animation
        finalizeAction(sign > 0 ? "like" : "dislike", "swipe", velocity === undefined ? undefined : Math.round(velocity));
        // let parent remove the element; in case it doesn't, reset animating so interactions may resume
        animating.current = false;
      };
      el.addEventListener("transitionend", onT);
    } else {
      // snap back
      setTransition("transform 260ms ease");
      el.style.transform = "none";
      const onT = (ev: TransitionEvent) => {
        if (ev.propertyName !== "transform") return;
        el.removeEventListener("transitionend", onT);
        setTransition("none");
        resetOverlays();
      };
      el.addEventListener("transitionend", onT);
    }
  }

  // touch fallback
  function onTouchStart(ev: React.TouchEvent) {
    if (animating.current || disabled) return;
    if (ev.touches.length > 1) return;
    const t = ev.touches[0];
    dragging.current = true;
    startX.current = t.clientX;
    positions.current = [{ t: performance.now(), x: t.clientX }];
    lastTranslate.current = 0;
    setTransition("none");
  }
  function onTouchMove(ev: React.TouchEvent) {
    if (!dragging.current || startX.current == null) return;
    const t = ev.touches[0];
    const dx = t.clientX - startX.current;
    lastTranslate.current = dx;
    positions.current.push({ t: performance.now(), x: t.clientX });
    if (positions.current.length > 6) positions.current.shift();
    applyTransform(dx);
    resetOverlays();
  }
  function onTouchEnd(ev: React.TouchEvent) {
    if (!dragging.current) return;
    const t = ev.changedTouches[0];
    lastTranslate.current = (t?.clientX ?? 0) - (startX.current ?? 0);
    onPointerUp();
    startX.current = null;
  }

  // keyboard handlers
  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled || animating.current) return;
    if (e.key === "ArrowRight" || e.key === "Enter") {
      // programmatic confirm to the right
      animating.current = true;
      const el = rootRef.current;
      if (!el) return;
      setTransition("transform 260ms ease-out");
      const width = getWidth();
      el.style.transform = `translateX(${width * 1.5}px) rotate(24deg)`;
      const onT = (ev: TransitionEvent) => {
        if (ev.propertyName !== "transform") return;
        el.removeEventListener("transitionend", onT);
        finalizeAction("like", "keyboard", undefined);
        animating.current = false;
      };
      el.addEventListener("transitionend", onT);
    } else if (e.key === "ArrowLeft") {
      animating.current = true;
      const el = rootRef.current;
      if (!el) return;
      setTransition("transform 260ms ease-out");
      const width = getWidth();
      el.style.transform = `translateX(${ -width * 1.5 }px) rotate(-24deg)`;
      const onT = (ev: TransitionEvent) => {
        if (ev.propertyName !== "transform") return;
        el.removeEventListener("transitionend", onT);
        finalizeAction("dislike", "keyboard", undefined);
        animating.current = false;
      };
      el.addEventListener("transitionend", onT);
    }
  }

  useEffect(() => {
    // cleanup on unmount
    return () => {
      const el = rootRef.current;
      if (el && pointerIdRef.current != null) {
        try {
          el.releasePointerCapture?.(pointerIdRef.current);
        } catch (err) {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // overlay opacities derived from lastTranslate
  const dx = lastTranslate.current;
  const width = getWidth();
  const overlayOpacity = clamp(Math.min(1, Math.abs(dx) / (width * 0.5)), 0, 1);

  const likeVisible = dx > 0 && overlayOpacity > 0;
  const dislikeVisible = dx < 0 && overlayOpacity > 0;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="swipe card"
      aria-label={`${item.title ?? "Card"}${item.subtitle ? ", " + item.subtitle : ""}. Swipe right to like, left to dislike.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => onPointerUp()}
      onPointerCancel={() => onPointerUp()}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={className}
      style={{
        width: 320,
        maxWidth: "90vw",
        height: 420,
        boxSizing: "border-box",
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        userSelect: "none",
        touchAction: "pan-y",
        margin: "0 auto",
      }}
      aria-hidden={disabled}
    >
      {/* content */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flex: "0 0 64px" }}>
          {item.avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={item.avatarUrl} alt={`${item.title ?? "Avatar"} avatar`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#111" }} aria-hidden>
              📷
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{item.title ?? "Untitled"}</div>
          {item.subtitle ? <div style={{ marginTop: 6, color: "#6b7280" }}>{item.subtitle}</div> : null}
        </div>
      </div>

      <div style={{ marginTop: 12, color: "#374151", flex: 1 }}>
        <p style={{ margin: 0, opacity: 0.85 }}>This is a demo swipe card. Use drag, touch, or arrow keys to interact.</p>
      </div>

      {/* overlays */}
      <div
        aria-hidden={!likeVisible}
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          padding: "8px 12px",
          borderRadius: 8,
          background: `rgba(16,185,129,${likeVisible ? overlayOpacity : 0})`,
          color: "#fff",
          fontWeight: 700,
          display: likeVisible ? "flex" : "none",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span aria-hidden>👍</span>
        <span style={{ textShadow: "0 1px 0 rgba(0,0,0,0.12)" }}>Like</span>
      </div>

      <div
        aria-hidden={!dislikeVisible}
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          padding: "8px 12px",
          borderRadius: 8,
          background: `rgba(239,68,68,${dislikeVisible ? overlayOpacity : 0})`,
          color: "#fff",
          fontWeight: 700,
          display: dislikeVisible ? "flex" : "none",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span aria-hidden>👎</span>
        <span style={{ textShadow: "0 1px 0 rgba(0,0,0,0.12)" }}>Nope</span>
      </div>
    </div>
  );
}
