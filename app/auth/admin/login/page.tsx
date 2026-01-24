import { Suspense } from "react";
import AdminLoginClient from "./AdminLoginClient";
import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const session = await getServerSession();

  // If already authenticated, redirect based on role
  if (session.authenticated && session.profile) {
    const role = session.profile.role;

    if (role === "admin" || role === "main_admin") {
      redirect("/admin/admin");
    } else if (role === "seller") {
      redirect("/seller");
    }
    // Allow customers to see login form (they might want to login as admin)
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginClient />
    </Suspense>
  );
}
