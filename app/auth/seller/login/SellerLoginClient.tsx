"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import BackToHome from "@/components/BackToHome";

export default function SellerLoginClient() {
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
    if (profile?.role === "seller") {
      if (profile?.sellerApproved === false) {
        router.replace("/auth/seller/pending");
        return;
      }
      router.replace("/seller");
      return;
    }
    if (profile?.role === "admin" || profile?.role === "main_admin") {
      router.replace("/admin");
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
      const approved = body?.user?.sellerApproved;
      if (role !== "seller") {
        await fetch("/api/auth/logout", { method: "POST" });
        setMessage("User not found for this portal.");
        return;
      }
      if (approved === false) {
        setMessage("Logged in. Seller access is pending admin approval.");
        return;
      }
      setMessage("Logged in as seller");
      router.push("/seller");
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:grid md:grid-cols-2">
        <div className="px-8 py-10 sm:px-12 flex flex-col gap-6">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]"></span>
              Seller Portal
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
              Sign in as Seller
            </h1>
            <p className="text-sm text-slate-600">
              Access your dashboard and manage your storefront.
            </p>
          </div>

          {message && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {message}
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
                  placeholder="seller@shop.com"
                />
              </div>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
                <i
                  className="fa-regular fa-lock text-slate-500"
                  aria-hidden
                ></i>
                <input
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
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

            <div className="flex items-center justify-between text-sm text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                />
                <span>Remember me</span>
              </label>
              <a
                className="font-semibold text-[#1d4ed8] hover:underline"
                href="/auth/forgot-password"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#153ea8] disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <a
              className="font-semibold text-[#1d4ed8] hover:underline"
              href="/auth/seller/register"
            >
              Apply as seller
            </a>
          </div>
        </div>

        <div className="relative hidden md:block bg-[#1f4fe0]">
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent" />
          <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8 py-12 text-white">
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Seller tools
            </div>
            <h2 className="text-2xl font-extrabold">
              Manage your inventory and orders.
            </h2>
            <p className="max-w-sm text-sm text-white/85">
              Track performance, fulfill orders, and keep customers updated from
              one place.
            </p>
            <div className="h-44 w-full max-w-xs rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <div className="h-28 w-40 rounded-xl bg-white/90 shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
