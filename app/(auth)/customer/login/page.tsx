import { redirect } from "next/navigation";

export default function CustomerLoginAlias() {
  redirect("/auth/login");
}
