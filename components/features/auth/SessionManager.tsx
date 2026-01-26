"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface Session {
  $id: string;
  osName: string;
  osVersion: string;
  clientName: string;
  clientVersion: string;
  deviceBrand: string;
  deviceModel: string;
  ip: string;
  current: boolean;
  lastAccessed?: string;
  $createdAt: string;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
      } else {
        setError(data.error || "Failed to load sessions");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Listen for session changes (e.g. from profile updates)
    const handleSessionChange = () => fetchSessions();
    window.addEventListener("session-changed", handleSessionChange);
    return () =>
      window.removeEventListener("session-changed", handleSessionChange);
  }, []);

  const revokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to sign out this device?")) return;
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to revoke session");
    }
  };

  const revokeAllSessions = async () => {
    if (
      !confirm(
        "Are you sure you want to sign out of ALL devices? You will be logged out immediately.",
      )
    )
      return;
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error(err);
      alert("Failed to revoke sessions");
    }
  };

  if (loading)
    return <div className="p-4 text-slate-500">Loading sessions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fa-solid fa-desktop text-slate-400"></i>
          Active Sessions
        </h2>
        {sessions.length > 1 && (
          <button
            onClick={revokeAllSessions}
            className="text-red-600 hover:text-red-700 text-sm font-bold transition"
          >
            Sign Out All Devices
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No active sessions found.</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.$id}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                s.current
                  ? "border-green-200 bg-green-50/50"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-12 w-12 flex items-center justify-center rounded-full border text-xl ${
                    s.current
                      ? "bg-white border-green-200 text-green-600"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  <i
                    className={`fa-solid ${
                      s.clientName?.toLowerCase().includes("mobile") ||
                      s.deviceModel?.toLowerCase().includes("phone") ||
                      s.osName?.toLowerCase().includes("android") ||
                      s.osName?.toLowerCase().includes("ios")
                        ? "fa-mobile-screen"
                        : "fa-laptop"
                    }`}
                  ></i>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {s.deviceBrand && s.deviceModel
                      ? `${s.deviceBrand} ${s.deviceModel}`
                      : `${s.osName} ${s.osVersion}`}
                    {s.current && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Current Device
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-0.5">
                    <span>
                      {s.clientName} {s.clientVersion}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{s.ip}</span>
                    <span className="hidden sm:inline">•</span>
                    <span title={new Date(s.$createdAt).toLocaleString()}>
                      Started {new Date(s.$createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {!s.current && (
                <Button
                  onClick={() => revokeSession(s.$id)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Sign out this device"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span className="sr-only">Sign out</span>
                </Button>
              )}
            </div>
          ))
        )}
      </div>
      <p className="mt-4 text-xs text-slate-400 text-center">
        If you see a device you don&apos;t recognize, sign it out and change
        your password immediately.
      </p>
    </div>
  );
}
