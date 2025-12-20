import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../theme/ecommerce.css";
import "./globals.css";

import CDNs from "@/components/Tools/CDNs";
import SiteShell from "@/components/SiteShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spare Parts",
  description: "Spare parts marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <CDNs />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
