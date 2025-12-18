"use client";

import { useEffect, useState } from "react";

interface SessionResponse {
  authenticated: boolean;
  account?: any;
  profile?: any;
}

export function useSession() {
  const [data, setData] = useState<SessionResponse>({ authenticated: false });
  const [loading, setLoading] = useState(true);

  // redirect hints for auth pages
  const isAuthPath = typeof window !== "undefined" && window.location.pathname.startsWith("/auth");


  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const body = await res.json();
        if (isMounted) {
          setData(body);
        }
      } catch {
        if (isMounted) setData({ authenticated: false });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, []);

  return { ...data, loading, isAuthPath };
}
