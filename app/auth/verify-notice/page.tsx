"use client";

import { useSearchParams } from "next/navigation";
import BackToHome from "@/components/ui/BackToHome";
import { Suspense, useState } from "react";

function VerifyNoticeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email address";
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendMessage("✓ Email sent!");
        setTimeout(() => setResendMessage(""), 5000);
      } else {
        const body = await res.json();
        setResendMessage(body.error || "Failed to send");
      }
    } catch {
      setResendMessage("Failed to send");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 shadow-sm border border-blue-100 animate-pulse">
            <i className="fa-regular fa-envelope text-4xl text-blue-500"></i>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          Check Your Email
        </h1>
        <p className="text-slate-600 mb-6">
          We've sent a verification link to: <br />
          <strong className="text-slate-900 text-lg">{email}</strong>
        </p>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
          Please click the link in the email to verify your account and access
          the portal.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-70"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>

          {resendMessage && (
            <p
              className={`text-sm font-medium ${resendMessage.includes("Failed") ? "text-red-600" : "text-green-600"}`}
            >
              {resendMessage}
            </p>
          )}

          <a
            href="/auth/seller/login"
            className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VerifyNoticePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyNoticeContent />
    </Suspense>
  );
}
