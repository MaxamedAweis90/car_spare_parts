"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BackToHome from "@/components/ui/BackToHome";

export default function SellerPendingPage() {
  return (
    <Suspense fallback={null}>
      <SellerPendingContent />
    </Suspense>
  );
}

function SellerPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:grid md:grid-cols-[1.2fr_1fr]">
        <div className="px-8 py-10 sm:px-12 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
            <span className="h-2 w-2 rounded-full bg-[#1d4ed8]"></span>
            Seller Application
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Your application is pending
          </h1>
          <p className="text-sm text-slate-700">
            We are reviewing your details. You&apos;ll get an email once
            approval is complete.
          </p>
          {email && (
            <p className="text-sm font-semibold text-slate-800">
              Email: {email}
            </p>
          )}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-5 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <i className="fa-regular fa-clock text-white text-lg"></i>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2 text-base">
                  Account Status: Pending Approval
                </h3>
                <p className="text-blue-800 mb-1">
                  Your seller account has been created successfully and is
                  currently under review by our admin team.
                </p>
                <p className="text-blue-800 mb-3">
                  You will receive an email notification once your account is
                  approved and you can access the seller dashboard.
                </p>
                <div className="bg-white/60 rounded-lg px-4 py-3 mt-3">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
                    Need Assistance?
                  </p>
                  <p className="text-sm text-blue-800">
                    Check your email for contact information or reach out to our
                    admin team for updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#1d4ed8]">
            <a className="hover:underline" href="/auth/seller/login">
              Seller Login
            </a>
            <span className="text-slate-400">|</span>
            <a className="hover:underline" href="/">
              Home
            </a>
          </div>
        </div>

        <div className="relative hidden md:block bg-[#1f4fe0]">
          <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent" />
          <div className="relative flex h-full flex-col items-center justify-center gap-4 px-8 py-12 text-white">
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              Next steps
            </div>
            <h2 className="text-xl font-extrabold">
              We&apos;re validating your store.
            </h2>
            <p className="max-w-xs text-sm text-white/85 text-center">
              You&apos;ll be notified via email when your account is ready. You
              can then list products and start selling.
            </p>
            <div className="h-36 w-full max-w-xs rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <div className="h-24 w-36 rounded-xl bg-white/90 shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

