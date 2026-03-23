"use client";

import React, { useEffect, useRef, useState } from "react";
import SwipeCard from "./SwipeCard";

type Item = { id: string; title?: string; subtitle?: string };

type ActionRecord = {
  itemId: string;
  action: "like" | "dislike";
  method: string;
  velocity?: number;
  timestamp: number;
  status?: "pending" | "synced" | "failed";
};

const STORAGE_KEY = "swipe:pending";

function loadPending(): ActionRecord[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    return [];
  }
}

function savePending(q: ActionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  } catch (err) {
    // ignore
  }
}

function simulatedPatch(rec: ActionRecord): Promise<void> {
  // simulate network latency and failure when offline
  return new Promise((resolve, reject) => {
    const delay = 600 + Math.floor(Math.random() * 800);
    setTimeout(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        reject(new Error("offline"));
      } else {
        // small 10% failure chance when online
        if (Math.random() < 0.1) reject(new Error("server"));
        else resolve();
      }
    }, delay);
  });
}

export default function CardStack({ initialItems }: { initialItems?: Item[] }): JSX.Element {
  const defaults: Item[] = initialItems ?? [
    { id: "a1", title: "Alex", subtitle: "Loves hiking" },
    { id: "b2", title: "Sam", subtitle: "Coffee enthusiast" },
    { id: "c3", title: "Jordan", subtitle: "Photographer" },
    { id: "d4", title: "Taylor", subtitle: "Chef" },
  ];

  const [items, setItems] = useState<Item[]>(defaults);
  const [pendingQueue, setPendingQueue] = useState<ActionRecord[]>(() => loadPending());
  const [isRetrying, setIsRetrying] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimerRef = useRef<number | null>(null);
  const lastRemovedRef = useRef<Item | null>(null);

  useEffect(() => savePending(pendingQueue), [pendingQueue]);

  useEffect(() => {
    // Attempt to resend on mount if online
    if (navigator.onLine) {
      if (pendingQueue.length > 0) {
        retryPending();
      }
    }
    function onOnline() {
      if (pendingQueue.length > 0) retryPending();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enqueueAction(rec: ActionRecord) {
    setPendingQueue(prev => {
      const next = [...prev, rec];
      savePending(next);
      return next;
    });
  }

  function dequeueById(itemId: string) {
    setPendingQueue(prev => {
      const next = prev.filter(p => p.itemId !== itemId);
      savePending(next);
      return next;
    });
  }

  function onAction(payload: { itemId: string; action: "like" | "dislike"; method: "swipe" | "keyboard" | "programmatic"; velocity?: number; timestamp: number }) {
    // Optimistic removal of the item
    setItems(prev => {
      const idx = prev.findIndex(it => it.id === payload.itemId);
      let removed: Item | null = null;
      if (idx >= 0) {
        removed = prev[idx];
        const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        lastRemovedRef.current = removed;
        // show undo toast
        setUndoVisible(true);
        if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = window.setTimeout(() => setUndoVisible(false), 4000);
        return next;
      }
      return prev;
    });

    const rec: ActionRecord = { ...payload, status: "pending" };
    enqueueAction(rec);

    // fire simulated API
    simulatedPatch(rec)
      .then(() => {
        // mark synced and remove from queue
        setPendingQueue(prev => {
          const next = prev.filter(p => !(p.itemId === rec.itemId && p.timestamp === rec.timestamp));
          savePending(next);
          return next;
        });
      })
      .catch(() => {
        // leave in queue as pending/failed
        setPendingQueue(prev => {
          const next = prev.map(p => (p.itemId === rec.itemId && p.timestamp === rec.timestamp ? { ...p, status: "pending" } : p));
          savePending(next);
          return next;
        });
      });
  }

  function retryPending() {
    if (pendingQueue.length === 0) return;
    setIsRetrying(true);
    const queueCopy = [...pendingQueue];
    // attempt each sequentially to keep things simple
    (async () => {
      for (const rec of queueCopy) {
        try {
          await simulatedPatch(rec);
          // remove on success
          setPendingQueue(prev => {
            const next = prev.filter(p => !(p.itemId === rec.itemId && p.timestamp === rec.timestamp));
            savePending(next);
            return next;
          });
        } catch (err) {
          // keep it pending
        }
      }
    })()
      .finally(() => setIsRetrying(false));
  }

  function handleUndo() {
    if (!lastRemovedRef.current) return;
    const item = lastRemovedRef.current;
    setItems(prev => [item, ...prev]);
    // remove last pending corresponding to that item
    setPendingQueue(prev => {
      const idx = prev.map(p => p.itemId).lastIndexOf(item.id);
      if (idx >= 0) {
        const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        savePending(next);
        return next;
      }
      return prev;
    });
    lastRemovedRef.current = null;
    setUndoVisible(false);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  // Top card is items[0]
  const topId = items[0]?.id;

  return (
    <div style={{ padding: 12, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Swipe Stack</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {pendingQueue.length > 0 ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span aria-live="polite">⏳ Pending: {pendingQueue.length}</span>
              <button
                onClick={() => retryPending()}
                disabled={isRetrying}
                style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer" }}
                aria-label="Retry pending swipes"
              >
                {isRetrying ? "Retrying…" : "Retry"}
              </button>
            </div>
          ) : (
            <div style={{ color: "#6b7280", fontSize: 13 }}>No pending actions</div>
          )}
        </div>
      </div>

      <div style={{ position: "relative", height: 460 }}>
        {items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No more cards</div>
        ) : null}

        {items.map((it, idx) => {
          const isTop = idx === 0;
          const offset = Math.min(12 * idx, 48);
          return (
            <div
              key={it.id}
              style={{
                position: "absolute",
                left: "50%",
                transform: `translateX(-50%)`,
                top: offset,
                zIndex: items.length - idx,
                transition: "top 200ms ease",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                pointerEvents: isTop ? "auto" : "none",
              }}
            >
              <SwipeCard
                item={it}
                onAction={onAction}
                disabled={!isTop}
              />
            </div>
          );
        })}
      </div>

      {/* Undo toast */}
      {undoVisible && (
        <div style={{ position: "fixed", left: 20, bottom: 20, background: "#111827", color: "#fff", padding: "10px 14px", borderRadius: 8, display: "flex", gap: 12, alignItems: "center" }}>
          <span>Action recorded</span>
          <button onClick={handleUndo} style={{ background: "#fff", color: "#111827", padding: "6px 10px", borderRadius: 6 }}>Undo</button>
        </div>
      )}
    </div>
  );
}
