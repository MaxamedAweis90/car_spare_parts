import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

export default async function AdminPortalRedirectPage() {
  const session = await getServerSession();

  // If not authenticated, redirect to admin login
  if (!session.authenticated || !session.profile) {
    redirect("/auth/admin/login");
  }

  // Redirect based on user role
  const role = session.profile.role;

  if (role === "admin" || role === "main_admin") {
    redirect("/admin/admin");
  } else if (role === "seller") {
    redirect("/seller/dashboard");
  } else {
    // Customer role - not authorized, redirect to admin login
    redirect("/auth/admin/login");
  }
}
