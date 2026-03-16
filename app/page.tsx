import React from "react";

export default function Home(): JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <main style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Welcome</h1>
        <p style={{ marginBottom: 24 }}>Simple auth demo — choose an action below.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/login" style={{ padding: '10px 16px', borderRadius: 6, background: '#111', color: '#fff', textDecoration: 'none' }}>Login</a>
          <a href="/register" style={{ padding: '10px 16px', borderRadius: 6, background: '#0a84ff', color: '#fff', textDecoration: 'none' }}>Register</a>
          <a href="/forgot" style={{ padding: '10px 16px', borderRadius: 6, background: '#e5e7eb', color: '#111', textDecoration: 'none' }}>Forgot Password</a>
        </div>
      </main>
    </div>
  );
}
