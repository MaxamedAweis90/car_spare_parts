"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";

export default function AdminLoginPage() {
  const router = useRouter();
  const { authenticated, profile, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const shouldHide = loading || authenticated;

  useEffect(() => {
    if (loading) return;
    if (!authenticated) return;
    if (profile?.role === "admin" || profile?.role === "main_admin") {
      router.replace("/admin");
      return;
    }
    if (profile?.role === "seller") {
      if (profile?.sellerApproved === false) {
        router.replace("/auth/seller/pending");
      } else {
        router.replace("/seller");
      }
      return;
    }
    if (profile?.role === "customer") {
      router.replace("/");
    }
  }, [authenticated, profile?.role, profile?.sellerApproved, loading, router]);

  // Avoid flashing the page while resolving session or when redirecting.
  if (shouldHide) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        setMessage(body?.error || "Login failed");
        return;
      }

      const role = body?.user?.role;
      if (role === "main_admin" || role === "admin") {
        router.push("/admin");
        setMessage("Logged in as admin");
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
        setMessage("User not found for this portal.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded">
      <h1 className="text-2xl font-semibold mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span>Email</span>
          <input
            className="w-full p-2 border rounded mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span>Password</span>
          <input
            className="w-full p-2 border rounded mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
