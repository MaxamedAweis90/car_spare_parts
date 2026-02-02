import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../theme/ecommerce.css";
import "./globals.css";

import CDNs from "@/components/layout/Tools/CDNs";
import SiteShell from "@/components/layout/SiteShell";
import QueryProvider from "@/lib/providers/QueryProvider";
import AntdRegistryProvider from "@/lib/providers/AntdRegistryProvider";
import { CartProvider } from "@/lib/cart";
import GlobalSplash from "@/components/ui/GlobalSplash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SomaParts",
  description: "Premium car parts marketplace",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <CDNs />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <QueryProvider>
          <AntdRegistryProvider>
            <CartProvider>
              <GlobalSplash />
              <SiteShell>{children}</SiteShell>
            </CartProvider>
          </AntdRegistryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
