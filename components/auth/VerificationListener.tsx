"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

function VerificationListenerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId || !token || status !== "idle") return;

    const verify = async () => {
      setIsVerifying(true);
      setMessage("Verifying your identity...");

      try {
        const res = await fetch("/api/auth/verify-custom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Verification failed");
        }

        setStatus("success");
        setMessage("Verification Successful!");

        // Brief delay to show success
        await new Promise((r) => setTimeout(r, 1500));

        // Clean URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete("userId");
        params.delete("token");
        const newPath = `${pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        // Reload to refresh session/permissions
        window.location.href = newPath;
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to verify.");
        setIsVerifying(false); // Do not block UI forever on error
      }
    };

    verify();
  }, [userId, token, status, pathname, router, searchParams]);

  if (!isVerifying && status === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full text-center">
        {status === "idle" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Verifying...
            </h3>
            <p className="text-gray-500 text-sm">
              Please wait while we check your credentials.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-4 text-green-500 text-5xl">
              <i className="fa-solid fa-check-circle"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Verified!</h3>
            <p className="text-gray-500 text-sm">Reloading your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center mb-4 text-red-500 text-5xl">
              <i className="fa-solid fa-times-circle"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Verification Failed
            </h3>
            <p className="text-gray-500 text-sm mb-4">{message}</p>
            <button
              onClick={() => {
                setIsVerifying(false);
                setStatus("idle");
              }}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerificationListener() {
  return (
    <Suspense fallback={null}>
      <VerificationListenerContent />
    </Suspense>
  );
}
