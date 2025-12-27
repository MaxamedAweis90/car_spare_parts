"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OAuthProvider } from "appwrite";
import { accountClient } from "@/lib/appwrite";
import { useSession } from "@/lib/useSession";

export default function RegisterClient() {
  const router = useRouter();
  const { authenticated, profile, loading: sessionLoading } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const shouldHide = sessionLoading || authenticated;

  useEffect(() => {
    if (sessionLoading) return;
    if (!authenticated) return;
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

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "Registration failed");
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        setMessage("Registered. Please log in manually.");
        return;
      }

      setMessage("Registered and logged in");
      router.push("/");
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const success = `${origin}/auth/callback`;
      const failure = `${origin}/auth/register?error=oauth`;
      await accountClient.createOAuth2Session(
        OAuthProvider.Google,
        success,
        failure
      );
    } catch (err) {
      console.error(err);
      setMessage("Google sign-up failed. Try email instead.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] bg-[#f7f9fc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Create Account
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Join us to manage orders and save your cart.
          </p>
        </div>

        {message && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-1">
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <img
              src="https://cdnjs.cloudflare.com/ajax/libs/simple-icons/13.16.0/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Sign up with Google
          </button>
        </div>

        <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>Or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-[#1d4ed8] focus-within:ring-2 focus-within:ring-[#1d4ed8]/20">
              <i className="fa-regular fa-user text-slate-500" aria-hidden></i>
              <input
                className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ahmed Cali"
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
                minLength={8}
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
            <p className="mt-1 text-xs text-slate-500">
              Must be at least 8 characters
            </p>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#153ea8] disabled:opacity-60"
          >
            {submitting ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a
            className="font-semibold text-[#1d4ed8] hover:underline"
            href="/auth/login"
          >
            Sign In
          </a>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 text-center">
          Selling with us?{" "}
          <button
            type="button"
            onClick={() => router.push("/auth/seller/register")}
            className="font-semibold text-[#1d4ed8] hover:underline"
          >
            Become a seller
          </button>
        </div>
      </div>
    </div>
  );
}
