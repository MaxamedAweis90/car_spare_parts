"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OAuthProvider } from "appwrite";
import { accountClient } from "@/lib/appwrite";
import { useSession } from "@/lib/useSession";
import BackToHome from "@/components/BackToHome";

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginClientContent />
    </Suspense>
  );
}

function LoginClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const verified = searchParams.get("verified");
  const { authenticated, profile, loading } = useSession();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(
    verified ? "Verification successful! Please log in." : ""
  );
  const shouldHide = loading || authenticated;

  useEffect(() => {
    if (loading) return;
    if (authenticated) {
      if (profile?.role === "customer") {
        router.replace("/");
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
      if (profile?.role === "admin" || profile?.role === "main_admin") {
        router.replace("/admin");
        return;
      }
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

      // Customer portal only
      if (role === "main_admin" || role === "admin" || role === "seller") {
        await fetch("/api/auth/logout", { method: "POST" });
        setMessage("User not found for this portal.");
        return;
      }

      setMessage("Logged in successfully");
      router.push("/");
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const success = `${origin}/auth/callback`;
    const failure = `${origin}/auth/login?error=oauth`;

    accountClient.createOAuth2Session(OAuthProvider.Google, success, failure);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] bg-[#f7f9fc] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Sign In</h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, you&apos;ve been missed!
          </p>
        </div>

        {oauthError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            OAuth failed. Try again.
          </div>
        )}
        {message && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-1">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <img
              src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/13.16.0/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Log in with Google
          </button>
        </div>

        <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>Or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

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

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
              <i className="fa-regular fa-lock text-slate-500" aria-hidden></i>
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

        <div className="mt-6 text-center text-sm text-slate-600">
          You haven&apos;t any account?{" "}
          <a
            className="font-semibold text-[#1d4ed8] hover:underline"
            href="/auth/register"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
