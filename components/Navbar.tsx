"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import Button from "./Button";
import NavLinks from "./NavLinks";
import { CartDrawer } from "./CartDrawer";

const LANG_KEY = "spareparts-lang";
const LANG_OPTIONS = ["EN", "AR", "SO"] as const;
const LANG_META: Record<(typeof LANG_OPTIONS)[number], { label: string; flag: string }> = {
  EN: { label: "EN", flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1fa-1f1f8.png" },
  AR: { label: "AR", flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1f8-1f1e6.png" },
  SO: { label: "SO", flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1f8-1f1f4.png" },
};

export default function Navbar() {
  const router = useRouter();
  const { authenticated, profile, loading } = useSession();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<(typeof LANG_OPTIONS)[number]>("EN");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartItems = useMemo(
    () => [
      { id: "1", name: "Brake Rotor Kit", price: 300, quantity: 1, imageUrl: "/heroimages/brakes.png" },
      { id: "2", name: "Performance Oil", price: 46, quantity: 2, imageUrl: "/heroimages/car.png" },
      { id: "3", name: "Ceramic Brake Pads", price: 65, quantity: 1, imageUrl: "/heroimages/brakes.png" },
    ],
    []
  );
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
    if (saved && LANG_OPTIONS.includes(saved as (typeof LANG_OPTIONS)[number])) {
      setLanguage(saved as (typeof LANG_OPTIONS)[number]);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_KEY, language);
    }
  }, [language]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    setMenuOpen(false);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const userName = authenticated ? profile?.name || "Account" : "Guest";
  const isSellerPending = profile?.role === "seller" && profile?.sellerApproved === false;

  return (
    <>
    <header className="sticky top-0 z-30 shadow-sm">
      {/* Main Header - Yellow */}
      <div className="bg-(--color-primary) py-2">
        <nav className="mx-auto flex w-full max-w-10/12 items-center gap-4 px-4 sm:px-6">
          {/* Left: Logo */}
          <div className="shrink-0 flex items-center">
            <Link href="/" className="block">
              <img 
                src="/spartpartslogo-01.png" 
                alt="Spare Parts Logo" 
                className="h-25 w-auto object-contain" 
              />
            </Link>
          </div>

          {/* Center: Search */}
          <div className="ml-8 flex min-w-0 flex-1 items-center">
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-2xl items-center rounded-full bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black"
            >
              <div className="pl-4 text-slate-400">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products, brands..."
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
              <div className="m-1">
                <Button
                  type="submit"
                  variant="secondary"
                  rounded="full"
                  size="sm"
                  className="px-6 py-2 text-sm font-bold"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Right: Lang + Cart + Avatar */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setLangOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 bg-transparent px-2 py-1 text-sm font-semibold text-slate-900 transition hover:opacity-70"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
              >
                <img 
                  src={LANG_META[language].flag} 
                  alt={LANG_META[language].label} 
                  className="h-5 w-5 object-contain" 
                />
                <span className="font-bold tracking-wide">{LANG_META[language].label}</span>
                <span className="hidden text-xs font-semibold text-slate-700 lg:inline">Language</span>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-900" aria-hidden />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {LANG_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLanguage(option);
                        setLangOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      role="option"
                      aria-selected={language === option}
                    >
                      <img 
                        src={LANG_META[option].flag} 
                        alt={LANG_META[option].label} 
                        className="h-5 w-5 object-contain" 
                      />
                      <span className="font-semibold tracking-wide">{LANG_META[option].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Cart + Avatar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="group relative flex items-center gap-2 text-slate-900"
                aria-label="Cart"
              >
                <div className="relative">
                  <i className="fa-solid fa-cart-shopping text-2xl transition group-hover:opacity-70" aria-hidden />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900 shadow-sm">
                    {cartCount}
                  </span>
                </div>
                <span className="hidden text-sm font-bold sm:block">Cart</span>
                <span className="hidden text-sm font-bold sm:block">£{cartTotal.toFixed(2)}</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-slate-900 transition hover:opacity-70"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <i className="fa-regular fa-user text-2xl" aria-hidden />
                  <span className="hidden text-sm font-semibold sm:inline">Sign in account</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                      {loading ? "Loading..." : userName}
                    </div>
                    <div className="py-1 text-sm text-slate-700">
                      {authenticated ? (
                        <>
                          <Link href="/account" className="block px-4 py-2 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                            My Account
                          </Link>
                          <Link href="/orders" className="block px-4 py-2 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                            Orders
                          </Link>
                          {isSellerPending && (
                            <Link href="/auth/seller/pending" className="block px-4 py-2 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                              Seller Pending
                            </Link>
                          )}
                          <Link href="/auth/login" className="block px-4 py-2 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                            Sign Out
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" className="block px-4 py-2 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                            Login
                          </Link>
                          <Link href="/auth/register" className="block px-4 py-2 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                            Register
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Nav - White */}
      <div className="border-b border-slate-200 bg-white">
        <NavLinks />
      </div>
    </header>
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onViewCart={() => router.push("/cart")} items={cartItems} />
    </>
  );
}
