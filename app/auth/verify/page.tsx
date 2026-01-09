"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Client, Account } from "appwrite";
import BackToHome from "@/components/BackToHome";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!userId || !secret) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
        const account = new Account(client);

        await account.updateVerification(userId, secret);

        // Sync with our backend
        const res = await fetch("/api/auth/verify-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (res.ok) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
          setTimeout(() => router.push("/auth/login"), 3000);
        } else {
          const data = await res.json();
          throw new Error(data.error || "Sync failed");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to verify email.");
      }
    };

    verify();
  }, [userId, secret, router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-8 sm:p-12 text-center">
        <div className="mb-8 flex justify-center">
          {status === "verifying" && (
            <div className="h-20 w-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === "success" && (
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-4xl">
              <i className="fa-solid fa-check"></i>
            </div>
          )}
          {status === "error" && (
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-4xl">
              <i className="fa-solid fa-xmark"></i>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
          {status === "verifying" && "Verifying Email"}
          {status === "success" && "Success!"}
          {status === "error" && "Verification Failed"}
        </h1>

        <p className="text-slate-600 mb-8 leading-relaxed">{message}</p>

        {status === "error" && (
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-slate-800"
          >
            Back to Login
          </button>
        )}

        {status === "success" && (
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-green-700"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}
