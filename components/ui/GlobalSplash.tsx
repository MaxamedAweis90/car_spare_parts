"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import SplashScreen from "./SplashScreen";

export default function GlobalSplash() {
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const targetPaths = ["/auth", "/admin", "/seller"];
    const isTargetPage = targetPaths.some((path) => pathname?.startsWith(path));

    // Check if we are entering a target zone from a non-target zone
    const wasTargetPage = prevPathRef.current
      ? targetPaths.some((path) => prevPathRef.current?.startsWith(path))
      : false;

    // Trigger on:
    // 1. Initial Load (Refresh): ALWAYS show, regardless of page.
    // 2. Navigation: Show ONLY when entering a target zone (Auth/Admin/Seller) from a non-target zone.
    if (!prevPathRef.current) {
      setIsVisible(true);
    } else if (isTargetPage && !wasTargetPage) {
      setIsVisible(true);
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  if (!isVisible) return null;

  return <SplashScreen onComplete={() => setIsVisible(false)} />;
}
