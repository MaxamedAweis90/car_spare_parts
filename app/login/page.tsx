import { getServerSession } from "@/lib/auth/get-server-session";
import { redirect } from "next/navigation";

export default async function LoginRedirectPage() {
  const session = await getServerSession();

  // If not authenticated, redirect to customer login
  if (!session.authenticated || !session.profile) {
    redirect("/auth/login");
  }

  // Redirect based on user role
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
