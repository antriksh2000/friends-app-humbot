"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";

export default function ResetPage(): JSX.Element {
  const params = useParams();
  const token = params?.token as string | undefined;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!password || password.length < 6) return setMessage("Password must be at least 6 characters");
    if (password !== confirm) return setMessage("Passwords do not match");
    if (!token) return setMessage("Missing token");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data?.error || "Reset failed");
      else setMessage(data?.message || "Password reset successful. You can log in.");
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: 20 }}>
      <h2>Reset password</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input placeholder="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>Set new password</button>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
      <div style={{ marginTop: 12 }}>
        <a href="/login">Back to login</a>
      </div>
    </div>
  );
}
