"use client";

import { useState } from "react";
import Link from "next/link";
import BackToHome from "@/components/BackToHome";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Failed to send reset link");
      } else {
        setMessage(
          "If an account exists for this email, a reset link has been sent."
        );
        setEmail("");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] bg-[#f7f9fc] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Forgot Password
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
              <i
                className="fa-regular fa-envelope text-slate-500"
                aria-hidden
              ></i>
              <input
                className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#153ea8] disabled:opacity-60"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[#1d4ed8] hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
