"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackToHome from "@/components/ui/BackToHome";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret, password }),
      });

      const body = await res.json();
      if (res.ok) {
        setMessage(
          "Password has been reset successfully! Redirecting to login..."
        );
        setTimeout(() => router.push("/auth/login"), 3000);
      } else {
        setError(body.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !secret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
          <p className="text-slate-600">
            The password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push("/auth/forgot-password")}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            Request a new link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl mb-4">
            <i className="fa-solid fa-lock-open text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-slate-600">
            Choose a strong new password for your account.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block text-sm font-semibold text-slate-700">
              New Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                <i className="fa-regular fa-lock text-slate-500"></i>
                <input
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Confirm New Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                <i className="fa-regular fa-lock text-slate-500"></i>
                <input
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

