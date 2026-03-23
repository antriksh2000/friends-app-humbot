"use client";

import React from "react";
import CardStack from "../components/CardStack";

export default function Page(): JSX.Element {
  const sampleItems = [
    { id: "s1", title: "Riley Park", subtitle: "Loves plants & bikes" },
    { id: "s2", title: "Morgan Fox", subtitle: "Enjoys coffee shops" },
    { id: "s3", title: "Taylor Ray", subtitle: "Designer & traveler" },
    { id: "s4", title: "Jamie Quinn", subtitle: "Food lover" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Swipe Demo</h1>
      <p style={{ marginTop: 0, color: "#6b7280", marginBottom: 16 }}>Use drag gestures or ← → keys. Actions are queued locally for offline resilience.</p>
      <CardStack initialItems={sampleItems} />
    </div>
  );
}
