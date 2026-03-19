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
          <a href="/register" className="text-indigo-600 hover:underline">
            Register
          </a>
          <a href="/forgot" className="text-indigo-600 hover:underline">
            Forgot password
          </a>
        </div>
      </div>
    </div>
  );
}
