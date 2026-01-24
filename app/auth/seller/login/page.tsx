import { Suspense } from "react";
import SellerLoginClient from "./SellerLoginClient";
import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

export default async function SellerLoginPage() {
  const session = await getServerSession();

  // If already authenticated, redirect based on role
  if (session.authenticated && session.profile) {
    const role = session.profile.role;

    if (role === "seller") {
      redirect("/seller/dashboard");
    } else if (role === "admin" || role === "main_admin") {
      redirect("/admin/admin");
    }
    // Allow customers to see login form (they might want to login as seller)
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellerLoginClient />
    </Suspense>
  );
}
