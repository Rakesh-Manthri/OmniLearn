import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemma Study Sphere - Unified Learning Workspace",
  description: "A cohesive, AI-powered learning environment to eliminate cognitive friction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
