import './globals.css';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CDN for quick prototyping. For production, replace with a compiled Tailwind build. */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
