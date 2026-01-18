"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VerificationNoticeContent from "@/components/auth/VerificationNoticeContent";
import BackToHome from "@/components/ui/BackToHome";

export default function VerificationNoticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <i className="fa-solid fa-circle-notch animate-spin text-4xl text-blue-500"></i>
        </div>
      }
    >
      <VerificationNoticeShell />
    </Suspense>
  );
}

function VerificationNoticeShell() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-8 sm:p-12">
        <VerificationNoticeContent email={email} />
      </div>
    </div>
  );
}

