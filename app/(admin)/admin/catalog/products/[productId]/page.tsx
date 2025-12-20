"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CategoryDoc = { $id: string; name: string };

type CompatibilityDoc = {
  $id: string;
  productId?: string | null;
  label?: string | null;
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
};

type ProductDoc = {
  $id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  stock?: number | null;
  sellerId: string;
  mainCategoryId?: string | null;
  brand?: string | null;
  condition?: string | null;
  partNumber?: string | null;
  imageUrls?: string[];
  compatibilityOptionIds?: string[];
  compatibilities?: CompatibilityDoc[];
};

const CONDITIONS = ["New", "Used", "Refurbished", "Open Box"] as const;

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams() as { productId?: string };
  const productId = params.productId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [compatibilities, setCompatibilities] = useState<CompatibilityDoc[]>([]);

  const [product, setProduct] = useState<ProductDoc | null>(null);
  const [replaceImages, setReplaceImages] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [selectedCompatIds, setSelectedCompatIds] = useState<string[]>([]);

  const [payload, setPayload] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    sellerId: "",
    mainCategoryId: "",
    brand: "",
    condition: "",
    partNumber: "",
  });

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    try {
      const [catRes, prodRes, compRes] = await Promise.all([
        fetch("/api/admin/categories?limit=200", { cache: "no-store" }),
        fetch(`/api/admin/products/${productId}`, { cache: "no-store" }),
        fetch(`/api/admin/compatibilities?limit=200`, { cache: "no-store" }),
      ]);

      const catsBody = await catRes.json().catch(() => null);
      const prodBody = await prodRes.json().catch(() => null);
      const compBody = await compRes.json().catch(() => null);

      if (!catRes.ok) throw new Error(catsBody?.error || "Failed to load categories");
      if (!prodRes.ok) throw new Error(prodBody?.error || "Failed to load product");
      if (!compRes.ok) throw new Error(compBody?.error || "Failed to load compatibilities");

      setCategories(Array.isArray(catsBody?.items) ? catsBody.items : []);
      setCompatibilities(Array.isArray(compBody?.items) ? compBody.items : []);

      const p = prodBody?.product as ProductDoc;
      setProduct(p);
      setPayload({
        name: p?.name || "",
        description: p?.description || "",
        price: p?.price == null ? "" : String(p.price),
        stock: p?.stock == null ? "" : String(p.stock),
        sellerId: p?.sellerId || "",
        mainCategoryId: p?.mainCategoryId || "",
        brand: p?.brand || "",
        condition: p?.condition || "",
        partNumber: p?.partNumber || "",
      });

      setSelectedCompatIds(Array.isArray(p?.compatibilityOptionIds) ? p.compatibilityOptionIds : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const compatLabelById = useMemo(() => {
    const map = new Map<string, string>();
    compatibilities.forEach((c) => {
      const label = c.label || `${c.vehicleType} ${c.make} ${c.model} ${c.yearFrom}-${c.yearTo}`;
      map.set(c.$id, label);
    });
    return map;
  }, [compatibilities]);

  const canSave = Boolean(payload.name.trim() && payload.sellerId.trim() && payload.mainCategoryId.trim());

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId || !canSave) return;

    setSaving(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("name", payload.name);
      form.set("description", payload.description);
      if (payload.price !== "") form.set("price", payload.price);
      if (payload.stock !== "") form.set("stock", payload.stock);
      form.set("sellerId", payload.sellerId);
      form.set("mainCategoryId", payload.mainCategoryId);
      form.set("brand", payload.brand);
      form.set("condition", payload.condition);
      form.set("partNumber", payload.partNumber);
      form.set("compatibilityOptionIds", JSON.stringify(selectedCompatIds));

      if (replaceImages) {
        form.set("replaceImages", "true");
        images.forEach((f) => form.append("images", f));
      }

      const res = await fetch(`/api/admin/products/${productId}`, { method: "PATCH", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save");

      setProduct(body?.product);
      setReplaceImages(false);
      setImages([]);

      router.replace(`/admin/catalog/products/${productId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!productId) return;
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to delete");
      router.replace("/admin/catalog");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Edit product</h1>
            <p className="text-sm text-slate-600">Admin can edit any seller product.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/catalog" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100">
              Back
            </Link>
            <button type="button" onClick={onDelete} disabled={saving || loading} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
              Delete
            </button>
            <button type="submit" form="admin-product-form" disabled={!canSave || saving || loading} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      {loading && <p className="text-sm text-slate-600">Loading...</p>}

      {!loading && product && (
        <form id="admin-product-form" onSubmit={onSave} className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white lg:col-span-2">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Details</h2>
            </div>
            <div className="grid gap-3 px-6 py-5">
              <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.name} onChange={(e) => setPayload((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
              <textarea className="min-h-30 rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.description} onChange={(e) => setPayload((p) => ({ ...p, description: e.target.value }))} placeholder="Description" />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.price} onChange={(e) => setPayload((p) => ({ ...p, price: e.target.value }))} placeholder="Price" />
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.stock} onChange={(e) => setPayload((p) => ({ ...p, stock: e.target.value }))} placeholder="Stock" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.sellerId} onChange={(e) => setPayload((p) => ({ ...p, sellerId: e.target.value }))} placeholder="SellerId" />
                <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.mainCategoryId} onChange={(e) => setPayload((p) => ({ ...p, mainCategoryId: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.$id} value={c.$id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.brand} onChange={(e) => setPayload((p) => ({ ...p, brand: e.target.value }))} placeholder="Brand" />
                <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.condition} onChange={(e) => setPayload((p) => ({ ...p, condition: e.target.value }))}>
                  <option value="">(Optional) Condition</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={payload.partNumber} onChange={(e) => setPayload((p) => ({ ...p, partNumber: e.target.value }))} placeholder="Part number" />
              </div>

              <label className="text-sm font-semibold text-slate-900">Assign compatibilities (for this product)</label>
              <select
                multiple
                className="min-h-35 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={selectedCompatIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setSelectedCompatIds(selected);
                }}
              >
                {compatibilities.map((c) => {
                  const label = compatLabelById.get(c.$id) || c.$id;
                  return (
                    <option key={c.$id} value={c.$id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-slate-500">Create/edit compatibilities in Admin → Catalog → Compatibilities.</p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Images</h2>
              </div>
              <div className="grid gap-3 px-6 py-5">
                <div className="flex flex-wrap gap-2">
                  {(product.imageUrls || []).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="Product" className="h-20 w-20 rounded-xl border border-slate-200 object-cover" />
                  ))}
                  {!product.imageUrls?.length && <p className="text-sm text-slate-600">No images</p>}
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={replaceImages} onChange={(e) => setReplaceImages(e.target.checked)} />
                  Replace images
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={!replaceImages}
                  onChange={(e) => setImages(e.target.files ? Array.from(e.target.files) : [])}
                  className="block w-full text-sm"
                />

                <p className="text-xs text-slate-500">When enabled, old images are deleted after upload.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
              </div>
              <div className="grid gap-3 px-6 py-5">
                <Link href={`/stores/${product.$id}`} className="text-sm text-blue-600">
                  (Optional) View in storefront
                </Link>
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
