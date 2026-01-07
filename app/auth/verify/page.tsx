"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { accountClient } from "@/lib/appwrite";
import BackToHome from "@/components/BackToHome";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [stage, setStage] = useState<"verifying" | "success" | "entering">(
    "verifying"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId && secret) {
      accountClient
        .updateVerification(userId, secret)
        .then(async () => {
          // Sync with database
          try {
            await fetch("/api/auth/verify-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
          } catch (syncErr) {
            console.error(
              "Failed to sync verification status to database",
              syncErr
            );
          }

          setStage("success");

          // Wait for success checkmark animation
          setTimeout(async () => {
            setStage("entering");

            // Check if we have an active session (e.g. from auto-login on same device)
            let hasSession = false;
            try {
              await accountClient.get();
              hasSession = true;
            } catch (ignored) {
              // No session
            }

            // Final redirect after entering state
            setTimeout(() => {
              if (hasSession) {
                // If logged in, go home
                window.location.href = "/";
              } else {
                // If not logged in (different device), go to login
                const emailParam =
                  new URLSearchParams(window.location.search).get("email") ||
                  "";
                router.push(
                  `/auth/login?verified=true&email=${encodeURIComponent(
                    emailParam
                  )}`
                );
              }
            }, 1500);
          }, 2000);
        })
        .catch((err) => {
          console.error(err);
          setError("Verification failed. The link may be expired or invalid.");
          setStage("verifying"); // Stop spinner
        });
    } else {
      setError("Missing verification parameters.");
    }
  }, [userId, secret, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center text-center animate-in fade-in duration-700">
        <div className="h-24 w-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_20px_40px_rgba(239,68,68,0.1)] rotate-3">
          <i className="fa-solid fa-circle-xmark text-4xl"></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">
          Verification Failed
        </h2>
        <p className="text-slate-500 mb-10 max-w-[300px] leading-relaxed font-medium">
          {error}
        </p>
        <Link
          href="/auth/login"
          className="w-full rounded-2xl bg-slate-900 px-8 py-5 text-sm font-black text-white shadow-2xl transition hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
        >
          Back to Security Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center px-4 relative overflow-hidden">
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.33);
            opacity: 0;
          }
          40%,
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        @keyframes draw-check {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

      {stage === "verifying" && (
        <div className="animate-in fade-in duration-500">
          <div className="relative h-32 w-32 mb-10 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-50/50"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#1d4ed8] animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-blue-50 flex items-center justify-center">
              <i className="fa-solid fa-user-shield text-[#1d4ed8] text-3xl animate-pulse"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">
            Authenticating Link
          </h2>
          <p className="text-slate-500 font-bold tracking-tight uppercase text-xs opacity-60">
            Validating security credentials...
          </p>
        </div>
      )}

      {stage === "success" && (
        <div className="animate-in zoom-in-95 duration-700">
          <div className="relative h-32 w-32 mb-10 mx-auto">
            <div className="absolute inset-0 bg-green-400 rounded-full opacity-10 animate-[pulse-ring_2s_infinite]"></div>
            <div className="relative h-32 w-32 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(34,197,94,0.15)]">
              <svg
                className="w-16 h-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 50,
                    strokeDashoffset: 50,
                    animation: "draw-check 0.6s ease-out forwards",
                  }}
                />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter">
            Success!
          </h2>
          <p className="text-slate-600 font-semibold leading-relaxed max-w-[280px]">
            Your profile has been secured and activated successfully.
          </p>
        </div>
      )}

      {stage === "entering" && (
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 mb-10 relative">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-2xl rotate-45"></div>
            <div className="absolute inset-0 border-4 border-t-[#1d4ed8] rounded-2xl rotate-45 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-house-chimney text-[#1d4ed8] text-xl"></i>
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter animate-[slide-up_0.5s_ease-out]">
            Welcome Home
          </h2>

          <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1d4ed8] via-[#4f46e5] to-[#1d4ed8] w-full -translate-x-full animate-[loading_1.5s_infinite_ease-in-out]"></div>
          </div>

          <p className="mt-6 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Initializing your dashboard
            <span className="flex gap-1.5">
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] bg-[#f7f9fc] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
