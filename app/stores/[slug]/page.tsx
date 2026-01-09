import { notFound } from "next/navigation";
import {
  findStoreBySlug,
  serializeStoreDocument,
} from "@/lib/server/sellerStoreService";
import {
  buildProductImageUrl,
  findProductsBySellerId,
} from "@/lib/server/productService";
import Breadcrumbs from "@/components/Breadcrumbs";

function buildStoreAssetUrl(fileId: string | null, kind: "avatar" | "banner") {
  if (!fileId) return null;
  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const project =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID;
  const avatarBucket =
    process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID ||
    process.env.APPWRITE_STORE_AVATAR_BUCKET_ID;
  const bannerBucket =
    process.env.NEXT_PUBLIC_APPWRITE_STORE_BANNER_BUCKET_ID ||
    process.env.APPWRITE_STORE_BANNER_BUCKET_ID ||
    avatarBucket;
  const bucket = kind === "avatar" ? avatarBucket : bannerBucket;
  if (!endpoint || !project || !bucket) return null;
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`
  );
  url.searchParams.set("project", project);
  return url.toString();
}

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const storeDoc = await findStoreBySlug(slug);
  if (!storeDoc || storeDoc.isActive === false) {
    notFound();
  }

  const store = serializeStoreDocument(storeDoc);
  const avatarUrl = buildStoreAssetUrl(store.storeAvatarId ?? null, "avatar");
  const bannerUrl = buildStoreAssetUrl(store.storeBannerId ?? null, "banner");
  const initials = store.storeName.slice(0, 2).toUpperCase();
  const heroFallback =
    "https://images.unsplash.com/photo-1549921296-3b4a698c73e1?auto=format&fit=crop&w=1600&q=80";
  const bannerImage = bannerUrl ?? heroFallback;
  const description =
    store.storeDescription ||
    "From first sip to the last mile, we keep your ride running at its best.";
  const products = await findProductsBySellerId(store.sellerId, 10);
  const featuredProducts = products.slice(0, 5).map((product) => {
    const candidateImageId =
      (product as any)?.imageId ||
      (product as any)?.primaryImageId ||
      (product as any)?.image ||
      null;
    return {
      id: product.$id,
      name: product.name,
      category: "Featured",
      price: typeof product.price === "number" ? product.price : null,
      image: buildProductImageUrl(
        typeof candidateImageId === "string" ? candidateImageId : null
      ),
    };
  });
  const formatPrice = (value: number | null) => {
    if (value == null) return null;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  return (
    <div className="bg-[#f4f1e9] min-h-screen">
      <div className="mx-auto w-full max-w-10/12 px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { title: "Stores", href: "/stores" },
            { title: store.storeName },
          ]}
        />
        <section className="overflow-hidden rounded-4xl bg-white shadow-xl shadow-black/5">
          <div className="relative h-60 sm:h-72">
            <img
              src={bannerImage}
              alt={`${store.storeName} banner`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/35 to-transparent" />
            <div className="relative flex h-full items-end px-6 pb-6">
              <div className="flex items-center gap-4 text-white">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/20 backdrop-blur">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${store.storeName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold">{initials}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold sm:text-4xl">
                    {store.storeName}
                  </h1>
                  <p className="text-sm text-white/80">
                    Curated by {store.storeSlug}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-b border-(--color-border) bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-(--color-border) bg-white">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${store.storeName} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-(--color-text)">
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-(--color-text)">
                  {store.storeName}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--color-muted)">
                  Official storefront
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-(--color-primary) px-5 py-2 text-sm font-semibold text-black transition hover:bg-(--color-primary-strong)">
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5 fill-current"
                >
                  <path d="M7 1h2v6h6v2H9v6H7V9H1V7h6z" />
                </svg>
                Follow
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-text) hover:border-(--color-primary) hover:text-(--color-primary)">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M13.5 2a3.5 3.5 0 0 1 2.62 5.85l2.17 1.25a1 1 0 0 1 0 1.8l-2.6 1.5A3.5 3.5 0 1 1 9 17.5V14l4.49-2.58-4.5-2.59V5a3.5 3.5 0 0 1 4.5-3z" />
                </svg>
                Share
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-b border-(--color-border) bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-(--color-muted)">
              {(
                [
                  "Home",
                  "New arrivals",
                  "Top picks",
                  "Bundles",
                  "Reviews",
                  "More",
                ] as const
              ).map((item, index) => (
                <span
                  key={item}
                  className={`cursor-pointer pb-1 ${
                    index === 0
                      ? "border-b-2 border-(--color-primary) text-(--color-text)"
                      : "hover:text-(--color-text)"
                  }`}
                >
                  {item}
                </span>
              ))}
            </nav>
            <div className="relative w-full max-w-xs">
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-(--color-muted)"
              >
                <path d="M11.742 10.344 15.3 13.9l-1.4 1.4-3.556-3.558a6 6 0 1 1 1.4-1.4zM6.5 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z" />
              </svg>
              <input
                type="search"
                className="w-full rounded-full border border-(--color-border) bg-(--color-surface) py-2 pl-9 pr-4 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                placeholder={`Search all ${store.storeName}`}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-(--color-border-strong) bg-white p-8 text-center shadow-panel">
          <h2 className="text-2xl font-bold text-(--color-text)">
            {description}
          </h2>
          <p className="mt-3 text-sm text-(--color-muted)">
            Quality automotive upgrades handpicked by {store.storeName}. Shop
            the collections below.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-(--color-text)">
              Featured collections
            </h3>
            <a
              href="/products"
              className="text-sm font-semibold text-(--color-primary) hover:text-(--color-primary-strong)"
            >
              View all
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-3xl border border-(--color-border) bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-4/5 overflow-hidden rounded-t-3xl bg-(--color-surface)">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                        No image
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                      {product.category || "Featured"}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-(--color-text)">
                      {product.name}
                    </p>
                    {formatPrice(product.price) && (
                      <p className="mt-1 text-sm font-extrabold text-(--color-text)">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-center rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface) px-6 py-12 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-(--color-text)">
                    No products showcased yet
                  </p>
                  <p className="text-xs font-medium text-(--color-muted)">
                    Add products to your catalog to populate this featured strip
                    automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-(--color-text)">
              Store highlights
            </h3>
            <ul className="space-y-3 text-sm text-(--color-text)">
              <li className="flex items-start gap-2">
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="mt-1 h-3.5 w-3.5 fill-(--color-primary)"
                >
                  <path d="M13.78 4.22 6 12l-3.78-3.78 1.56-1.56L6 8.88l6.22-6.22z" />
                </svg>
                All parts inspected for OEM quality.
              </li>
              <li className="flex items-start gap-2">
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="mt-1 h-3.5 w-3.5 fill-(--color-primary)"
                >
                  <path d="M13.78 4.22 6 12l-3.78-3.78 1.56-1.56L6 8.88l6.22-6.22z" />
                </svg>
                Flexible shipping and pickup options.
              </li>
              <li className="flex items-start gap-2">
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="mt-1 h-3.5 w-3.5 fill-(--color-primary)"
                >
                  <path d="M13.78 4.22 6 12l-3.78-3.78 1.56-1.56L6 8.88l6.22-6.22z" />
                </svg>
                Dedicated support for compatibility questions.
              </li>
            </ul>
          </div>
          <div className="space-y-4 rounded-3xl border border-(--color-border) bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                Contact email
              </p>
              <p className="mt-2 text-sm font-semibold text-(--color-text)">
                {store.contactEmail || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                Contact phone
              </p>
              <p className="mt-2 text-sm font-semibold text-(--color-text)">
                {store.contactPhone || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                Last updated
              </p>
              <p className="mt-2 text-sm font-semibold text-(--color-text)">
                {new Date(store.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
