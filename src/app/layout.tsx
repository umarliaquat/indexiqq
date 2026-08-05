import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  // Explicitly loading the requested weights for precise hierarchy
  weight: ["400", "500", "600"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "IndexIQ | Global Markets & Quantitative Screening",
  description: "Enterprise-grade Quantitative Stock Market Intelligence, Multi-factor Screening & AI Trade Ideas",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

import { Sidebar } from "@/components/Sidebar";
import { TopTape } from "@/components/TopTape";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interTight.variable}`}>
      <body suppressHydrationWarning>
        <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "var(--color-surface)", overflow: "hidden" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", position: "relative" }}>
            <div className="app-main-flex" style={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0, minHeight: 0 }}>
              <Sidebar />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
                 <TopTape />
                 <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0, minHeight: 0 }}>
                    {children}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
