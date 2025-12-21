"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CategoryDoc = {
  $id: string;
  name: string;
  parentCategoryId?: string | null;
  type?: string | null;
};

type CategoryType = "vehicle" | "system" | "sellable";

function parseCategoryType(value: unknown): CategoryType | null {
  const v = typeof value === "string" ? value.trim() : "";
  const lower = v.toLowerCase();
  if (lower === "vehicle" || lower === "system" || lower === "sellable") return lower as CategoryType;
  return null;
}

function inferCategoryType(category: CategoryDoc, byId: Map<string, CategoryDoc>): "vehicle" | "system" | "sellable" | null {
  const explicit = parseCategoryType(category.type);
  if (explicit) return explicit;
  const parentId = category.parentCategoryId || null;
  if (!parentId) return "vehicle";
  const parent = byId.get(parentId);
  if (!parent) return "system";
  const grandParentId = parent.parentCategoryId || null;
  if (!grandParentId) return "system";
  return "sellable";
}

type ProductDoc = {
  $id: string;
  name: string;
  sellerId: string;
  mainCategoryId?: string | null;
  price?: number | null;
  stock?: number | null;
};

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

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminCatalogPage() {
  const [tab, setTab] = useState<"products" | "categories" | "compatibilities">("products");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [compatibilities, setCompatibilities] = useState<CompatibilityDoc[]>([]);

  // Category editor
  const [categoryForm, setCategoryForm] = useState<{ name: string; type: "" | CategoryType; parentCategoryId: string }>(
    {
      name: "",
      type: "",
      parentCategoryId: "",
    }
  );
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Compatibility editor
  const [compatProductId, setCompatProductId] = useState<string>("");
  const [compatForm, setCompatForm] = useState({
    productId: "",
    label: "",
    vehicleType: "",
    make: "",
    model: "",
    yearFrom: "",
    yearTo: "",
  });
  const [editingCompatId, setEditingCompatId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/admin/categories?limit=200", { cache: "no-store" }),
        fetch("/api/admin/products?limit=200", { cache: "no-store" }),
      ]);

      const catBody = await catRes.json().catch(() => null);
      const prodBody = await prodRes.json().catch(() => null);

      if (!catRes.ok) throw new Error(catBody?.error || "Failed to load categories");
      if (!prodRes.ok) throw new Error(prodBody?.error || "Failed to load products");

      setCategories(Array.isArray(catBody?.items) ? catBody.items : []);
      setProducts(Array.isArray(prodBody?.items) ? prodBody.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const loadCompatibilities = async (productId: string) => {
    setError(null);
    try {
      const url = productId ? `/api/admin/compatibilities?productId=${encodeURIComponent(productId)}&limit=200` : `/api/admin/compatibilities?limit=200`;
      const res = await fetch(url, { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to load compatibilities");
      setCompatibilities(Array.isArray(body?.items) ? body.items : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load compatibilities");
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "compatibilities") return;
    void loadCompatibilities(compatProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, compatProductId]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.$id, c.name));
    return map;
  }, [categories]);

  const categoryById = useMemo(() => {
    const map = new Map<string, CategoryDoc>();
    categories.forEach((c) => map.set(c.$id, c));
    return map;
  }, [categories]);

  const categorized = useMemo(() => {
    const vehicles: CategoryDoc[] = [];
    const systems: CategoryDoc[] = [];
    const sellables: CategoryDoc[] = [];
    const unknown: CategoryDoc[] = [];

    categories.forEach((c) => {
      const t = inferCategoryType(c, categoryById);
      if (t === "vehicle") vehicles.push(c);
      else if (t === "system") systems.push(c);
      else if (t === "sellable") sellables.push(c);
      else unknown.push(c);
    });

    return {
      vehicles,
      systems,
      sellables,
      unknown,
    };
  }, [categories, categoryById]);

  const allowedParentOptions = useMemo(() => {
    if (!categoryForm.type) return [] as CategoryDoc[];
    if (categoryForm.type === "vehicle") return [];
    if (categoryForm.type === "system") return categorized.vehicles;
    return categorized.systems;
  }, [categoryForm.type, categorized.systems, categorized.vehicles]);

  useEffect(() => {
    if (categoryForm.type === "vehicle") {
      if (categoryForm.parentCategoryId) setCategoryForm((p) => ({ ...p, parentCategoryId: "" }));
      return;
    }
    if (!categoryForm.type) return;
    if (!categoryForm.parentCategoryId) return;
    const exists = allowedParentOptions.some((c) => c.$id === categoryForm.parentCategoryId);
    if (!exists) setCategoryForm((p) => ({ ...p, parentCategoryId: "" }));
  }, [allowedParentOptions, categoryForm.parentCategoryId, categoryForm.type]);

  const onCreateOrUpdateCategory = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!categoryForm.name.trim()) throw new Error("Category name is required");
      if (!categoryForm.type) throw new Error("Category type is required");
      if (categoryForm.type === "system" && !categoryForm.parentCategoryId) throw new Error("System category requires a vehicle parent");
      if (categoryForm.type === "sellable" && !categoryForm.parentCategoryId) throw new Error("Sellable category requires a system parent");

      const isBulkCreate = !editingCategoryId;
      const names = isBulkCreate
        ? Array.from(
            new Set(
              categoryForm.name
                .split(/[\n,]+/g)
                .map((n) => n.trim())
                .filter(Boolean)
            )
          )
        : [categoryForm.name.trim()];

      const payload = {
        ...(names.length > 1 ? { names } : { name: names[0] }),
        parentCategoryId: categoryForm.type === "vehicle" ? null : categoryForm.parentCategoryId || null,
        type: categoryForm.type,
      };

      const res = await fetch(
        editingCategoryId ? `/api/admin/categories/${editingCategoryId}` : "/api/admin/categories",
        {
          method: editingCategoryId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save category");

      setCategoryForm({ name: "", parentCategoryId: "", type: "" });
      setEditingCategoryId(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const onEditCategory = (c: CategoryDoc) => {
    setEditingCategoryId(c.$id);
    const safeType = parseCategoryType(c.type);
    setCategoryForm({
      name: c.name || "",
      parentCategoryId: c.parentCategoryId || "",
      type: safeType || "",
    });
  };

  const onDeleteCategory = async (id: string) => {
    const ok = window.confirm("Delete this category?");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to delete category");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setSaving(false);
    }
  };

  const onCreateOrUpdateCompatibility = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        productId: compatForm.productId.trim() ? compatForm.productId.trim() : null,
        label: compatForm.label || null,
        vehicleType: compatForm.vehicleType,
        make: compatForm.make,
        model: compatForm.model,
        yearFrom: Number(compatForm.yearFrom),
        yearTo: Number(compatForm.yearTo),
      };

      const res = await fetch(
        editingCompatId ? `/api/admin/compatibilities/${editingCompatId}` : "/api/admin/compatibilities",
        {
          method: editingCompatId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save compatibility");

      setCompatForm({ productId: compatProductId || "", label: "", vehicleType: "", make: "", model: "", yearFrom: "", yearTo: "" });
      setEditingCompatId(null);
      await loadCompatibilities(compatProductId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save compatibility");
    } finally {
      setSaving(false);
    }
  };

  const onEditCompatibility = (c: CompatibilityDoc) => {
    setEditingCompatId(c.$id);
    setCompatForm({
      productId: c.productId || "",
      label: c.label || "",
      vehicleType: c.vehicleType || "",
      make: c.make || "",
      model: c.model || "",
      yearFrom: String(c.yearFrom ?? ""),
      yearTo: String(c.yearTo ?? ""),
    });
  };

  const onDeleteCompatibility = async (id: string) => {
    const ok = window.confirm("Delete this compatibility?");
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/compatibilities/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to delete compatibility");
      await loadCompatibilities(compatProductId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete compatibility");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Catalog management</h1>
        <p className="text-sm text-slate-600">Admin control over products, categories, and compatibilities.</p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton active={tab === "products"} label="Products" onClick={() => setTab("products")} />
          <TabButton active={tab === "categories"} label="Categories" onClick={() => setTab("categories")} />
          <TabButton active={tab === "compatibilities"} label="Compatibilities" onClick={() => setTab("compatibilities")} />
        </div>
        <Link href="/admin" className="text-sm text-blue-600">
          Back to Admin Dashboard
        </Link>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {loading && <p className="text-sm text-slate-600">Loading...</p>}

      {!loading && tab === "products" && (
        <section className="rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All products</h2>
              <p className="text-sm text-slate-600">Edit any seller product.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">SellerId</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Price</th>
                  <th className="px-6 py-3 font-semibold">Stock</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => (
                  <tr key={p.$id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-6 py-3 text-slate-700">{p.sellerId}</td>
                    <td className="px-6 py-3 text-slate-700">{p.mainCategoryId ? categoryNameById.get(p.mainCategoryId) || p.mainCategoryId : "—"}</td>
                    <td className="px-6 py-3 text-slate-700">{typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "—"}</td>
                    <td className="px-6 py-3 text-slate-700">{typeof p.stock === "number" ? p.stock : "—"}</td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/catalog/products/${p.$id}`}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && tab === "categories" && (
        <section className="grid gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{editingCategoryId ? "Edit category" : "Create category"}</h2>
              <p className="text-sm text-slate-600">Types: vehicle → system → sellable</p>
            </div>
            <div className="grid gap-3 px-6 py-5">
              {editingCategoryId ? (
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                />
              ) : (
                <textarea
                  className="min-h-21 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Names (comma or newline separated)"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                />
              )}

              {!editingCategoryId && (
                <p className="text-xs text-slate-500">
                  Tip: paste <span className="font-semibold">Sellable</span> names like <span className="font-mono">Oil Filter, Air Filter, Spark Plug</span>.
                </p>
              )}

              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={categoryForm.type}
                onChange={(e) => setCategoryForm((p) => ({ ...p, type: e.target.value as any }))}
              >
                <option value="">Select type…</option>
                <option value="vehicle">Vehicle (top level)</option>
                <option value="system">System (child of vehicle)</option>
                <option value="sellable">Sellable (child of system)</option>
              </select>

              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                value={categoryForm.parentCategoryId}
                disabled={!categoryForm.type || categoryForm.type === "vehicle"}
                onChange={(e) => setCategoryForm((p) => ({ ...p, parentCategoryId: e.target.value }))}
              >
                <option value="">
                  {categoryForm.type === "system"
                    ? "Select vehicle parent…"
                    : categoryForm.type === "sellable"
                    ? "Select system parent…"
                    : "No parent (vehicle)"}
                </option>
                {allowedParentOptions.map((c) => (
                  <option key={c.$id} value={c.$id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onCreateOrUpdateCategory}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCategoryId ? "Update" : "Create"}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm({ name: "", parentCategoryId: "", type: "" });
                    }}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
              <p className="text-sm text-slate-600">
                {categorized.vehicles.length} vehicles • {categorized.systems.length} systems • {categorized.sellables.length} sellables
                {categorized.unknown.length ? ` • ${categorized.unknown.length} unknown` : ""}
              </p>
            </div>
            <div className="divide-y divide-slate-200">
              {([
                { key: "vehicle", title: "Vehicle", items: categorized.vehicles },
                { key: "system", title: "System", items: categorized.systems },
                { key: "sellable", title: "Sellable", items: categorized.sellables },
              ] as const).map((section) => (
                <div key={section.key}>
                  <div className="bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-700">{section.title} ({section.items.length})</div>
                  <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((c) => {
                      const parentName = c.parentCategoryId ? categoryNameById.get(c.parentCategoryId) : null;
                      return (
                        <div key={c.$id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500">
                              id: {c.$id}
                              {parentName ? ` • parent: ${parentName}` : c.parentCategoryId ? ` • parent: ${c.parentCategoryId}` : ""}
                              {parseCategoryType(c.type) ? ` • type: ${String(c.type)}` : ""}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onEditCategory(c)}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => onDeleteCategory(c.$id)}
                              className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!!categorized.unknown.length && (
                <div>
                  <div className="bg-amber-50 px-6 py-3 text-xs font-semibold text-amber-800">Unknown / legacy ({categorized.unknown.length})</div>
                  <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categorized.unknown.map((c) => (
                      <div key={c.$id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">id: {c.$id}</p>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditCategory(c)}
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => onDeleteCategory(c.$id)}
                            className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && tab === "compatibilities" && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{editingCompatId ? "Edit compatibility" : "Create compatibility"}</h2>
              <p className="text-sm text-slate-600">Optional: attach to a product.</p>
            </div>
            <div className="grid gap-3 px-6 py-5">
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={compatForm.productId}
                onChange={(e) => {
                  const productId = e.target.value;
                  setCompatForm((p) => ({ ...p, productId }));
                }}
              >
                <option value="">(Global option) No product</option>
                {products.map((p) => (
                  <option key={p.$id} value={p.$id}>
                    {p.name} ({p.$id})
                  </option>
                ))}
              </select>

              <input
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Label (optional)"
                value={compatForm.label}
                onChange={(e) => setCompatForm((p) => ({ ...p, label: e.target.value }))}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Vehicle type"
                  value={compatForm.vehicleType}
                  onChange={(e) => setCompatForm((p) => ({ ...p, vehicleType: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Make"
                  value={compatForm.make}
                  onChange={(e) => setCompatForm((p) => ({ ...p, make: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Model"
                  value={compatForm.model}
                  onChange={(e) => setCompatForm((p) => ({ ...p, model: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Year from"
                  value={compatForm.yearFrom}
                  onChange={(e) => setCompatForm((p) => ({ ...p, yearFrom: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Year to"
                  value={compatForm.yearTo}
                  onChange={(e) => setCompatForm((p) => ({ ...p, yearTo: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onCreateOrUpdateCompatibility}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCompatId ? "Update" : "Create"}
                </button>
                {editingCompatId && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditingCompatId(null);
                      setCompatForm({ productId: compatProductId || "", label: "", vehicleType: "", make: "", model: "", yearFrom: "", yearTo: "" });
                    }}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Compatibilities</h2>
                  <p className="text-sm text-slate-600">Filter by product</p>
                </div>
                <select
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={compatProductId}
                  onChange={(e) => {
                    const productId = e.target.value;
                    setCompatProductId(productId);
                    setCompatForm((p) => ({ ...p, productId: productId || p.productId }));
                  }}
                >
                  <option value="">All products</option>
                  {products.map((p) => (
                    <option key={p.$id} value={p.$id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ul className="divide-y divide-slate-200">
              {compatibilities.map((c) => (
                <li key={c.$id} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{c.label || `${c.vehicleType} ${c.make} ${c.model} ${c.yearFrom}-${c.yearTo}`}</p>
                    <p className="text-xs text-slate-500">productId: {c.productId || "—"} • id: {c.$id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditCompatibility(c)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onDeleteCompatibility(c.$id)}
                      className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {compatibilities.length === 0 && (
                <li className="px-6 py-4 text-sm text-slate-600">No compatibilities found.</li>
              )}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
