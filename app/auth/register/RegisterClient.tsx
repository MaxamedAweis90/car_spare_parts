"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";
import BackToHome from "@/components/ui/BackToHome";

export default function RegisterClient() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, profile, loading: sessionLoading } = useSession();
  const nameParam = searchParams.get("name") || "";
  const emailParam = searchParams.get("email") || "";
  const returnUrl = searchParams.get("returnUrl");
  const intent = searchParams.get("intent");

  const [name, setName] = useState(nameParam);
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState(
    intent === "follow" ? "Join us to follow your favorite stores!" : "",
  );
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPassword, setRegisteredPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
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

    if (returnUrl) {
      router.replace(returnUrl);
      return;
    }

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
  }, [authenticated, profile?.role, sessionLoading, router]);

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
        body: JSON.stringify({ name, email, password, becomeSeller: false }),
      });

      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "Registration failed");
        return;
      }

      if (body.mustVerify) {
        setRegisteredEmail(email);
        setRegisteredPassword(password);
        setSuccess(true);
        return;
      }

      setSuccess(true);
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setCheckMessage("");
    try {
      // Check verification status by email
      const res = await fetch("/api/auth/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        // Email is verified, now login
        setCheckMessage("✓ Verified! Logging you in...");
        setVerified(true);

        // Auto-login
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registeredEmail,
            password: registeredPassword,
          }),
        });

        if (loginRes.ok) {
          setTimeout(() => {
            router.push("/");
          }, 1000);
        } else {
          setCheckMessage(
            "Verified but login failed. Please sign in manually.",
          );
        }
      } else {
        setCheckMessage("⚠ Still not verified. Please check your email.");
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setCheckMessage("Failed to check status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (res.ok) {
        setResendMessage("✓ Verification email sent!");
        setTimeout(() => setResendMessage(""), 3000);
      } else {
        setResendMessage("Failed to send email. Please try again.");
      }
    } catch (error) {
      setResendMessage("Failed to send email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        `${origin}/auth/register`,
      );
    } catch (error) {
      console.error("Google signup error:", error);
      setMessage("Failed to initiate Google signup");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
        <BackToHome />
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10 text-center">
          <div className="mb-6 flex justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full shadow-sm border ${
                verified
                  ? "bg-green-50 border-green-100"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <i
                className={`text-4xl ${
                  verified
                    ? "fa-solid fa-circle-check text-green-500"
                    : "fa-solid fa-envelope text-blue-500"
                }`}
              ></i>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
            {verified ? "Email Verified!" : "Check Your Email"}
          </h1>
          <p className="text-slate-600 mb-4 max-w-md mx-auto">
            {verified
              ? "Your email has been verified successfully. Redirecting you to the home page..."
              : `We've sent a verification email to:`}
          </p>
          {!verified && (
            <>
              <p className="text-lg font-semibold text-slate-900 mb-6">
                {registeredEmail}
              </p>
              <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
                Click the verification link in the email to activate your
                account.
              </p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={handleCheckVerification}
                  disabled={checking || verified}
                  className="w-full rounded-xl bg-green-600 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checking
                    ? "Checking..."
                    : verified
                      ? "✓ Verified!"
                      : "Check Verification Status"}
                </button>
                {checkMessage && (
                  <p
                    className={`text-sm ${
                      checkMessage.startsWith("✓")
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {checkMessage}
                  </p>
                )}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </button>
                {resendMessage && (
                  <p
                    className={`text-sm ${
                      resendMessage.startsWith("✓")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {resendMessage}
                  </p>
                )}
              </div>
            </>
          )}
          {verified && (
            <div className="mt-6 flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
          )}
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
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-700"></span>
              Create Account
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
              Join Us Today
            </h1>
            <p className="text-sm text-slate-600">
              Create your account to start shopping for car parts.
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
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20">
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
                  placeholder="Your full name"
                />
              </div>
            </label>

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

            <label className="block text-sm font-semibold text-slate-700">
              Confirm Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-600/20">
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
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
            onClick={handleGoogleSignup}
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
            Sign up with Google
          </button>

          <div className="text-sm text-slate-600">
            Already have an account?{" "}
            <a
              className="font-semibold text-green-700 hover:underline"
              href="/auth/login"
            >
              Sign in
            </a>
          </div>

          <div className="text-sm text-slate-600">
            Want to sell?{" "}
            <a
              className="font-semibold text-blue-700 hover:underline"
              href="/auth/seller/register"
            >
              Apply as seller
            </a>
          </div>
        </div>

        <div className="relative hidden md:flex w-full h-full min-h-[600px] flex-col items-center justify-center bg-green-300 p-12">
          <div className="relative w-full flex-1 flex items-center justify-center">
            <img
              src="/register.png"
              alt="Register visual"
              className="max-h-[80%] max-w-full object-contain drop-shadow-lg"
            />
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-green-900">Join Us Today</h2>
            <p className="mt-3 text-green-700 max-w-xs mx-auto">
              Create an account to start shopping and tracking your orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
