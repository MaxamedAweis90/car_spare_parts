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
  const isAuthPath =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth");

  // REHYDRATE FROM LOCALSTORAGE ON MOUNT
  useEffect(() => {
    // Check if we should skip cache (e.g., just verified)
    const params = new URLSearchParams(window.location.search);
    const shouldSkipCache = params.get("verified") === "true";

    if (shouldSkipCache) {
      localStorage.removeItem("spareparts-session");
      // Keep loading as true to avoid flicker
      return;
    }

    const cached = localStorage.getItem("spareparts-session");
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        // Add timestamp to force cache bypass
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/auth/me?t=${timestamp}`, {
          cache: "no-store",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const body = await res.json();

        if (isMounted) {
          setData(body);
          // PERSIST: Save to localStorage for next time
          if (body.authenticated) {
            localStorage.setItem("spareparts-session", JSON.stringify(body));
          } else {
            localStorage.removeItem("spareparts-session");
          }
        }
      } catch {
        if (isMounted) {
          setData({ authenticated: false });
          localStorage.removeItem("spareparts-session");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();

    const onSessionChanged = () => {
      fetchSession();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("session-changed", onSessionChanged);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("session-changed", onSessionChanged);
      }
    };
  }, []);

  return {
    ...data,
    loading,
    isAuthPath,
    refresh: () => window.dispatchEvent(new Event("session-changed")),
  };
}

