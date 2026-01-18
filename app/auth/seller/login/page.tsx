import { Suspense } from "react";
import SellerLoginClient from "./SellerLoginClient";

export default function SellerLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellerLoginClient />
    </Suspense>
  );
}

