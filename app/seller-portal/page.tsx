import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

export default async function SellerPortalRedirectPage() {
  const session = await getServerSession();

  // If not authenticated, redirect to seller login
  if (!session.authenticated || !session.profile) {
    redirect("/auth/seller/login");
  }

  // Redirect based on user role
  const role = session.profile.role;

  if (role === "seller") {
    redirect("/seller/dashboard");
  } else if (role === "admin" || role === "main_admin") {
    redirect("/admin/admin");
  } else {
    // Customer role - not authorized, redirect to seller login
    redirect("/auth/seller/login");
  }
}
