"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "./Button";

export default function NavLinks() {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Top Deals", href: "/deals" },
    { label: "Customer Service", href: "/support" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-10/12 items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-sm px-4 py-1 text-sm font-bold transition-all duration-200 ${
                isActive
                  ? "bg-(--color-accent) text-slate-900 shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-(--color-primary-strong)"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <Button
        href="/auth/seller/register"
        variant="secondary"
        size="sm"
        className="hidden shrink-0 transition-all duration-300 hover:bg-(--color-primary) hover:text-slate-900 hover:shadow-md sm:inline-flex"
      >
        Become a Seller
      </Button>
    </div>
  );
}
