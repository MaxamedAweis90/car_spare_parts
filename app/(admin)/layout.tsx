"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";

const allowedRoles = new Set(["main_admin", "admin"]);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, profile, loading } = useSession();
  const router = useRouter();
  const isAllowed = authenticated && allowedRoles.has(profile?.role);

  useEffect(() => {
    if (loading) return;
    if (!authenticated || !isAllowed) {
      router.replace("/auth/login");
    }
  }, [authenticated, isAllowed, loading, router]);

  if (loading) {
    return <div className="p-6">Checking access...</div>;
  }

  if (!isAllowed) {
    return <div className="p-6">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Admin Area</p>
          <p className="text-sm text-gray-600">Restricted to admins</p>
        </div>
        <a className="text-blue-600 text-sm" href="/">Back home</a>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
