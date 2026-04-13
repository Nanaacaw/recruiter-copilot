import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Screening Copilot",
  description: "AI-powered CV screening for faster hiring decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <TooltipProvider>
          <Sidebar />
          <main className="relative ml-72 min-h-screen flex-1 overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.08),transparent_22%),radial-gradient(circle_at_85%_15%,rgba(244,114,182,0.08),transparent_20%)]" />
            <div className="relative z-10">
              <AppTopbar />
              {children}
            </div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
