"use client";

import React, { useState } from "react";
import { signInWithGooglePopup } from "../lib/firebaseClient";

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email || !password) {
      setMessage("Please provide email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Login failed");
      } else {
        setMessage("Signed in successfully: " + JSON.stringify(data.user));
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    setLoading(true);
    try {
      const result = await signInWithGooglePopup();
      const idToken = result.idToken;
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data?.error || "Google sign-in failed");
      else setMessage("Signed in with Google: " + JSON.stringify(data.user || data));
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: 20 }}>
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>Sign in</button>
      </form>

      <div style={{ margin: '12px 0' }}>
        <button onClick={handleGoogle} disabled={loading} style={{ padding: '8px 12px' }}>Continue with Google</button>
      </div>

      {message && <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{message}</div>}

      <div style={{ marginTop: 18 }}>
        <a href="/register" style={{ marginRight: 12 }}>Register</a>
        <a href="/forgot">Forgot password</a>
      </div>
    </div>
  );
}
