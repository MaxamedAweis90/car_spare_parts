"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";

const HIDE_PREFIXES = ["/auth", "/admin", "/seller"];

function shouldHideChrome(pathname: string) {
  return HIDE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const hideChrome = shouldHideChrome(pathname);

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Navbar />
      <main className="flex-1 bg-white pb-16 sm:pb-0">{children}</main>
      <Footer />
    </div>
  );
}
