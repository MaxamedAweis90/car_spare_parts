"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopBar() {
  // Scroll listener removed
  const pathname = usePathname();

  const suppressedRoutes = ["/auth", "/admin", "/seller"];
  if (suppressedRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <div className="bg-[#12141a] text-xs text-white">
      <div className="mx-auto flex w-full max-w-10/12 items-center justify-between px-4 py-2 sm:px-6">
        <span className="min-w-0 truncate font-semibold tracking-wide">
          Welcome to Spare Parts Store
        </span>
        <div className="hidden items-center gap-4 text-white/80 sm:flex">
          <a href="#" className="hover:text-white transition-colors">
            <i className="fa-brands fa-facebook-f" aria-hidden></i>
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <i className="fa-brands fa-x-twitter" aria-hidden></i>
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <i className="fa-brands fa-instagram" aria-hidden></i>
          </a>
        </div>
      </div>
    </div>
  );
}
