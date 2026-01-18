import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";
import AdminLayoutShell from "./AdminLayoutShell";
import VerificationListener from "@/components/auth/VerificationListener";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // 1. Unauthenticated -> Login with reason
  if (!session.authenticated || !session.profile) {
    redirect("/auth/admin/login?reason=unauthenticated");
  }

  // 2. Email Unverified -> ALLOW ACCESS (but pass flag to shell)
  // Logic: Portal Access is determined by 'authenticated' + 'role' + 'profile.status' (implicit in having a profile)
  // Action Permission is determined by 'emailVerification'.

  // 3. Unauthorized Role -> Login or Home
  const allowedRoles = ["admin", "main_admin"];
  if (!allowedRoles.includes(session.profile.role)) {
    if (session.profile.role === "seller") {
      redirect("/auth/seller/login");
    } else if (session.profile.role === "customer") {
      redirect("/");
    } else {
      redirect("/auth/admin/login");
    }
  }

  // 5. Authorized -> Render Client Shell
  return (
    <AdminLayoutShell emailVerified={session.account.emailVerification}>
      <VerificationListener />
      {children}
    </AdminLayoutShell>
  );
}

