"use client";

import React, { useState } from "react";

export default function ForgotPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setResetUrl(null);
    if (!email) return setMessage("Email required");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data?.error || "Request failed");
      else {
        setMessage(data?.message || "If the account exists, a reset link was sent.");
        if (data?.resetUrl) setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: 20 }}>
      <h2>Forgot password</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>Send reset link</button>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
      {resetUrl && (
        <div style={{ marginTop: 12 }}>
          <div>Development reset URL:</div>
          <a href={resetUrl}>{resetUrl}</a>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <a href="/login">Back to login</a>
      </div>
    </div>
  );
}
