"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import BackToHome from "@/components/BackToHome";

export default function LoginClient() {
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
    if (profile?.role === "customer") {
      router.replace("/");
      return;
    }
    if (profile?.role === "seller") {
      router.replace("/seller");
      return;
    }
    if (profile?.role === "admin" || profile?.role === "main_admin") {
      router.replace("/admin");
    }
  }, [authenticated, profile?.role, loading, router]);

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

      setMessage("Logged in successfully");
      router.push("/");
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { Account } = await import("appwrite");
      const { Client } = await import("appwrite");

      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

      const account = new Account(client);

      const origin = window.location.origin;
      await account.createOAuth2Session(
        "google" as any,
        `${origin}/auth/callback`,
        `${origin}/auth/login`
      );
    } catch (error) {
      console.error("Google login error:", error);
      setMessage("Failed to initiate Google login");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:grid md:grid-cols-2">
        <div className="px-8 py-10 sm:px-12 flex flex-col gap-6">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-700"></span>
              Customer Login
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-600">
              Sign in to your account to continue shopping.
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
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20">
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
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20">
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
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-600"
                />
                <span>Remember me</span>
              </label>
              <a
                className="font-semibold text-green-700 hover:underline"
                href="/auth/forgot-password"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#f2f5fb] px-2 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <a
              className="font-semibold text-green-700 hover:underline"
              href="/auth/register"
            >
              Create account
            </a>
          </div>
        </div>

        <div className="relative hidden md:block bg-gradient-to-br from-green-600 to-green-800">
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent" />
          <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8 py-12 text-white">
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Shop with us
            </div>
            <h2 className="text-2xl font-extrabold">
              Find the perfect car parts.
            </h2>
            <p className="max-w-sm text-sm text-white/85">
              Browse thousands of quality parts from trusted sellers.
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
