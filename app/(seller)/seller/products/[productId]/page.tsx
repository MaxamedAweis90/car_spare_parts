"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

type CategoryItem = { id: string; name: string; label?: string };

type CompatibilityOptionItem = { id: string; label: string };

const CONDITIONS = ["New", "Used", "Refurbished", "Open Box"] as const;

type CompatibilitySelection = {
  compatibilityOptionIds: string[];
};

type SellerProduct = {
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
  imageIds?: string[];
  imageUrls?: string[];
  compatibilityOptionIds?: string[];
  compatibilityOptions?: Array<{ id: string; label: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProduct(doc: unknown): SellerProduct | null {
  if (!isRecord(doc)) return null;
  const id = typeof doc.$id === "string" ? doc.$id : null;
  const name = typeof doc.name === "string" ? doc.name : "";
  const sellerId = typeof doc.sellerId === "string" ? doc.sellerId : "";
  if (!id || !name || !sellerId) return null;

  return {
    $id: id,
    name,
    sellerId,
    description: typeof doc.description === "string" ? doc.description : (doc.description as any) ?? null,
    price: typeof doc.price === "number" ? doc.price : doc.price == null ? null : Number(doc.price),
    stock: typeof doc.stock === "number" ? doc.stock : doc.stock == null ? null : Number(doc.stock),
    mainCategoryId: typeof doc.mainCategoryId === "string" ? doc.mainCategoryId : (doc.mainCategoryId as any) ?? null,
    brand: typeof doc.brand === "string" ? doc.brand : (doc.brand as any) ?? null,
    condition: typeof doc.condition === "string" ? doc.condition : (doc.condition as any) ?? null,
    partNumber: typeof doc.partNumber === "string" ? doc.partNumber : (doc.partNumber as any) ?? null,
    imageIds: Array.isArray(doc.imageIds) ? (doc.imageIds as string[]) : undefined,
    imageUrls: Array.isArray(doc.imageUrls) ? (doc.imageUrls as string[]) : undefined,
    compatibilityOptionIds: Array.isArray((doc as any).compatibilityOptionIds)
      ? (((doc as any).compatibilityOptionIds as unknown[]) as string[])
      : undefined,
    compatibilityOptions: Array.isArray((doc as any).compatibilityOptions)
      ? (((doc as any).compatibilityOptions as unknown[]) as any[])
      : undefined,
  };
}

export default function SellerEditProductPage() {
  const router = useRouter();
  const params = useParams() as { productId?: string };
  const productId = params?.productId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [compatibilityOptions, setCompatibilityOptions] = useState<CompatibilityOptionItem[]>([]);
  const [product, setProduct] = useState<SellerProduct | null>(null);

  const [replaceImages, setReplaceImages] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [selection, setSelection] = useState<CompatibilitySelection>({ compatibilityOptionIds: [] });

  const [payload, setPayload] = useState({
    name: "",
    mainCategoryId: "",
    price: "",
    stock: "",
    description: "",
    brand: "",
    condition: "",
    partNumber: "",
  });

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.label || c.name));
    return map;
  }, [categories]);

  const load = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    try {
      const [catRes, compatRes, prodRes] = await Promise.all([
        fetch("/api/seller/categories", { cache: "no-store" }),
        fetch("/api/seller/compatibility-options", { cache: "no-store" }),
        fetch(`/api/seller/products/${productId}`, { cache: "no-store" }),
      ]);

      if (!catRes.ok) {
        const body = await catRes.json().catch(() => null);
        throw new Error(body?.error || "Failed to load categories");
      }
      if (!compatRes.ok) {
        const body = await compatRes.json().catch(() => null);
        throw new Error(body?.error || "Failed to load compatibility options");
      }

      if (!prodRes.ok) {
        const body = await prodRes.json().catch(() => null);
        throw new Error(body?.error || "Failed to load product");
      }

      const catsBody = await catRes.json();
      const compatBody = await compatRes.json();
      const prodBody = await prodRes.json();

      const loadedCategories: CategoryItem[] = Array.isArray(catsBody?.items)
        ? catsBody.items
            .filter((c: any) => c && typeof c.id === "string" && typeof c.name === "string")
            .map((c: any) => ({ id: c.id, name: c.name, label: typeof c.label === "string" ? c.label : undefined }))
        : [];
      setCategories(loadedCategories);

      const loadedCompatOptions: CompatibilityOptionItem[] = Array.isArray(compatBody?.items)
        ? compatBody.items
            .filter((c: any) => c && typeof c.id === "string" && typeof c.label === "string")
            .map((c: any) => ({ id: c.id, label: c.label }))
        : [];
      setCompatibilityOptions(loadedCompatOptions);

      const normalized = normalizeProduct(prodBody?.product);
      if (!normalized) throw new Error("Invalid product payload");

      setProduct(normalized);

      setPayload({
        name: normalized.name || "",
        mainCategoryId: normalized.mainCategoryId || "",
        price: normalized.price == null ? "" : String(normalized.price),
        stock: normalized.stock == null ? "" : String(normalized.stock),
        description: normalized.description || "",
        brand: normalized.brand || "",
        condition: normalized.condition || "",
        partNumber: normalized.partNumber || "",
      });

      const ids = Array.isArray(normalized.compatibilityOptionIds) ? normalized.compatibilityOptionIds : [];
      setSelection({ compatibilityOptionIds: ids });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const canSave = Boolean(payload.name.trim() && payload.mainCategoryId && payload.price !== "" && payload.stock !== "");

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId || !canSave) return;

    setSaving(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("name", payload.name);
      form.set("description", payload.description);
      form.set("price", payload.price);
      form.set("stock", payload.stock);
      form.set("mainCategoryId", payload.mainCategoryId);
      form.set("brand", payload.brand);
      form.set("condition", payload.condition);
      form.set("partNumber", payload.partNumber);

      form.set("compatibilityOptionIds", JSON.stringify(selection.compatibilityOptionIds));

      if (replaceImages) {
        form.set("replaceImages", "true");
        images.forEach((file) => form.append("images", file));
      }

      const res = await fetch(`/api/seller/products/${productId}`, { method: "PATCH", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save");

      const updated = normalizeProduct(body?.product);
      setProduct(updated);
      setImages([]);
      setReplaceImages(false);

      router.replace(`/seller/products/${productId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!productId) return;
    const ok = typeof window !== "undefined" ? window.confirm("Delete this product? This cannot be undone.") : true;
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to delete");
      router.replace("/seller/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const currentCategoryName = product?.mainCategoryId ? categoryLabelById.get(product.mainCategoryId) : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff" }}>
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <div>
              <Typography variant="h6" fontWeight={900}>
                Edit product
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
                <Chip label={productId} size="small" variant="outlined" />
                {currentCategoryName && <Chip label={currentCategoryName} size="small" />}
              </Stack>
            </div>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button component={Link} href="/seller/products" variant="outlined" color="inherit">
                Back
              </Button>
              <Button onClick={onDelete} variant="outlined" color="error" disabled={saving || loading}>
                Delete
              </Button>
              <Button type="submit" form="edit-product-form" variant="contained" disableElevation disabled={!canSave || saving || loading}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Box>
        <Divider />

        {error && (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Paper variant="outlined" sx={{ borderColor: "#fecaca", bgcolor: "#fff1f2", p: 1.5, borderRadius: 2 }}>
              <Typography variant="body2" color="#991b1b" fontWeight={800}>
                {error}
              </Typography>
            </Paper>
          </Box>
        )}

        {loading ? (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : !product ? (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Product not found or you don’t have access.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2.5 }}>
            <Paper
              elevation={0}
              sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, display: "grid", gap: 2, bgcolor: "#fff" }}
              component="form"
              id="edit-product-form"
              onSubmit={onSave}
            >
              <Typography variant="subtitle1" fontWeight={900}>
                Details
              </Typography>
              <Divider />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2 }}>
                <Stack spacing={2}>
                  <TextField label="Product name" value={payload.name} onChange={(e) => setPayload((p) => ({ ...p, name: e.target.value }))} required />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Category"
                      value={payload.mainCategoryId}
                      onChange={(e) => setPayload((p) => ({ ...p, mainCategoryId: e.target.value }))}
                      required
                      select
                      fullWidth
                    >
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.label || c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField label="Price" type="number" value={payload.price} onChange={(e) => setPayload((p) => ({ ...p, price: e.target.value }))} required />
                    <TextField label="Stock" type="number" value={payload.stock} onChange={(e) => setPayload((p) => ({ ...p, stock: e.target.value }))} required />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField label="Brand" value={payload.brand} onChange={(e) => setPayload((p) => ({ ...p, brand: e.target.value }))} fullWidth />
                    <TextField
                      label="Condition"
                      value={payload.condition}
                      onChange={(e) => setPayload((p) => ({ ...p, condition: e.target.value }))}
                      select
                      fullWidth
                    >
                      <MenuItem value="">(Optional)</MenuItem>
                      {CONDITIONS.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField label="Part number" value={payload.partNumber} onChange={(e) => setPayload((p) => ({ ...p, partNumber: e.target.value }))} fullWidth />
                  </Stack>

                  <TextField label="Description" value={payload.description} onChange={(e) => setPayload((p) => ({ ...p, description: e.target.value }))} multiline minRows={4} />

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Compatibility
                      </Typography>
                      <TextField
                        label="Compatibility options"
                        select
                        SelectProps={{
                          multiple: true,
                          value: selection.compatibilityOptionIds,
                          onChange: (e) => {
                            const value = e.target.value;
                            const ids = Array.isArray(value) ? (value as string[]) : [String(value)];
                            setSelection({ compatibilityOptionIds: ids });
                          },
                          renderValue: (selected) => {
                            const ids = selected as string[];
                            const labels = ids
                              .map((id) => compatibilityOptions.find((o) => o.id === id)?.label)
                              .filter(Boolean);
                            return labels.length ? labels.join(", ") : "None";
                          },
                        }}
                        helperText="Seller selects options (admin-managed)."
                        fullWidth
                      >
                        {compatibilityOptions.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>
                  </Paper>
                </Stack>

                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Current images
                      </Typography>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {!product.imageUrls?.length && <Chip label="No images" size="small" />}
                        {(product.imageUrls || []).map((src) => (
                          <Box key={src} sx={{ width: 96, height: 96, position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ece8de" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Product image" className="h-full w-full object-cover" />
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Replace images
                      </Typography>
                      <FormControlLabel
                        control={<Checkbox checked={replaceImages} onChange={(e) => setReplaceImages(e.target.checked)} />}
                        label="Replace all images with newly uploaded ones"
                      />
                      <Button variant="outlined" component="label" fullWidth disabled={!replaceImages}>
                        Upload new images
                        <input hidden accept="image/*" multiple type="file" onChange={(e) => setImages(e.target.files ? Array.from(e.target.files) : [])} />
                      </Button>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {replaceImages && imagePreviews.length === 0 && <Chip label="No new images selected" size="small" />}
                        {replaceImages &&
                          imagePreviews.map((src) => (
                            <Box key={src} sx={{ width: 96, height: 96, position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ece8de" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="New preview" className="h-full w-full object-cover" />
                            </Box>
                          ))}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        If enabled, the old images are deleted from storage after the new ones upload.
                      </Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
