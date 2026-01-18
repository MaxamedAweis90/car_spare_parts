"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Client, Account } from "appwrite";
import BackToHome from "@/components/ui/BackToHome";

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
  const token = searchParams.get("token"); // Custom token check

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying your email...");
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    if (!userId || (!secret && !token)) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      // CLEAR CACHE IMMEDIATELY
      if (typeof window !== "undefined") {
        localStorage.removeItem("spareparts-session");
        window.dispatchEvent(new Event("session-changed"));
      }

      const startTime = Date.now();
      const MIN_DELAY = 2200; // Increased to 2.2s for better UI feedback

      try {
        // Custom Token Flow
        if (token) {
          const res = await fetch("/api/auth/verify-custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, token }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Verification failed");
          }
        }
        // Standard Appwrite Flow (fallback)
        else if (secret) {
          const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
          const account = new Account(client);

          await account.updateVerification(userId!, secret);

          // Generic sync for standard flow
          await fetch("/api/auth/verify-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
        }

        // DELIBERATE DELAY for UI
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_DELAY) {
          await new Promise((resolve) =>
            setTimeout(resolve, MIN_DELAY - elapsed)
          );
        }

        setStatus("success");
        setMessage("Email verified successfully! You can now proceed.");

        // Fetch current session to determine role and set redirect path
        try {
          const meRes = await fetch("/api/auth/me", {
            credentials: "include",
            cache: "no-store",
            headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
          });

          if (meRes.ok) {
            const meData = await meRes.json();
            const role = meData?.profile?.role;

            // Final refresh trigger
            window.dispatchEvent(new Event("session-changed"));

            if (role === "seller") {
              setRedirectPath("/seller/profile?verified=true");
            } else if (role === "admin" || role === "main_admin") {
              setRedirectPath("/admin/settings?verified=true");
            } else if (role === "customer") {
              setRedirectPath("/account?verified=true");
            } else {
              setRedirectPath("/");
            }
          } else {
            // Fallback if me check fails (e.g. session expired or not set)
            setRedirectPath("/auth/login?verified=true");
          }
        } catch (err) {
          console.error("Failed to fetch user role", err);
          setRedirectPath("/auth/login");
        }
      } catch (error: any) {
        console.error("Verification error:", error);

        // Ensure minimum delay even for error
        const elapsed = Date.now() - startTime;
        if (elapsed < 500)
          await new Promise((r) => setTimeout(r, 500 - elapsed));

        setStatus("error");
        setMessage(error.message || "Failed to verify email.");
      }
    };

    // Robustness: Check if we are logged in as a DIFFERENT user than the verification link
    const checkMatchingSession = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const me = await res.json();
          if (me.authenticated && me.account?.$id !== userId) {
            console.warn(
              "🔐 Verification link is for a different user. Logging out first..."
            );
            await fetch("/api/auth/logout", { method: "POST" });
            localStorage.removeItem("spareparts-session");
            window.dispatchEvent(new Event("session-changed"));
          }
        }
      } catch (err) {
        console.warn("Failed session matching check", err);
      }
      verify();
    };

    checkMatchingSession();
  }, [userId, secret, token, router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_45%)] bg-[#f2f5fb] flex items-center justify-center px-4 py-10">
      <BackToHome />
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-8 sm:p-12 text-center">
        <div className="mb-8 flex justify-center">
          {status === "verifying" && (
            <div className="h-24 w-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === "success" && (
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-5xl shadow-inner">
              <i className="fa-solid fa-check"></i>
            </div>
          )}
          {status === "error" && (
            <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-5xl shadow-inner">
              <i className="fa-solid fa-xmark"></i>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 transition-all duration-300">
          {status === "verifying" && "Verifying Your Identity"}
          {status === "success" && "Verification Complete!"}
          {status === "error" && "Identity Check Failed"}
        </h1>

        <p className="text-slate-600 mb-8 leading-relaxed h-12 flex items-center justify-center font-medium">
          {message}
        </p>

        {status === "error" && (
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full rounded-xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
          >
            Return to Login
          </button>
        )}

        {status === "success" && (
          <button
            onClick={() => router.push(redirectPath)}
            className="w-full rounded-xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <span>Continue to Dashboard</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        )}
      </div>
    </div>
  );
}

