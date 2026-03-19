"use client";

import React, { useState } from "react";
import { signInWithGooglePopup } from "../lib/firebaseClient";

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("returnUrl") : null;

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
        // Attempt to hydrate canonical user from server
        try {
          const curRes = await fetch('/api/auth/current');
          if (curRes.ok) {
            const curData = await curRes.json();
            try {
              localStorage.setItem('currentUser', JSON.stringify(curData.user));
            } catch (e) {
              // ignore storage errors
            }
          } else {
            // fallback to data.user if provided
            if (data?.user) {
              try {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
              } catch (e) {}
            }
            // surface a non-fatal message but still redirect below
            if (curRes.status === 401) {
              setMessage('Signed in, but server did not return a session.');
            }
          }
        } catch (err) {
          if (data?.user) {
            try {
              localStorage.setItem('currentUser', JSON.stringify(data.user));
            } catch (e) {}
          }
        }

        // Redirect to safe returnUrl or dashboard
        const target = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard';
        window.location.replace(target);
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
      if (!res.ok) {
        setMessage(data?.error || "Google sign-in failed");
      } else {
        // hydrate canonical user after server-side Google sign-in
        try {
          const curRes = await fetch('/api/auth/current');
          if (curRes.ok) {
            const curData = await curRes.json();
            try {
              localStorage.setItem('currentUser', JSON.stringify(curData.user));
            } catch (e) {}
          } else if (data?.user) {
            try { localStorage.setItem('currentUser', JSON.stringify(data.user)); } catch (e) {}
          }
        } catch (err) {
          if (data?.user) {
            try { localStorage.setItem('currentUser', JSON.stringify(data.user)); } catch (e) {}
          }
        }

        const target = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard';
        window.location.replace(target);
      }
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="current-password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex justify-center items-center px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? "bg-indigo-500 cursor-not-allowed opacity-70" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Please wait..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="my-4">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-md bg-white hover:bg-gray-50"
            aria-label="Continue with Google"
          >
            {/* Placeholder for an icon area */}
            <span className="text-sm text-gray-700">{loading ? "Processing..." : "Continue with Google"}</span>
          </button>
        </div>

        {message && (
          <div role="status" className="mt-3 text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-md p-3">
            {message}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 flex justify-between">
          <a href={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`} className="text-indigo-600 hover:underline">
            Register
          </a>
          <a href={`/forgot${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`} className="text-indigo-600 hover:underline">
            Forgot password
          </a>
        </div>
      </div>
    </div>
  );
}
