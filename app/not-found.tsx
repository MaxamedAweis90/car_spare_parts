import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        {/* Animated broken gear/tire visual using FontAwesome if available or pure CSS shapes */}
        <div className="relative mx-auto h-40 w-40 animate-pulse rounded-full bg-slate-100 flex items-center justify-center">
          <i className="fa-solid fa-gear text-6xl text-slate-300 animate-[spin_10s_linear_infinite]"></i>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full">
            <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500"></i>
          </div>
        </div>
      </div>

      <h1 className="mb-4 text-6xl font-black text-slate-900">404</h1>
      <h2 className="mb-6 text-2xl font-bold text-slate-700">
        Wrong Turn? That Part's Missing.
      </h2>

      <p className="mx-auto max-w-md text-slate-500 mb-10">
        The page you are looking for seems to have been discontinued, moved, or
        never existed in our inventory.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-primary) px-8 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-200 transition-all hover:bg-amber-400 hover:-translate-y-0.5"
        >
          <i className="fa-solid fa-house"></i>
          Back to Garage
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
          Search Parts
        </Link>
      </div>
    </div>
  );
}
