"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackToHome from "@/components/ui/BackToHome";

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
      if (res.ok) {
        setMessage("Password reset link sent! Please check your email.");
      } else {
        setError(body.error || "Failed to send reset link.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl mb-4">
            <i className="fa-solid fa-key text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-sm text-slate-600">
            Enter your email and we'll send you a link to reset your password.
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
              Email Address
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">
                <i className="fa-regular fa-envelope text-slate-500"></i>
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
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-slate-600">
          Remember your password?{" "}
          <a
            href="/auth/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}

