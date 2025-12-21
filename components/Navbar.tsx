"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { performLogout } from "@/lib/logout";
import Button from "./Button";
import NavLinks from "./NavLinks";
import { CartDrawer } from "./CartDrawer";
import { ClickAwaySurface } from "./ClickAwaySurface";
import { useCart } from "@/lib/cart";

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
  const { count: cartCount, total: cartTotal, openCart, closeCart, isOpen: cartOpen } = useCart();
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<(typeof LANG_OPTIONS)[number]>("EN");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && LANG_OPTIONS.includes(saved as (typeof LANG_OPTIONS)[number])) {
        setLanguage(saved as (typeof LANG_OPTIONS)[number]);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LANG_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  useEffect(() => {
    if (!menuOpen) return;
    if (typeof document === "undefined") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const panelEl = menuPanelRef.current;
      const buttonEl = menuButtonRef.current;
      if (!panelEl && !buttonEl) return;

      const path = (e as PointerEvent & { composedPath?: () => EventTarget[] }).composedPath?.();
      if (path) {
        if (panelEl && path.includes(panelEl)) return;
        if (buttonEl && path.includes(buttonEl)) return;
        setMenuOpen(false);
        return;
      }

      const target = e.target;
      if (!(target instanceof Node)) return;
      if (panelEl && panelEl.contains(target)) return;
      if (buttonEl && buttonEl.contains(target)) return;
      setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    // Capture phase = robust even if some child stops propagation.
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [menuOpen]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    setMobileSearchOpen(false);
    setMenuOpen(false);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  // Public site rule:
  // - Only customers should appear "logged in" on home/public pages.
  // - Sellers/Admins may browse home, but should not show logged-in UI there.
  const showAsAuthenticated = authenticated && profile?.role === "customer";
  const userName = showAsAuthenticated ? profile?.name || "Account" : "Guest";
  const isSellerPending = false;
  const avatarUrl: string | null = showAsAuthenticated ? profile?.avatarUrl || null : null;
  const initials = (() => {
    const name: string = profile?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const two = parts.slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
    return two || "A";
  })();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await performLogout();
    if (typeof window !== "undefined") {
      window.location.assign("/");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  const renderMenuDropdown = (panelClassName: string) =>
    menuOpen ? (
      <div ref={menuPanelRef} className={panelClassName} role="menu">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white ring-1 ring-black/10">
            {showAsAuthenticated && avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : showAsAuthenticated ? (
              <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-slate-700">
                {initials}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-700">
                <i className="fa-regular fa-user" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-slate-900">{loading ? "Loading..." : userName}</div>
            {showAsAuthenticated && profile?.email && (
              <div className="truncate text-xs font-semibold text-slate-600">{profile.email}</div>
            )}
          </div>
          </div>

        <div className="py-1 text-sm font-semibold text-slate-700">
          {showAsAuthenticated ? (
            <>
              <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                <i className="fa-regular fa-id-card text-sm text-slate-600" aria-hidden />
                <span>My Account</span>
              </Link>

              <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                <i className="fa-solid fa-box text-sm text-slate-600" aria-hidden />
                <span>Orders</span>
              </Link>

              {isSellerPending && (
                <Link href="/auth/seller/pending" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                  <i className="fa-solid fa-clock-rotate-left text-sm text-slate-600" aria-hidden />
                  <span>Seller Pending</span>
                </Link>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-red-700 hover:bg-red-50"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-sm" aria-hidden />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                <i className="fa-solid fa-right-to-bracket text-sm text-slate-600" aria-hidden />
                <span>Login</span>
              </Link>

              <Link href="/auth/register" className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                <i className="fa-solid fa-user-plus text-sm text-slate-600" aria-hidden />
                <span>Register</span>
              </Link>
            
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
    <header className="sticky top-0 z-30 shadow-sm">
      {/* Main Header - Yellow */}
      <div className="bg-(--color-primary) py-2">
        <nav className="mx-auto flex w-full max-w-full sm:max-w-10/12 items-center gap-4 px-4 sm:px-6">
          {/* Mobile: Cart + Search (left), Logo (right) */}
          <div className="flex w-full items-center justify-between sm:hidden">
            <Link href="/" className="block">
              <img src="/spartpartslogo-01.png" alt="Spare Parts Logo" className="h-12 w-auto object-contain" />
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setMobileSearchOpen(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 ring-1 ring-black/10"
                aria-label="Search"
              >
                <i className="fa-solid fa-magnifying-glass text-lg" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openCart();
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 ring-1 ring-black/10"
                aria-label="Cart"
              >
                <i className="fa-solid fa-cart-shopping text-lg" aria-hidden />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900 shadow-sm">
                  {cartCount}
                </span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  ref={menuButtonRef}
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setMenuOpen((prev) => !prev);
                  }}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/90 text-slate-900 ring-1 ring-black/10"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={showAsAuthenticated ? "Account menu" : "Sign in"}
                >
                  {showAsAuthenticated ? (
                    avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-extrabold text-slate-700">{initials}</span>
                    )
                  ) : (
                    <i className="fa-regular fa-user text-lg" aria-hidden />
                  )}
                </button>

                {renderMenuDropdown(
                  "absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Logo */}
          <div className="hidden shrink-0 items-center sm:flex">
            <Link href="/" className="block">
              <img src="/spartpartslogo-01.png" alt="Spare Parts Logo" className="h-25 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop: Search */}
          <div className="ml-8 hidden min-w-0 flex-1 items-center sm:flex">
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-2xl items-center rounded-full bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black"
            >
              <div className="pl-4 text-slate-400">
                <i className="fa-solid fa-magnifying-glass" aria-hidden></i>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products, brands..."
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
              <div className="m-1">
                <Button type="submit" variant="secondary" rounded="full" size="sm" className="px-6 py-2 text-sm font-bold">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Desktop: Lang + Cart + Avatar */}
          <div className="hidden items-center gap-3 sm:flex sm:gap-6">
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
                <ClickAwaySurface
                  onClose={() => setLangOpen(false)}
                  className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                >
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
                </ClickAwaySurface>
              )}
            </div>

            {/* Right: Cart + Avatar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openCart}
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
                  ref={menuButtonRef}
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-slate-900 transition hover:opacity-70"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={showAsAuthenticated ? "Account menu" : "Sign in"}
                >
                  {showAsAuthenticated ? (
                    <span className="relative flex h-9 w-9 overflow-hidden rounded-full bg-white ring-1 ring-black/10">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-extrabold text-slate-700">
                          {initials}
                        </span>
                      )}
                    </span>
                  ) : (
                    <i className="fa-regular fa-user text-2xl" aria-hidden />
                  )}
                  {/* Customer: avatar-only (no name). Others: keep label. */}
                  {!showAsAuthenticated && (
                    <span className="hidden text-sm font-semibold sm:inline">Sign in account</span>
                  )}
                </button>

                {renderMenuDropdown(
                  "absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Nav - White */}
      <div className="hidden border-b border-slate-200 bg-white sm:block">
        <NavLinks />
      </div>
    </header>

    {/* Mobile bottom navigation */}
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <div className="mx-auto w-full max-w-full rounded-t-2xl border border-slate-200 bg-white px-4 py-2">
        <div className="grid grid-cols-4">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-semibold text-slate-700">
            <i className="fa-solid fa-house text-base" aria-hidden />
            Home
          </Link>
          <Link href="/shop" className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-semibold text-slate-700">
            <i className="fa-solid fa-store text-base" aria-hidden />
            Shop
          </Link>
          <Link href="/deals" className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-semibold text-slate-700">
            <i className="fa-solid fa-tags text-base" aria-hidden />
            Deals
          </Link>
          <Link href="/support" className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-semibold text-slate-700">
            <i className="fa-solid fa-headset text-base" aria-hidden />
            Support
          </Link>
        </div>
      </div>
    </nav>

    {/* Mobile search popup */}
    {mobileSearchOpen && (
      <div className="fixed inset-0 z-50 sm:hidden">
        <div className="absolute inset-0 bg-black/30" />
        <ClickAwaySurface
          onClose={() => setMobileSearchOpen(false)}
          className="absolute left-0 right-0 top-0 mx-auto w-full max-w-10/12 rounded-b-2xl bg-white shadow-lg"
        >
          <div className="flex items-center gap-2 px-3 py-3">
            <i className="fa-solid fa-magnifying-glass text-slate-500" aria-hidden />
            <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products, brands..."
                className="w-full min-w-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
              />
            </form>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="rounded-full px-3 py-2 text-sm font-bold text-slate-700"
              aria-label="Close search"
            >
              Close
            </button>
          </div>
          <div className="border-t border-slate-100 px-3 py-3 text-xs font-semibold text-slate-500">
            Suggestions coming soon
          </div>
        </ClickAwaySurface>
      </div>
    )}

    <CartDrawer open={cartOpen} onClose={closeCart} onViewCart={() => router.push("/cart")} />
    </>
  );
}
