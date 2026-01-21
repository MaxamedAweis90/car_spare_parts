"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import BackToHome from "@/components/ui/BackToHome";

export default function SellerRegisterClient() {
  return (
    <Suspense fallback={null}>
      <SellerRegisterContent />
    </Suspense>
  );
}

function SellerRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, profile, loading: sessionLoading } = useSession();
  const nameParam = searchParams.get("name") || "";
  const emailParam = searchParams.get("email") || "";
  const [name, setName] = useState(nameParam);
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const shouldHide = sessionLoading || authenticated;

  useEffect(() => {
    setName(nameParam);
  }, [nameParam]);

  useEffect(() => {
    setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!authenticated) return;
    if (profile?.role === "seller") {
      if (profile?.sellerApproved === false) {
        router.replace("/auth/seller/pending");
      } else {
        router.replace("/seller");
      }
      return;
    }
    if (profile?.role === "admin" || profile?.role === "main_admin") {
      router.replace("/admin");
      return;
    }
    if (profile?.role === "customer") {
      router.replace("/");
    }
  }, [
    authenticated,
    profile?.role,
    profile?.sellerApproved,
    sessionLoading,
    router,
  ]);

  if (shouldHide) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, becomeSeller: true }),
      });

      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "Registration failed");
        return;
      }

      setSuccess(true);
      // Wait for 2 seconds then redirect, OR just stay on success screen.
      // The user wants a success screen with a login button, so we'll just set success=true.
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
        <BackToHome />
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 shadow-sm border border-green-100">
              <i className="fa-solid fa-check text-4xl text-green-500"></i>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
            Application Submitted!
          </h1>
          <p className="text-slate-600 mb-8 max-w-sm mx-auto">
            Thank you for applying to SomaParts. Your application is now pending
            admin approval. We will notify you via email once your account is
            activated.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <a
              href="/auth/seller/login"
              className="w-full rounded-xl bg-[#1d4ed8] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#153ea8]"
            >
              Go to Login
            </a>
            <a
              href="/"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-6 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:grid md:grid-cols-2">
        <div className="px-8 py-10 sm:px-12 flex flex-col gap-6">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
              <span className="h-2 w-2 rounded-full bg-[#1d4ed8]"></span>
              Seller Application
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
              Apply to become a seller
            </h1>
            <p className="text-sm text-slate-600">
              Admin approval is required. We&apos;ll notify you when you&apos;re
              approved.
            </p>
          </div>

          {message && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
                <i
                  className="fa-regular fa-user text-slate-500"
                  aria-hidden
                ></i>
                <input
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Store owner name"
                />
              </div>
            </label>

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
                  placeholder="you@business.com"
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

            <label className="block text-sm font-semibold text-slate-700">
              Confirm Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
                <i
                  className="fa-regular fa-lock text-slate-500"
                  aria-hidden
                ></i>
                <input
                  className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </label>

            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-800">
              Admin approval is required. For questions call 61xxxxxx.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#153ea8] disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </form>

          <div className="text-sm text-slate-600">
            Already have an account?{" "}
            <a
              className="font-semibold text-[#1d4ed8] hover:underline"
              href="/auth/seller/login"
            >
              Seller login
            </a>
          </div>
        </div>

        <div className="relative hidden md:block bg-[#1f4fe0]">
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent" />
          <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8 py-12 text-white">
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Grow your store
            </div>
            <h2 className="text-2xl font-extrabold">
              Reach more buyers with us.
            </h2>
            <p className="max-w-sm text-sm text-white/85">
              List products, manage orders, and get insights to boost sales.
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
