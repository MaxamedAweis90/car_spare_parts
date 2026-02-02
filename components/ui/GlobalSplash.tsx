"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SplashScreen from "./SplashScreen";

export default function GlobalSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Show splash only for specific paths (Auth, Admin, Seller)
    // These are typically the pages without the main customer navbar/footer
    const targetPaths = ["/auth", "/admin", "/seller"];
    const isTargetPage = targetPaths.some((path) => pathname?.startsWith(path));

    if (isTargetPage) {
      setIsVisible(true);
    }
  }, []); // Run once on mount (refresh)

  if (!isVisible) return null;

  return <SplashScreen onComplete={() => setIsVisible(false)} />;
}
