"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import BackToHome from "@/components/ui/BackToHome";

export default function AdminLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, profile, account, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [redirectData, setRedirectData] = useState<{
    url: string;
    label: string;
  } | null>(null);
  const shouldHide = loading || authenticated;

  useEffect(() => {
    if (loading) return;
    if (!authenticated) return;

    // LOOP PROTECTION: If redirected here with a reason, DO NOT auto-redirect back
    if (searchParams.get("reason")) {
      setMessage("Session validation failed. Please log in again.");
      return;
    }

    if (profile?.role === "admin" || profile?.role === "main_admin") {
      if (account?.emailVerification === false) {
        router.replace(
          `/auth/verify-notice?email=${encodeURIComponent(
            profile?.email || "",
          )}`,
        );
        return;
      }
      router.replace("/admin");
      return;
    }
    if (profile?.role === "seller") {
      router.replace("/seller");
      return;
    }
    if (profile?.role === "customer") {
      router.replace("/");
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
        body: JSON.stringify({ email, password, requiredRole: "admin" }),
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
        if (body.redirectUrl) {
          setRedirectData({
            url: body.redirectUrl,
            label: body.redirectLabel || "Go to Portal",
          });
        }
        return;
      }

      const role = body?.user?.role;
      if (role !== "admin" && role !== "main_admin") {
        await fetch("/api/auth/logout", { method: "POST" });
        setMessage("User not found for this portal.");
        return;
      }
      setMessage("Logged in as admin");
      setMessage("Logged in as admin");
      const callbackUrl = searchParams.get("callbackUrl");
      window.location.href = callbackUrl || "/admin";
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
      <div className="w-full max-w-[500px] overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] ">
        <div className="px-8 py-10 sm:px-12 flex flex-col gap-6">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-700"></span>
              Admin Portal
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
              Admin Sign In
            </h1>
            <p className="text-sm text-slate-600">
              Access the admin dashboard to manage the platform.
            </p>
          </div>

          {message && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <p>{message}</p>
              {redirectData && (
                <a
                  href={redirectData.url}
                  className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                >
                  {redirectData.label}{" "}
                  <i className="fa-solid fa-arrow-right ml-1"></i>
                </a>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/20">
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
                  placeholder="admin@platform.com"
                />
              </div>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/20">
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* <div className="relative hidden md:block bg-gradient-to-br from-red-600 to-red-800">
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent" />
          <div className="relative flex h-full flex-col items-center justify-center gap-6 px-8 py-12 text-white">
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Admin Access
            </div>
            <h2 className="text-2xl font-extrabold">
              Manage the entire platform.
            </h2>
            <p className="max-w-sm text-sm text-white/85">
              Control users, sellers, products, and monitor platform activity.
            </p>
            <div className="h-44 w-full max-w-xs rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <div className="h-28 w-40 rounded-xl bg-white/90 shadow-lg" />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
