import { Suspense } from "react";
import AdminLoginClient from "./AdminLoginClient";
import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminLoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const reason = searchParams?.reason;
  const session = await getServerSession();

  // If already authenticated, redirect based on role
  // BUT ONLY IF not redirected here due to error/reason
  if (!reason && session.authenticated && session.profile) {
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
