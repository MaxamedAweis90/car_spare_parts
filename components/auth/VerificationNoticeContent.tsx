"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";

interface VerificationNoticeContentProps {
  email: string | null;
}

export default function VerificationNoticeContent({
  email,
}: VerificationNoticeContentProps) {
  const router = useRouter();
  const { authenticated, profile, account, loading } = useSession(); // Destructure loading

  console.log(
    "[VerificationNoticeContent] Render. Loading:",
    loading,
    "Auth:",
    authenticated,
    "EmailVerified:",
    account?.emailVerification
  );
  // Ensure strict check of authenticated state before auto-sending

  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasSentRef = useRef(false);

  useEffect(() => {
    if (loading) return; // Wait for session load

    // Only redirect if explicitly verified or if user is active AND verified
    if (authenticated && account?.emailVerification === true) {
      console.log(
        "[VerificationNoticeContent] User is verified. Redirecting..."
      );
      router.replace("/");
    }
  }, [loading, authenticated, account?.emailVerification, router]);

  useEffect(() => {
    if (loading) return; // Wait for session load

    // Auto-send logic: We need either 'email' prop OR 'profile.email' from session
    const targetEmail = email || profile?.email;

    if (targetEmail && !hasSentRef.current && !account?.emailVerification) {
      console.log(
        "[VerificationNoticeContent] Auto-triggering email resend for:",
        targetEmail
      );
      hasSentRef.current = true;
      // We pass targetEmail to handleResend or update the logic to accept it
      // For now, let's call handleResend but we need to ensure handleResend uses targetEmail
      if (email === targetEmail) {
        handleResend().catch(console.error);
      } else {
        // If email prop is missing but profile has it, we might need to handle that
        // But handleResend relies on 'email' prop currently.
        // Let's rely on the prop for now, or update handleResend.
        if (email) handleResend().catch(console.error);
      }
    }
  }, [email, profile?.email, account?.emailVerification, loading]);

  const handleResend = async () => {
    if (!email) {
      setError("Email not found. Please try logging in again.");
      return;
    }

    setResending(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Failed to resend verification email.");
      } else {
        setMessage(
          "Verification email has been resent. Please check your inbox."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setResending(false);
    }
  };

  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setMessage("");
    setError("");

    try {
      // 1. Check status by email using our new specific endpoint
      const res = await fetch("/api/auth/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      // 2. If active, redirect to Login
      if (res.ok && data.status === "active") {
        router.push(
          `/auth/login?verified=true&email=${encodeURIComponent(email || "")}`
        );
      } else {
        // 3. Otherwise, show specific alert
        setError(
          "Not activated yet. Please check your email or try resending."
        );
      }
    } catch {
      setError("Unable to check status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <i className="fa-solid fa-circle-notch animate-spin text-4xl text-blue-500 mb-4"></i>
        <p className="text-slate-500 font-medium">
          Checking verification status...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(3deg);
          }
          50% {
            transform: translateY(-10px) rotate(-1deg);
          }
        }
        @keyframes scan {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      {/* Hero Icon Section */}
      <div className="relative mb-10 group mt-4">
        <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl animate-pulse group-hover:blur-3xl transition-all duration-700"></div>
        <div
          className="relative h-24 w-24 bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#1e40af] text-white rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(29,78,216,0.3)]"
          style={{ animation: "float 4s ease-in-out infinite" }}
        >
          <i className="fa-solid fa-paper-plane text-4xl mb-1 ml-1 drop-shadow-lg"></i>
          <div className="absolute inset-0 rounded-[2rem] border-2 border-white/20 overflow-hidden">
            <div className="absolute w-full h-1 bg-white/30 animate-[scan_3s_linear_infinite]"></div>
          </div>
        </div>
      </div>

      <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
        Verify Your Account
      </h1>

      <p className="text-slate-600 mb-10 leading-relaxed max-w-[340px]">
        We&apos;ve sent a secure activation link to your inbox.
        <span className="block mt-4 font-bold text-[#1d4ed8] bg-blue-50 py-2 px-4 rounded-xl border border-blue-100/50 inline-block shadow-sm">
          {email || "your email"}
        </span>
      </p>

      {message && (
        <div className="w-full mb-8 rounded-2xl border border-green-200 bg-green-50/80 p-5 text-sm font-semibold text-green-800 flex items-center gap-4 animate-in fade-in fill-mode-both duration-500 slide-in-from-bottom-2">
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <i className="fa-solid fa-circle-check text-green-600 text-lg"></i>
          </div>
          <span className="text-left">{message}</span>
        </div>
      )}

      {error && (
        <div className="w-full mb-8 rounded-2xl border border-red-200 bg-red-50/80 p-5 text-sm font-semibold text-red-800 flex items-center gap-4 animate-in fade-in fill-mode-both duration-500 slide-in-from-bottom-2">
          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <i className="fa-solid fa-triangle-exclamation text-red-600 text-lg"></i>
          </div>
          <span className="text-left">{error}</span>
        </div>
      )}

      <div className="w-full space-y-4">
        <button
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="w-full group relative overflow-hidden rounded-2xl bg-[#1d4ed8] px-6 py-4 text-sm font-black text-white shadow-[0_15px_30px_-5px_rgba(29,78,216,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_-5px_rgba(29,78,216,0.5)] active:scale-[0.98] focus:ring-4 focus:ring-blue-100 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {isChecking ? "Checking..." : "Check My Status"}
            {isChecking && (
              <i className="fa-solid fa-circle-notch animate-spin text-xs"></i>
            )}
            {!isChecking && (
              <i className="fa-solid fa-circle-notch animate-spin text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
        </button>

        <button
          onClick={handleResend}
          disabled={resending || !email}
          className="w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-200 hover:shadow-md disabled:opacity-50"
        >
          {resending ? (
            <div className="h-5 w-5 border-3 border-slate-300 border-t-[#1d4ed8] rounded-full animate-spin"></div>
          ) : (
            <i className="fa-solid fa-rotate-right text-base text-[#1d4ed8]"></i>
          )}
          Resend Activation Email
        </button>

        <div className="pt-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 text-slate-200 w-full px-4">
            <div className="h-px flex-1 bg-current"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Still Stuck?
            </span>
            <div className="h-px flex-1 bg-current"></div>
          </div>

          <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
            Usually it takes a few minutes. Check your junk folder or try
            another email.
          </p>

          <Link
            href="/auth/login"
            className="group inline-flex items-center gap-3 text-sm font-black text-[#1d4ed8] hover:text-[#153ea8] transition-all"
          >
            <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
              <i className="fa-solid fa-arrow-left text-xs transition-transform group-hover:-translate-x-1"></i>
            </div>
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  );
}

