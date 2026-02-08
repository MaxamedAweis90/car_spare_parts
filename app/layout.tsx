import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../theme/ecommerce.css";
import "./globals.css";

import CDNs from "@/components/layout/Tools/CDNs";
import SiteShell from "@/components/layout/SiteShell";
import QueryProvider from "@/lib/providers/QueryProvider";
import AntdRegistryProvider from "@/lib/providers/AntdRegistryProvider";
import { CartProvider } from "@/lib/cart";
import GlobalSplash from "@/components/ui/GlobalSplash";
import StructuredData from "@/components/layout/StructuredData";
import {
  defaultMetadata,
  organizationSchema,
  websiteSchema,
} from "@/lib/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Export comprehensive metadata
export const metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
        <StructuredData data={[organizationSchema, websiteSchema]} />
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
