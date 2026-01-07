"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import BackToHome from "@/components/BackToHome";

export default function AdminLoginClient() {
  const router = useRouter();
  const { authenticated, profile, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const shouldHide = loading || authenticated;

  useEffect(() => {
    if (loading) return;
    if (!authenticated) return;
    if (profile?.role === "admin" || profile?.role === "main_admin") {
      router.replace("/admin");
      return;
    }
    if (profile?.role === "seller") {
      if (profile?.sellerApproved === false) {
        router.replace("/auth/seller/pending");
      } else {
        router.replace("/seller");
      }
      return;
    }
    if (profile?.role === "customer") {
      router.replace("/");
    }
  }, [authenticated, profile?.role, profile?.sellerApproved, loading, router]);

  if (shouldHide) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        if (body.mustVerify) {
          router.push(`/auth/verify-notice?email=${encodeURIComponent(email)}`);
          return;
        }
        setMessage(body?.error || "Login failed");
        return;
      }

      const role = body?.user?.role;
      if (role === "main_admin" || role === "admin") {
        router.push("/admin");
        setMessage("Logged in as admin");
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
        setMessage("User not found for this portal.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <div className="relative mt-2">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 pr-10"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`fa-regular ${
                    showPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                  aria-hidden
                ></i>
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>Remember me</span>
            </label>
            <a
              className="font-semibold text-slate-900 hover:underline"
              href="/auth/forgot-password"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p>
        )}
      </div>
    </div>
  );
}
