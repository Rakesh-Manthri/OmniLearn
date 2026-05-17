import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "OmniLearn — AI-Powered Learning Platform",
  description: "Master complex topics without the friction. AI-powered course generation, Socratic tutoring, and deep focus tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light-theme">
      <body className="bg-background text-foreground antialiased transition-colors duration-500">
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
