"use client";

import Link from "next/link";

export default function BackToHome() {
  return (
    <div className="fixed left-6 top-6 z-50">
      <Link
        href="/"
        className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-95"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white transition-transform group-hover:-translate-x-0.5">
          <i className="fa-solid fa-arrow-left text-[10px]" />
        </div>
        <span>Back to Home</span>
      </Link>
    </div>
  );
}

