"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { performLogout } from "@/lib/logout";
import Button from "./Button";
import NavLinks from "./NavLinks";
import { CartDrawer } from "./CartDrawer";
import { Dropdown } from "antd";
import { useCart } from "@/lib/cart";
import { SearchFilters } from "./SearchFilters";

const LANG_KEY = "spareparts-lang";
const LANG_OPTIONS = ["EN", "AR", "SO"] as const;
const LANG_META: Record<
  (typeof LANG_OPTIONS)[number],
  { label: string; flag: string }
> = {
  EN: {
    label: "EN",
    flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1fa-1f1f8.png",
  },
  AR: {
    label: "AR",
    flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1f8-1f1e6.png",
  },
  SO: {
    label: "SO",
    flag: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1f8-1f1f4.png",
  },
};

// Static product type suggestions
const PRODUCT_TYPES = [
  "Brake Pads",
  "Brake Discs",
  "Brake Kits",
  "Ceramic Brake Kit",
  "Oil Filters",
  "Air Filters",
  "Fuel Filters",
  "Cabin Filters",
  "Engine Oil",
  "Transmission Oil",
  "Coolant",
  "Brake Fluid",
  "Tires",
  "Wheels",
  "Rims",
  "Alloy Wheels",
  "Batteries",
  "Car Batteries",
  "Spark Plugs",
  "Wipers",
  "Headlights",
  "Tail Lights",
  "LED Bulbs",
  "Halogen Bulbs",
  "Suspension",
  "Shocks",
  "Struts",
  "Coilovers",
  "Belts",
  "Timing Belts",
  "Serpentine Belts",
  "Hoses",
  "Gaskets",
  "Radiators",
  "Alternators",
  "Starters",
  "Exhaust",
  "Mufflers",
  "Catalytic Converters",
];

export default function Navbar() {
  const router = useRouter();
  const { authenticated, profile, loading } = useSession();
  const {
    count: cartCount,
    total: cartTotal,
    openCart,
    closeCart,
    isOpen: cartOpen,
  } = useCart();
  const searchRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<(typeof LANG_OPTIONS)[number]>("EN");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    onSale: false,
    make: "",
    model: "",
    year: "",
    category: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (
        saved &&
        LANG_OPTIONS.includes(saved as (typeof LANG_OPTIONS)[number])
      ) {
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

  // Debounced autocomplete - triggers 3 seconds after user stops typing
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      const filtered = PRODUCT_TYPES.filter((type) =>
        type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    setMobileSearchOpen(false);

    setShowSuggestions(false);
    setShowFilters(false);

    // Build search URL with filters
    const params = new URLSearchParams();
    if (trimmed) params.set("search", trimmed);
    if (filters.minPrice > 0)
      params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice < 1000)
      params.set("maxPrice", filters.maxPrice.toString());
    if (filters.onSale) params.set("onSale", "true");
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.year) params.set("year", filters.year);
    if (filters.category) params.set("category", filters.category);

    router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  // Public site rule:
  // - Only customers should appear "logged in" on home/public pages.
  // - Sellers/Admins may browse home, but should not show logged-in UI there.
  const showAsAuthenticated = authenticated && profile?.role === "customer";
  const userName = showAsAuthenticated ? profile?.name || "Account" : "Guest";
  const isSellerPending = false;
  const avatarUrl: string | null = showAsAuthenticated
    ? profile?.avatarUrl || null
    : null;
  const initials = (() => {
    const name: string = profile?.name || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const two = parts
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase())
      .join("");
    return two || "A";
  })();

  const handleSignOut = async () => {
    await performLogout();
    if (typeof window !== "undefined") {
      window.location.assign("/");
      return;
    }
    router.replace("/");
    router.refresh();
  };

  const renderMenuContent = () => (
    <div
      className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      role="menu"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white ring-1 ring-black/10">
          {showAsAuthenticated && avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
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
          <div className="truncate text-sm font-extrabold text-slate-900">
            {loading ? "Loading..." : userName}
          </div>
          {showAsAuthenticated && profile?.email && (
            <div className="truncate text-xs font-semibold text-slate-600">
              {profile.email}
            </div>
          )}
        </div>
      </div>

      <div className="py-1 text-sm font-semibold text-slate-700">
        {showAsAuthenticated ? (
          <>
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <i
                className="fa-regular fa-id-card text-sm text-slate-600"
                aria-hidden
              />
              <span>My Account</span>
            </Link>

            <Link
              href="/orders"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <i
                className="fa-solid fa-box text-sm text-slate-600"
                aria-hidden
              />
              <span>Orders</span>
            </Link>

            {isSellerPending && (
              <Link
                href="/auth/seller/pending"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
              >
                <i
                  className="fa-solid fa-clock-rotate-left text-sm text-slate-600"
                  aria-hidden
                />
                <span>Seller Pending</span>
              </Link>
            )}

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-red-700 hover:bg-red-50"
            >
              <i
                className="fa-solid fa-arrow-right-from-bracket text-sm"
                aria-hidden
              />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <i
                className="fa-solid fa-right-to-bracket text-sm text-slate-600"
                aria-hidden
              />
              <span>Login</span>
            </Link>

            <Link
              href="/auth/register"
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <i
                className="fa-solid fa-user-plus text-sm text-slate-600"
                aria-hidden
              />
              <span>Register</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Main Header - Yellow - Sticky */}
      <div className="sticky top-0 z-30 shadow-sm bg-(--color-primary) py-2">
        <nav className="mx-auto flex w-full max-w-full sm:max-w-10/12 items-center gap-4 px-4 sm:px-6">
          {/* Mobile: Cart + Search (left), Logo (right) */}
          <div className="flex w-full items-center justify-between sm:hidden">
            <Link href="/" className="block">
              <img
                src="/spartpartslogo-02.png"
                alt="SomaParts Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(true);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 ring-1 ring-black/10"
                aria-label="Search"
              >
                <i
                  className="fa-solid fa-magnifying-glass text-lg"
                  aria-hidden
                />
              </button>

              <button
                type="button"
                onClick={() => {
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

              <Dropdown
                popupRender={renderMenuContent}
                trigger={["click"]}
                placement="bottomRight"
                classNames={{ root: "z-[1001]" }}
              >
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white/90 text-slate-900 ring-1 ring-black/10 transition-transform active:scale-95"
                  aria-label={showAsAuthenticated ? "Account menu" : "Sign in"}
                >
                  {showAsAuthenticated ? (
                    avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-extrabold text-slate-700">
                        {initials}
                      </span>
                    )
                  ) : (
                    <i className="fa-regular fa-user text-lg" aria-hidden />
                  )}
                </button>
              </Dropdown>
            </div>
          </div>

          {/* Desktop: Logo */}
          <div className="hidden shrink-0 items-center sm:flex">
            <Link href="/" className="block">
              <img
                src="/spartpartslogo-02.png"
                alt="SomaParts Logo"
                className="h-16 md:h-20 lg:h-25 w-auto object-contain transition-all"
              />
            </Link>
          </div>

          {/* Desktop: Search */}
          <div className="ml-8 hidden min-w-0 flex-1 items-center sm:flex">
            <div className="relative w-full max-w-2xl" ref={searchRef}>
              <form
                onSubmit={handleSearch}
                className="flex w-full items-center rounded-full bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-black"
              >
                <div className="pl-4 text-slate-400">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden></i>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Search for products, brands..."
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                />

                {/* Filter Button */}
                <div className="relative mr-1">
                  <Dropdown
                    open={showFilters}
                    onOpenChange={setShowFilters}
                    trigger={["click"]}
                    placement="bottomRight"
                    popupRender={() => (
                      <div className="z-[1001] mt-2">
                        <SearchFilters
                          filters={filters}
                          onFiltersChange={(newFilters) => {
                            setFilters(newFilters as any);
                          }}
                          onClose={() => setShowFilters(false)}
                        />
                      </div>
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 ${
                        showFilters ||
                        filters.minPrice > 0 ||
                        filters.maxPrice < 1000 ||
                        filters.onSale
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      aria-label="Filters"
                    >
                      <i className="fa-solid fa-sliders text-sm" aria-hidden />
                    </button>
                  </Dropdown>
                </div>

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

              {/* Autocomplete Dropdown */}
              <Dropdown
                open={showSuggestions && suggestions.length > 0}
                onOpenChange={setShowSuggestions}
                trigger={[]}
                placement="bottomLeft"
                popupRender={() => (
                  <div className="z-[1001] mt-2 w-[calc(100vw-2rem)] sm:w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                    <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Suggestions
                    </div>
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleSuggestionClick(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <i
                          className="fa-solid fa-magnifying-glass text-xs text-slate-400"
                          aria-hidden
                        />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              >
                <div />
              </Dropdown>
            </div>
          </div>

          {/* Desktop: Lang + Cart + Avatar */}
          <div className="hidden items-center gap-3 sm:flex sm:gap-6">
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              popupRender={() => (
                <div className="w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {LANG_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setLanguage(option);
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
                      <span className="font-semibold tracking-wide">
                        {LANG_META[option].label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-transparent px-2 py-1 text-sm font-semibold text-white transition hover:opacity-70 active:scale-95 touch-manipulation"
                aria-label="Select Language"
              >
                <img
                  src={LANG_META[language].flag}
                  alt={LANG_META[language].label}
                  className="h-5 w-5 object-contain"
                />
                <span className="font-bold tracking-wide">
                  {LANG_META[language].label}
                </span>
                <span className="hidden text-xs font-semibold text-slate-000 lg:inline">
                  Language
                </span>
                <i
                  className="fa-solid fa-chevron-down text-[10px] text-slate-900"
                  aria-hidden
                />
              </button>
            </Dropdown>

            {/* Right: Cart + Avatar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={openCart}
                className="group relative flex items-center gap-2 text-white"
                aria-label="Cart"
              >
                <div className="relative">
                  <i
                    className="fa-solid fa-cart-shopping text-2xl transition group-hover:opacity-70"
                    aria-hidden
                  />
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-accent) text-[10px] font-bold text-white shadow-sm">
                    {cartCount}
                  </span>
                </div>
                <span className="hidden text-sm font-bold sm:block">Cart</span>
                <span className="hidden text-sm font-bold sm:block">
                  ${cartTotal.toFixed(2)}
                </span>
              </button>

              <Dropdown
                popupRender={renderMenuContent}
                trigger={["click"]}
                placement="bottomRight"
                classNames={{ root: "z-[1001]" }}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 text-white transition hover:opacity-70 active:scale-95"
                  aria-label={showAsAuthenticated ? "Account menu" : "Sign in"}
                >
                  {showAsAuthenticated ? (
                    <span className="relative flex h-9 w-9 overflow-hidden rounded-full bg-white ring-1 ring-black/10">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-extrabold text-slate-700">
                          {initials}
                        </span>
                      )}
                    </span>
                  ) : (
                    <i className="fa-regular fa-user text-2xl" aria-hidden />
                  )}
                  {!showAsAuthenticated && (
                    <span className="hidden text-sm font-semibold sm:inline">
                      Sign in account
                    </span>
                  )}
                </button>
              </Dropdown>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Nav - White */}
      <div className="hidden border-b border-slate-200 bg-white sm:block">
        <NavLinks />
      </div>
      {/* Header End Removed */}

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="mx-auto w-full max-w-full rounded-t-2xl border border-slate-200 bg-white px-4 py-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-4">
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-bold text-slate-700 active:text-(--color-primary-strong)"
            >
              <i className="fa-solid fa-house text-lg" aria-hidden />
              <span>Home</span>
            </Link>
            <Link
              href="/shop"
              className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-bold text-slate-700 active:text-(--color-primary-strong)"
            >
              <i className="fa-solid fa-store text-lg" aria-hidden />
              <span>Shop</span>
            </Link>
            <Link
              href="/stores"
              className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-bold text-slate-700 active:text-(--color-primary-strong)"
            >
              <i className="fa-solid fa-shop text-lg" aria-hidden />
              <span>Stores</span>
            </Link>

            <Dropdown
              trigger={["click"]}
              placement="topRight"
              popupRender={() => (
                <div className="mb-4 w-48 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                  <div className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                    Menu
                  </div>
                  <div className="flex flex-col py-1">
                    <Link
                      href="/deals"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                    >
                      <i className="fa-solid fa-tags text-slate-400" />
                      Hot Deals
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                    >
                      <i className="fa-solid fa-headset text-slate-400" />
                      Support
                    </Link>
                    {!authenticated && (
                      <Link
                        href="/auth/seller/register"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-(--color-primary-strong) hover:bg-orange-50 active:bg-orange-100"
                      >
                        <i className="fa-solid fa-briefcase" />
                        Sell on Soma
                      </Link>
                    )}
                  </div>
                </div>
              )}
            >
              <button
                type="button"
                className="flex flex-col items-center justify-center gap-1 py-1 text-xs font-bold text-slate-700 active:text-(--color-primary-strong)"
              >
                <i className="fa-solid fa-ellipsis text-lg" aria-hidden />
                <span>More</span>
              </button>
            </Dropdown>
          </div>
        </div>
      </nav>

      {/* Mobile search popup */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileSearchOpen(false)}
          />
          <div className="absolute left-0 right-0 top-0 mx-auto w-full max-w-[95%] rounded-b-3xl bg-white shadow-2xl">
            {/* Search Header */}
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <i
                  className="fa-solid fa-magnifying-glass text-slate-400"
                  aria-hidden
                />
                <form
                  onSubmit={handleSearch}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Search for products..."
                    className="w-full min-w-0 bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
                  />

                  {/* Filter Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowFilters(!showFilters);
                      setShowSuggestions(false);
                    }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      showFilters ||
                      filters.minPrice > 0 ||
                      filters.maxPrice < 1000 ||
                      filters.onSale
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    aria-label="Filters"
                  >
                    <i className="fa-solid fa-sliders text-xs" aria-hidden />
                  </button>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="shrink-0 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
                  >
                    Search
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setShowSuggestions(false);
                    setShowFilters(false);
                  }}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                  aria-label="Close search"
                >
                  <i className="fa-solid fa-xmark text-xl" aria-hidden />
                </button>
              </div>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && !showFilters && (
              <div className="max-h-64 overflow-y-auto border-b border-slate-100">
                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Suggestions
                </div>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSuggestionClick(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition active:bg-slate-100"
                  >
                    <i
                      className="fa-solid fa-magnifying-glass text-xs text-slate-400"
                      aria-hidden
                    />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <SearchFilters
                  filters={filters}
                  onFiltersChange={(newFilters) => {
                    setFilters(newFilters as any);
                  }}
                  onClose={() => setShowFilters(false)}
                />
              </div>
            )}

            {/* Helper Text */}
            {!showSuggestions && !showFilters && (
              <div className="px-4 py-3 text-xs text-slate-500">
                <p className="font-semibold">
                  💡 Tip: Stop typing for 3 seconds to see suggestions
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        onViewCart={() => router.push("/cart")}
      />
    </>
  );
}
