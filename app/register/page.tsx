"use client";

import React, { useState } from "react";

export default function RegisterPage(): JSX.Element {
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Registration failed");
      } else {
        setMessage(data?.message || ("Registered successfully: " + JSON.stringify(data.user || data)));
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create an account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-email-input" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="register-email-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="register-password-input" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="register-password-input"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="new-password"
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
              {loading ? "Please wait..." : "Register"}
            </button>
          </div>
        </form>

        {message && (
          <div role="status" className="mt-3 text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-md p-3">
            {message}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 flex justify-between">
          <a href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </a>
          <a href="/forgot" className="text-indigo-600 hover:underline">
            Forgot password
          </a>
        </div>
      </div>
    </div>
  );
}
