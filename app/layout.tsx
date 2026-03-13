import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { StoreProvider } from "@/lib/store/provider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const headingFont = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "PlateIntel — Dutch License Plate Intelligence",
  description: "Instant Dutch kenteken lookup. Get vehicle profile, APK status, inspection history and recall alerts — powered by RDW open data.",
  keywords: ["kenteken", "RDW", "license plate", "Netherlands", "APK", "vehicle lookup"],
  openGraph: {
    title: "PlateIntel — Dutch Vehicle Intelligence",
    description: "Instant Dutch vehicle lookups from RDW open data.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${bodyFont.variable} ${headingFont.variable} bg-slate-50 font-sans text-slate-900 antialiased`}>
        <StoreProvider>
          <SiteHeader />
          <div className="min-h-screen">{children}</div>
        </StoreProvider>
      </body>
    </html>
  );
}
