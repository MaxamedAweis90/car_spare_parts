"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BackToHome from "@/components/BackToHome";
import VerificationNoticeContent from "@/components/auth/VerificationNoticeContent";

function VerificationNoticePageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return <VerificationNoticeContent email={email} />;
}

export default function VerificationNoticePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] bg-[#f7f9fc] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <Suspense fallback={<div>Loading...</div>}>
          <VerificationNoticePageContent />
        </Suspense>
      </div>
    </div>
  );
}
