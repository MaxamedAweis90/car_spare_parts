import Link from "next/link";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 bg-white pt-16 pb-8">
      {/* Top Section: 4 Columns */}
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-6">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Categories (was Men) */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
              Categories
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-500">
              <li>
                <Link
                  href="/shop?category=brake-pads"
                  className="hover:text-red-600 transition"
                >
                  Brake Pads
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=engine-oil"
                  className="hover:text-red-600 transition"
                >
                  Engine Oil
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=filters"
                  className="hover:text-red-600 transition"
                >
                  Filters
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=tires"
                  className="hover:text-red-600 transition"
                >
                  Tires & Wheels
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=batteries"
                  className="hover:text-red-600 transition"
                >
                  Batteries
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=lighting"
                  className="hover:text-red-600 transition"
                >
                  Lighting
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=suspension"
                  className="hover:text-red-600 transition"
                >
                  Suspension
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support (was Women) */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
              Support
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-500">
              <li>
                <Link
                  href="/support/shipping"
                  className="hover:text-red-600 transition"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/support/returns"
                  className="hover:text-red-600 transition"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  href="/support/faq"
                  className="hover:text-red-600 transition"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support/privacy"
                  className="hover:text-red-600 transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/support/terms"
                  className="hover:text-red-600 transition"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/support/contact"
                  className="hover:text-red-600 transition"
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company (was Kids) */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
              Company
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-500">
              <li>
                <Link href="/about" className="hover:text-red-600 transition">
                  About SomaParts
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-red-600 transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-red-600 transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/locations"
                  className="hover:text-red-600 transition"
                >
                  Store Locations
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/seller/register"
                  className="font-semibold text-red-600 hover:text-red-700 transition"
                >
                  Sell on SomaParts
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect (Social & Subscribe) */}
          <div className="flex flex-col gap-8">
            {/* Social Icons */}
            <div className="flex flex-col gap-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                Follow Us
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-white transition hover:bg-blue-500"
                >
                  <i className="fa-brands fa-twitter"></i>
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-600 text-white transition hover:bg-pink-700"
                >
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white transition hover:bg-blue-800"
                >
                  <i className="fa-brands fa-facebook-f"></i>
                </a>
                <a
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400 text-white transition hover:bg-slate-500"
                >
                  <i className="fa-solid fa-globe"></i>
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                Subscribe Us
              </h3>
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Bottom Section: Payments & Copyright */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-slate-100 pt-8 sm:flex-row">
          {/* Payment Icons */}
          <div className="flex flex-wrap items-center gap-4 text-slate-400 grayscale transition hover:grayscale-0 cursor-pointer">
            <div className="flex items-center gap-1 font-bold italic text-slate-700">
              <i className="fa-brands fa-cc-stripe text-2xl text-[#635BFF]"></i>
              <span className="text-sm">Stripe</span>
            </div>
            <div className="flex items-center gap-1 font-bold italic text-slate-800">
              <i className="fa-brands fa-cc-paypal text-2xl text-[#003087]"></i>
              <span className="text-sm">Paypal</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <i className="fa-solid fa-mobile-screen-button text-lg text-green-600"></i>
              <span className="text-sm text-green-700">EVC Plus</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <i className="fa-solid fa-money-bill-transfer text-lg text-yellow-500"></i>
              <span className="text-sm text-yellow-600">eDahab</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-sm font-medium text-slate-500">
            <span className="font-bold text-slate-900">SomaParts</span> &copy;{" "}
            {year} All rights reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
