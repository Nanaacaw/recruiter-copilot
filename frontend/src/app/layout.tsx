import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex">
        <TooltipProvider>
          <Sidebar />
          <main className="relative min-h-screen flex-1 overflow-x-hidden lg:ml-72">
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
