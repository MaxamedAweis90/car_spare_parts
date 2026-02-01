"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import BackToHome from "@/components/ui/BackToHome";
import { motion } from "framer-motion";

export default function SellerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, profile, account, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const shouldHide = loading || authenticated;

  useEffect(() => {
    if (loading) return;
    if (!authenticated) return;

    // LOOP PROTECTION
    if (searchParams.get("reason")) {
      setMessage("Session validation failed. Please log in again.");
      return;
    }

    if (profile?.role === "seller") {
      if (account?.emailVerification === false) {
        router.replace(
          `/auth/verify-notice?email=${encodeURIComponent(
            profile?.email || "",
          )}`,
        );
        return;
      }
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
      if (!res.ok || body.mustVerify) {
        if (body.mustVerify) {
          window.location.href = `/auth/verify-notice?email=${encodeURIComponent(
            email,
          )}`;
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
        // Redirect to pending page instead of just showing message
        router.replace("/auth/seller/pending");
        return;
      }
      setMessage("Logged in as seller");
      setMessage("Logged in as seller");
      const callbackUrl = searchParams.get("callbackUrl");
      window.location.href = callbackUrl || "/seller";
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Dynamic Background with Framer Motion */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute -top-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-purple-200/40 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -60, 0],
            x: [0, -50, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-green-200/40 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute -bottom-[20%] left-[20%] h-[700px] w-[700px] rounded-full bg-blue-200/40 blur-[100px]"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:gap-20 xl:gap-32">
        <div className="absolute top-6 left-6 z-50">
          <BackToHome />
        </div>

        {/* Left Side: Brand & Features */}
        <div className="mb-12 flex max-w-xl flex-col lg:mb-0 lg:w-1/2">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Scale Fast. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Sell More.
            </span>
          </h1>

          <div className="mt-12 space-y-10">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <i className="fa-solid fa-chart-line text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Real-time Analytics
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  Track your sales, views, and performance with our advanced
                  dashboard. insights that help you grow.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <i className="fa-solid fa-box-open text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Easy Inventory
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  Manage your products effortlessly. Bulk upload, stock
                  tracking, and automated low-stock alerts.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="font-bold text-white">S</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              SomaParts Seller
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md lg:w-1/2">
          <div className="relative rounded-3xl bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:p-10 border border-white/50">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <a
                  href="/auth/seller/register"
                  className="font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  Apply now
                </a>
              </p>
            </div>

            {message && (
              <div
                className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                  message.includes("success") || message.includes("Logged")
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i
                      className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <a
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-slate-600 hover:text-purple-600"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-slate-800 hover:shadow-purple-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    Logging in...
                  </span>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Protected by
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="mt-4 flex justify-center gap-6 opacity-60 grayscale transition hover:grayscale-0 hover:opacity-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <i className="fa-brands fa-aws text-xl"></i>
                <span>AWS</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <i className="fa-solid fa-shield-halved text-xl"></i>
                <span>SSL Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
