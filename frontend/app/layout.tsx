import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "SentinelAI - AI Detection & Plagiarism Platform",
  description: "Professional AI content detection and plagiarism checking platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen font-sans bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
