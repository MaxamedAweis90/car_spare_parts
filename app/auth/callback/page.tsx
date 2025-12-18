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
    <div className="max-w-md mx-auto mt-12 p-6 border rounded text-center">
      <p>{message}</p>
    </div>
  );
}
