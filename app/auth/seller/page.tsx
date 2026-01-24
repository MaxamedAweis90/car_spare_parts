import { redirect } from "next/navigation";

export default function AuthSellerRedirectPage() {
  // Simple alias - redirect to seller login
  redirect("/auth/seller/login");
}
