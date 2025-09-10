// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "SIH Dashboard",
  description: "Student Interaction Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Remove className since it's already in globals.css */}
        
        <main className="container mx-auto px-6">{children}</main>
      </body>
    </html>
  );
}