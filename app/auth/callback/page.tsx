"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { accountClient } from "@/lib/appwrite";

export default function OAuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    const syncProfile = async () => {
      try {
        // Get a user JWT from Appwrite (uses the OAuth session cookie on Appwrite domain).
        const jwt = await accountClient.createJWT();

        const res = await fetch("/api/auth/oauth/sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwt.jwt}`,
          },
          credentials: "include",
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          if (body?.mustVerify) {
            router.replace(
              `/auth/verify-notice?email=${encodeURIComponent(
                body.email || ""
              )}`
            );
            return;
          }
          throw new Error(body?.error || "Sync failed");
        }

        const role = body?.user?.role;
        const approved = body?.user?.sellerApproved;

        // Role-aware redirects post-OAuth.
        if (role === "seller") {
          if (approved === false) {
            setMessage("Signed in. Pending admin approval...");
            router.replace("/auth/seller/pending");
          } else {
            setMessage("Signed in as seller. Redirecting...");
            router.replace("/seller");
          }
          return;
        }

        if (role === "admin" || role === "main_admin") {
          setMessage("Signed in as admin. Redirecting...");
          router.replace("/admin");
          return;
        }

        // Default: customer
        setMessage("Signed in. Redirecting...");
        router.replace("/");
      } catch (error: any) {
        console.error(error);
        setMessage(error?.message || "OAuth sign-in failed");
      }
    };

    syncProfile();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-gray-50 to-slate-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[40vh] w-[40vh] rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute -right-[10%] bottom-[20%] h-[40vh] w-[40vh] rounded-full bg-indigo-100/50 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-[2rem] border border-white/60 bg-white/60 p-10 pt-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center">
          {/* Status Icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 duration-1000"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] shadow-lg shadow-blue-500/30">
              <i className="fa-solid fa-cloud-arrow-down text-2xl text-white animate-bounce"></i>
            </div>
          </div>

          <h1 className="mb-3 text-xl font-bold text-slate-900 tracking-tight">
            Finalizing Sign In
          </h1>

          <p className="mb-8 text-sm font-medium text-slate-500 leading-relaxed px-4">
            {message}
          </p>

          <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full origin-left animate-[loading_1.5s_infinite] bg-[#1d4ed8] rounded-full"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
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
    </div>
  );
}
