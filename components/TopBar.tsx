"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopBar() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => 
    {
      const y = window.scrollY;
      if (y > lastY.current && y > 40) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const pathname = usePathname();

  const suppressedRoutes = ["/auth", "/admin", "/seller"];
  if (suppressedRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <div
      className={`sticky top-0 z-40 bg-[#12141a] text-xs text-white transition-transform duration-200 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="mx-auto flex w-full max-w-10/12 items-center justify-between px-4 py-2 sm:px-6">
        <span className="font-semibold tracking-wide">Welcome to Spare Parts Store</span>
        <div className="flex items-center gap-4 text-white/80">
          <a href="#" className="hover:text-white transition-colors"><i className="fa-brands fa-facebook-f" aria-hidden></i></a>
          <a href="#" className="hover:text-white transition-colors"><i className="fa-brands fa-x-twitter" aria-hidden></i></a>
          <a href="#" className="hover:text-white transition-colors"><i className="fa-brands fa-instagram" aria-hidden></i></a>
        </div>
      </div>
    </div>
  );
}
