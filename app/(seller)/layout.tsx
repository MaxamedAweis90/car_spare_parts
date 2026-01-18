import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";
import SellerLayoutShell from "./SellerLayoutShell";
import VerificationListener from "@/components/auth/VerificationListener";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // 1. Unauthenticated -> Login
  if (!session.authenticated || !session.profile) {
    redirect("/auth/seller/login?reason=unauthenticated");
  }

  // 2. Email Unverified -> ALLOW ACCESS (pass prop to shell)
  // Logic: Portal Access is determined by account existence & role
  // Action Permission is determined by 'emailVerification' (handled in UI)

  // 3. Unauthorized Role -> Login or Home
  // Assuming 'seller' role is required.
  const allowedRoles = ["seller"];
  if (!allowedRoles.includes(session.profile.role)) {
    if (
      session.profile.role === "admin" ||
      session.profile.role === "main_admin"
    ) {
      redirect("/auth/admin/login");
    } else {
      redirect("/"); // Customer or unknown
    }
  }

  // 4. Pending Approval Logic
  // Check if seller is approved
  if (session.profile.sellerApproved === false) {
    redirect("/auth/seller/pending");
  }

  // 5. Authorized -> Render Client Shell
  return (
    <SellerLayoutShell emailVerified={session.account.emailVerification}>
      <VerificationListener />
      {children}
    </SellerLayoutShell>
  );
}

