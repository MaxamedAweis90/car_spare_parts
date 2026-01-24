import { redirect } from "next/navigation";

export default function AuthAdminRedirectPage() {
  // Simple alias - redirect to admin login
  redirect("/auth/admin/login");
}
