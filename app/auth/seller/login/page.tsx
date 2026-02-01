import { Suspense } from "react";
import SellerLoginClient from "./SellerLoginClient";
import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SellerLoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const reason = searchParams?.reason;

  const session = await getServerSession();

  // If already authenticated, redirect based on role
  // BUT ONLY IF not redirected here due to error/reason
  if (!reason && session.authenticated && session.profile) {
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
