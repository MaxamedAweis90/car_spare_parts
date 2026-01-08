"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { accountClient } from "@/lib/appwrite";
import BackToHome from "@/components/BackToHome";
import { Steps } from "antd";

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
            }, 1000);
          }, 1500);
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

  // Map stage to numeric step
  // 0: Verifying
  // 1: Success (Verification Complete)
  // 2: Entering (Redirecting)
  let currentStep = 0;
  if (stage === "success") currentStep = 1;
  if (stage === "entering") currentStep = 2;

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
    <div className="w-full max-w-md mx-auto py-6">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Account Verification
        </h2>
        <p className="text-slate-500 text-sm">
          Please wait while we secure your account
        </p>
      </div>

      <Steps
        data-tour="verification-steps"
        current={currentStep}
        direction="vertical"
        items={[
          {
            title: "Verifying Link",
            description: "Validating your security token...",
            icon: (
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === 0
                    ? "bg-blue-100 text-blue-600 animate-pulse"
                    : currentStep > 0
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {currentStep > 0 ? (
                  <i className="fa-solid fa-check text-sm" />
                ) : (
                  <i className="fa-solid fa-cloud-arrow-down text-sm" />
                )}
              </span>
            ),
          },
          {
            title: "Securing Account",
            description: "Activating profile and permissions...",
            icon: (
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === 1
                    ? "bg-blue-100 text-blue-600 animate-pulse"
                    : currentStep > 1
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {currentStep > 1 ? (
                  <i className="fa-solid fa-check text-sm" />
                ) : (
                  <i className="fa-solid fa-shield-halved text-sm" />
                )}
              </span>
            ),
          },
          {
            title: "Redirecting",
            description: "Taking you to your dashboard...",
            icon: (
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === 2
                    ? "bg-blue-100 text-blue-600 animate-pulse"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <i className="fa-solid fa-house text-sm" />
              </span>
            ),
          },
        ]}
      />

      <div className="mt-8 flex justify-center">
        {currentStep === 0 && (
          <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl opacity-50"></i>
        )}
        {currentStep === 1 && (
          <i className="fa-solid fa-circle-check text-green-500 text-2xl animate-bounce"></i>
        )}
        {currentStep === 2 && (
          <i className="fa-solid fa-arrow-right-to-bracket text-blue-600 text-2xl animate-pulse"></i>
        )}
      </div>
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
