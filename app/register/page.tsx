"use client";

import React, { useState } from "react";

export default function RegisterPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email) return setMessage("Email required");
    if (password.length < 6) return setMessage("Password must be at least 6 characters");
    if (password !== confirm) return setMessage("Passwords do not match");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data?.error || "Registration failed");
      else setMessage("Registered successfully. You can now log in.");
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: 20 }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input placeholder="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>Create account</button>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
      <div style={{ marginTop: 12 }}>
        <a href="/login">Already have an account? Sign in</a>
      </div>
    </div>
  );
}
