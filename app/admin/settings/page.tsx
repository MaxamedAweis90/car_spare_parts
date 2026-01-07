"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/useSession";

interface Session {
  $id: string;
  osName: string;
  browserName: string;
  clientIp: string;
  current: boolean;
}

export default function AdminSettings() {
  const { profile } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passMessage, setPassMessage] = useState("");
  const [passError, setPassError] = useState("");

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage("");
    setPassError("");

    if (passwordForm.new !== passwordForm.confirm) {
      setPassError("New passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      if (res.ok) {
        setPassMessage("Password updated successfully");
        setPasswordForm({ current: "", new: "", confirm: "" });
      } else {
        const data = await res.json();
        setPassError(data.error || "Failed to update password");
      }
    } catch (err) {
      setPassError("Server error");
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session?")) return;
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const revokeAllSessions = async () => {
    if (
      !confirm(
        "Are you sure you want to revoke ALL sessions? You will be logged out."
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Admin Settings</h1>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-slate-400"></i>
          Security & Password
        </h2>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Current Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              New Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              value={passwordForm.new}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-slate-900"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
              required
            />
          </div>
          {passMessage && (
            <p className="text-sm text-green-600 font-medium">{passMessage}</p>
          )}
          {passError && (
            <p className="text-sm text-red-600 font-medium">{passError}</p>
          )}
          <button
            type="submit"
            className="bg-slate-900 text-white rounded-xl px-6 py-2 text-sm font-bold hover:bg-slate-800 transition"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Session Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-desktop text-slate-400"></i>
            Active Sessions
          </h2>
          <button
            onClick={revokeAllSessions}
            className="text-red-600 hover:text-red-700 text-sm font-bold"
          >
            Revoke All Sessions
          </button>
        </div>
        <div className="space-y-3">
          {loadingSessions ? (
            <p className="text-sm text-slate-500">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No active sessions found.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.$id}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center bg-white rounded-full border border-slate-200">
                    <i
                      className={`fa-solid ${
                        s.browserName.toLowerCase().includes("chrome")
                          ? "fa-chrome"
                          : "fa-globe"
                      } text-slate-500`}
                    ></i>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {s.browserName} on {s.osName}
                      {s.current && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      IP: {s.clientIp}
                    </div>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revokeSession(s.$id)}
                    className="text-slate-400 hover:text-red-600 transition"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
