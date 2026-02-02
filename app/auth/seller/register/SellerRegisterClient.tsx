"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import BackToHome from "@/components/ui/BackToHome";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
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
        <div className="hidden lg:flex mb-12 max-w-xl flex-col lg:mb-0 lg:w-1/2">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Start Selling <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Today.
            </span>
          </h1>

          <div className="mt-12 space-y-10">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                <i className="fa-solid fa-rocket text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Quick Setup
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  Create your store in minutes. Our onboarding process is
                  designed to get you selling as fast as possible.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <i className="fa-solid fa-users text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Reach Customers
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  Connect with thousands of buyers looking for car parts. Expand
                  your reach beyond your physical location.
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

        {/* Right Side: Register Form */}
        <div className="w-full max-w-md lg:w-1/2">
          <div className="relative rounded-3xl bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl sm:p-10 border border-white/50">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Create an account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Already have an account?{" "}
                <a
                  href="/auth/seller/login"
                  className="font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  Sign in
                </a>
              </p>
            </div>

            {message && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
                  placeholder="Store Owner Name"
                />
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
                  placeholder="business@email.com"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
                  placeholder="Password"
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

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition"
                  placeholder="Confirm Password"
                />
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-800">
                <i className="fa-solid fa-circle-info mr-1.5 align-middle"></i>
                <span>Admin approval is required after registration.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition hover:bg-green-700 hover:shadow-green-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    Submitting...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-xs text-slate-500">
                By registering, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
