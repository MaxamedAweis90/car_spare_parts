import { Suspense } from "react";
import SellerRegisterClient from "./SellerRegisterClient";

export default function SellerRegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellerRegisterClient />
    </Suspense>
  );
}
