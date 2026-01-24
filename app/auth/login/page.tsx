import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getServerSession();

  // If already authenticated, redirect based on role
  if (session.authenticated && session.profile) {
    const role = session.profile.role;

    if (role === "admin" || role === "main_admin") {
      redirect("/admin/admin");
    } else if (role === "seller") {
      redirect("/seller");
    } else {
      // Customer role - redirect to home
      redirect("/");
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
