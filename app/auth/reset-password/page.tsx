"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import BackToHome from "@/components/BackToHome";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
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
      if (!res.ok) {
        setError(body?.error || "Failed to reset password");
      } else {
        setMessage(
          "Password has been reset successfully. Redirecting to login..."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!userId || !secret) {
    return (
      <div className="text-center">
        <p className="text-red-500 font-semibold">
          Invalid or expired reset link.
        </p>
        <Link
          href="/auth/forgot-password"
          title="Return to forgot password"
          className="mt-4 inline-block text-[#1d4ed8] hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        New Password
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
          <i className="fa-regular fa-lock text-slate-500" aria-hidden></i>
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
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
          <i className="fa-regular fa-lock text-slate-500" aria-hidden></i>
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

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {message && (
        <p className="text-xs text-green-600 font-medium">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#153ea8] disabled:opacity-60"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] bg-[#f7f9fc] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Set New Password
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ensure your new password is at least 8 characters long.
          </p>
        </div>

        <Suspense fallback={<div>Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center text-sm text-slate-600">
          <Link
            href="/auth/login"
            className="font-semibold text-[#1d4ed8] hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
