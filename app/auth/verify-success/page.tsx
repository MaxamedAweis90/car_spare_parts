"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackToHome from "@/components/ui/BackToHome";

function VerifySuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_45%)] bg-[#f2fdf7] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50 shadow-sm border border-green-100 animate-bounce">
            <i className="fa-solid fa-circle-check text-5xl text-green-500"></i>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Email Verified!
        </h1>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Your email has been successfully verified. We're logging you in and
          redirecting you to the home page...
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
            <span className="text-lg font-semibold text-slate-700">
              Redirecting in {countdown}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f2fdf7] flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <VerifySuccessContent />
    </Suspense>
  );
}
