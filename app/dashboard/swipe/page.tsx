"use client";

import React from "react";
import CardStack from "../components/CardStack";

export default function Page(): JSX.Element {
  const sampleItems = [
    { id: "p1", title: "Riley", subtitle: "Exploring parks" },
    { id: "p2", title: "Morgan", subtitle: "Bakes sourdough" },
    { id: "p3", title: "Casey", subtitle: "Dog lover" },
    { id: "p4", title: "Drew", subtitle: "Musician" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 6 }}>Swipe Demo</h1>
      <p style={{ marginTop: 0, color: "#6b7280" }}>Use touch or drag to swipe cards. Keyboard: ArrowLeft / ArrowRight / Enter.</p>

      <main style={{ marginTop: 12 }}>
        <CardStack initialItems={sampleItems} />
      </main>

      <div style={{ marginTop: 18, color: "#6b7280", fontSize: 13 }}>
        <strong>Tips:</strong>
        <ul>
          <li>Swipe right (or press ArrowRight/Enter) to like.</li>
          <li>Swipe left (or press ArrowLeft) to dislike.</li>
          <li>Actions are queued locally when offline and retried when online.</li>
        </ul>
      </div>
    </div>
  );
}
