"use client";

import React, { useEffect, useRef, useState } from "react";
import SwipeCard from "./SwipeCard";

type Item = { id: string; title?: string; subtitle?: string; avatarUrl?: string };

type ActionRecord = {
  itemId: string;
  action: "like" | "dislike";
  method: string;
  velocity?: number;
  timestamp: number;
  status?: "pending" | "synced" | "failed";
};

const PENDING_KEY = "swipe:pending";

function savePending(queue: ActionRecord[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch (e) {
    // ignore
  }
}

function loadPending(): ActionRecord[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

function simulatedPatch(record: ActionRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const delay = 400 + Math.floor(Math.random() * 600);
    setTimeout(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        reject(new Error("offline"));
        return;
      }
      // simulate occasional failure (10%) even when online
      const fail = Math.random() < 0.1;
      if (fail) reject(new Error("server"));
      else resolve();
    }, delay);
  });
}

export default function CardStack({ initialItems }: { initialItems?: Item[] }): JSX.Element {
  const sample = [
    { id: "a1", title: "Sam Taylor", subtitle: "Loves hiking & coffee" },
    { id: "b2", title: "Alex Morgan", subtitle: "Photographer" },
    { id: "c3", title: "Jordan Lee", subtitle: "Engineer" },
    { id: "d4", title: "Casey Wu", subtitle: "Chef" },
  ];

  const [items, setItems] = useState<Item[]>(() => initialItems && initialItems.length ? initialItems : sample);
  const [pending, setPending] = useState<ActionRecord[]>(() => (typeof window !== "undefined" ? loadPending() : []));
  const [isAnimating, setIsAnimating] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimer = useRef<number | null>(null);
  const lastRemoved = useRef<Item | null>(null);

  // persist pending whenever it changes
  useEffect(() => {
    savePending(pending);
  }, [pending]);

  // try to reconcile pending on mount when online
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (navigator.onLine && pending.length > 0) {
      retryPending();
    }
    const onOnline = () => {
      retryPending();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enqueueAction(rec: ActionRecord) {
    setPending(prev => {
      const next = [...prev, rec];
      savePending(next);
      return next;
    });
  }

  function dequeueAction(id: string) {
    setPending(prev => {
      const next = prev.filter(p => !(p.itemId === id && p.timestamp === prev.find(q => q.itemId === id)?.timestamp));
      savePending(next);
      return next;
    });
  }

  async function handleAction(payload: ActionRecord) {
    // optimistic removal of top card
    setIsAnimating(true);
    setItems(prev => {
      // remove the item if present, prefer top
      if (prev.length === 0) return prev;
      const top = prev[0];
      let removed: Item | null = null;
      if (top.id === payload.itemId) {
        removed = top;
        lastRemoved.current = removed;
        return prev.slice(1);
      }
      const idx = prev.findIndex(i => i.id === payload.itemId);
      if (idx >= 0) {
        removed = prev[idx];
        lastRemoved.current = removed;
        const copy = prev.slice();
        copy.splice(idx, 1);
        return copy;
      }
      return prev;
    });

    // show undo
    setUndoVisible(true);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => {
      setUndoVisible(false);
      undoTimer.current = null;
    }, 4000);

    // enqueue pending
    const rec: ActionRecord = { ...payload, status: "pending" };
    enqueueAction(rec);

    // small delay to let animation complete then clear animating
    setTimeout(() => setIsAnimating(false), 320);

    // attempt send
    try {
      await simulatedPatch(rec);
      // mark synced by removing from queue
      setPending(prev => prev.filter(p => !(p.itemId === rec.itemId && p.timestamp === rec.timestamp)));
    } catch (e) {
      // leave as pending
      setPending(prev => prev.map(p => (p.itemId === rec.itemId && p.timestamp === rec.timestamp ? { ...p, status: "pending" } : p)));
    }
  }

  async function retryPending() {
    if (pending.length === 0) return;
    // disable interactions while retrying
    setIsAnimating(true);
    for (const p of [...pending]) {
      try {
        await simulatedPatch(p);
        // remove it
        setPending(prev => prev.filter(x => !(x.itemId === p.itemId && x.timestamp === p.timestamp)));
      } catch (e) {
        // leave
      }
    }
    setIsAnimating(false);
  }

  function handleUndo() {
    if (!lastRemoved.current) return;
    const item = lastRemoved.current;
    // insert at front
    setItems(prev => [item, ...prev]);
    // remove last pending record for this item (best effort)
    setPending(prev => {
      const idx = prev.map(r => r.itemId).lastIndexOf(item.id);
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      savePending(next);
      return next;
    });
    setUndoVisible(false);
    if (undoTimer.current) {
      window.clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    lastRemoved.current = null;
  }

  // wire to SwipeCard
  function onCardAction(payload: { itemId: string; action: "like" | "dislike"; method: "swipe" | "keyboard" | "programmatic"; velocity?: number; timestamp: number }) {
    // wrap payload into ActionRecord and handle
    const rec: ActionRecord = { ...payload };
    handleAction(rec);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 340, maxWidth: "95vw", position: "relative", height: 460 }}>
        {items.length === 0 ? (
          <div style={{ width: 320, maxWidth: "90vw", height: 420, background: "#fff", borderRadius: 12, boxShadow: "0 8px 18px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
            No more cards
          </div>
        ) : (
          items.map((it, idx) => {
            const top = idx === 0;
            const offset = Math.min(12 * idx, 36);
            const scale = Math.max(0.92, 1 - idx * 0.03);
            return (
              <div key={it.id} style={{ position: "absolute", left: offset, right: offset, top: offset / 2, transform: `scale(${scale})`, transition: "transform 200ms ease, left 200ms ease, right 200ms ease", zIndex: items.length - idx }}>
                <SwipeCard item={it} onAction={onCardAction} disabled={isAnimating || !top} />
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ color: "#374151" }}>Pending: {pending.length}</div>
        {pending.length > 0 ? (
          <button onClick={() => retryPending()} style={{ padding: "6px 10px", borderRadius: 6, background: "#111827", color: "#fff" }}>
            Retry
          </button>
        ) : null}
      </div>

      {undoVisible ? (
        <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ background: "#111827", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>Action taken</div>
          <button onClick={handleUndo} style={{ padding: "6px 10px", borderRadius: 6, background: "#ef4444", color: "#fff" }}>
            Undo
          </button>
        </div>
      ) : null}

      <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
        Tip: Use arrow keys or drag cards. Pending actions are stored locally and retried when online.
      </div>
    </div>
  );
}
