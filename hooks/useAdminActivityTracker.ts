"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/useSession";
import { useRouter } from "next/navigation";

const ADMIN_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 4.5 * 60 * 1000; // 4 minutes 30 seconds
const CHECK_INTERVAL = 10 * 1000; // Check every 10 seconds

export function useAdminActivityTracker() {
  const { profile } = useSession();
  const router = useRouter();
  const [idleTime, setIdleTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.role === "main_admin";

  useEffect(() => {
    if (!isAdmin) return;

    let lastActivity = Date.now();
    setLastActivityTime(lastActivity);

    const updateActivity = () => {
      lastActivity = Date.now();
      setLastActivityTime(lastActivity);
      setIdleTime(0);
      setShowWarning(false);
      setIsLoggedOut(false);

      // Update in localStorage
      try {
        const session = localStorage.getItem("spareparts-session");
        if (session) {
          const data = JSON.parse(session);
          data.sessionMeta = {
            ...data.sessionMeta,
            lastActivity: new Date().toISOString(),
          };
          localStorage.setItem("spareparts-session", JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to update activity timestamp:", error);
      }
    };

    // Track activity events
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Check idle time periodically
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivity;
      setIdleTime(idle);

      // Show warning at 4:30
      if (idle >= WARNING_TIME && idle < ADMIN_TIMEOUT) {
        setShowWarning(true);
      }

      // Auto-logout at 5:00
      if (idle >= ADMIN_TIMEOUT) {
        handleTimeout();
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [isAdmin]);

  const handleTimeout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("spareparts-session");
      setIsLoggedOut(true);
      setShowWarning(false);
    }
  };

  const extendSession = () => {
    setLastActivityTime(Date.now());
    setIdleTime(0);
    setShowWarning(false);

    // Trigger activity update
    const event = new Event("mousemove");
    window.dispatchEvent(event);
  };

  const remainingTime = Math.max(0, ADMIN_TIMEOUT - idleTime);
  const remainingSeconds = Math.floor(remainingTime / 1000);

  return {
    idleTime,
    showWarning,
    extendSession,
    remainingSeconds,
    isAdmin,
    isLoggedOut,
  };
}
