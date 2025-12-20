"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SearchIcon from "@mui/icons-material/Search";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

type CategoryItem = { id: string; name: string };

type CompatibilityOptionItem = { id: string; label: string };

const CONDITIONS = ["New", "Used", "Refurbished", "Open Box"] as const;

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
  imageId?: string | null;
  imageIds?: string[];
  imageUrls?: string[];
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
    imageId: typeof doc.imageId === "string" ? doc.imageId : (doc.imageId as any) ?? null,
    imageIds: Array.isArray(doc.imageIds) ? (doc.imageIds as string[]) : undefined,
    imageUrls: Array.isArray(doc.imageUrls) ? (doc.imageUrls as string[]) : undefined,
  };
}

function stockLabel(stock: number | null | undefined) {
  if (stock == null) return { label: "Unknown", color: "default" as const };
  if (stock === 0) return { label: "Out", color: "error" as const };
  if (stock <= 5) return { label: "Low", color: "warning" as const };
  return { label: "In stock", color: "success" as const };
}

export default function SellerProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "add" ? "add" : "products";

  const setTab = (next: "products" | "add") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "add") params.set("tab", "add");
    else params.delete("tab");
    router.replace(`/seller/products?${params.toString()}`);
  };

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [category, setCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [compatibilityOptions, setCompatibilityOptions] = useState<CompatibilityOptionItem[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [compatibilityOptionIds, setCompatibilityOptionIds] = useState<string[]>([]);
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

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, compatRes, prodRes] = await Promise.all([
        fetch("/api/seller/categories", { cache: "no-store" }),
        fetch("/api/seller/compatibility-options", { cache: "no-store" }),
        fetch("/api/seller/products?limit=200", { cache: "no-store" }),
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
        throw new Error(body?.error || "Failed to load products");
      }

      const catsBody = await catRes.json();
      const compatBody = await compatRes.json();
      const prodsBody = await prodRes.json();

      const loadedCategories: CategoryItem[] = Array.isArray(catsBody?.items)
        ? catsBody.items.filter((c: any) => c && typeof c.id === "string" && typeof c.name === "string")
        : [];
      setCategories(loadedCategories);

      const loadedCompatOptions: CompatibilityOptionItem[] = Array.isArray(compatBody?.items)
        ? compatBody.items
            .filter((c: any) => c && typeof c.id === "string" && typeof c.label === "string")
            .map((c: any) => ({ id: c.id, label: c.label }))
        : [];
      setCompatibilityOptions(loadedCompatOptions);

      const loadedProducts: SellerProduct[] = Array.isArray(prodsBody?.items)
        ? prodsBody.items.map(normalizeProduct).filter(Boolean)
        : [];
      setProducts(loadedProducts as SellerProduct[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" ? true : (item.mainCategoryId || "") === category;

      const stock = typeof item.stock === "number" ? item.stock : 0;
      const matchesStock =
        stockFilter === "all"
          ? true
          : stockFilter === "in"
          ? stock > 0
          : stockFilter === "low"
          ? stock > 0 && stock <= 5
          : stockFilter === "out"
          ? stock === 0
          : true;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [category, products, search, stockFilter]);

  const resetForm = () => {
    setPayload({
      name: "",
      mainCategoryId: "",
      price: "",
      stock: "",
      description: "",
      brand: "",
      condition: "",
      partNumber: "",
    });
    setImages([]);
    setCompatibilityOptionIds([]);
  };

  const canSubmit = Boolean(payload.name.trim() && payload.mainCategoryId && payload.price && payload.stock);

  const onCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
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
      form.set("compatibilityOptionIds", JSON.stringify(compatibilityOptionIds));
      images.forEach((file) => form.append("images", file));

      const res = await fetch("/api/seller/products", { method: "POST", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error || "Failed to create product");
      }

      resetForm();
      await loadAll();
      setTab("products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (productId: string) => {
    const ok = typeof window !== "undefined" ? window.confirm("Delete this product? This cannot be undone.") : true;
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to delete");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff" }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2.5, pt: 1.25 }}
        >
          <Tab value="products" label="Products" sx={{ fontWeight: 900 }} />
          <Tab value="add" label="Add Product" sx={{ fontWeight: 900 }} />
        </Tabs>
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

        {tab === "products" ? (
          <Box sx={{ p: 2.5, display: "grid", gap: 2.5 }}>
            <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 2.5, bgcolor: "#fff" }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                <TextField
                  size="small"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1, minWidth: 240 }}
                />

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Select
                    size="small"
                    value={stockFilter}
                    onChange={(e) => setStockFilter(String(e.target.value))}
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterAltOutlinedIcon fontSize="small" />
                      </InputAdornment>
                    }
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="all">All stock</MenuItem>
                    <MenuItem value="in">In stock</MenuItem>
                    <MenuItem value="low">Low stock</MenuItem>
                    <MenuItem value="out">Out of stock</MenuItem>
                  </Select>

                  <Select size="small" value={category} onChange={(e) => setCategory(String(e.target.value))} sx={{ minWidth: 200 }}>
                    <MenuItem value="all">All categories</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>

                  <Button onClick={() => setTab("add")} startIcon={<AddBoxOutlinedIcon />} variant="contained" disableElevation>
                    Add product
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff" }}>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Products
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {loading ? "Loading..." : `Showing ${filtered.length} of ${products.length}`}
                </Typography>
              </Box>
              <Divider />
              <Table
                size="small"
                sx={{
                  "& th": { bgcolor: "#fbf9f4", fontWeight: 800, color: "#3b3325", borderColor: "#f0eae1" },
                  "& td": { borderColor: "#f3ede4" },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item) => {
                    const stock = typeof item.stock === "number" ? item.stock : 0;
                    const status = stockLabel(stock);
                    const categoryName = item.mainCategoryId ? categoryNameById.get(item.mainCategoryId) : "";

                    return (
                      <TableRow key={item.$id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                        <TableCell>{categoryName || "—"}</TableCell>
                        <TableCell align="right">${Number(item.price ?? 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{stock}</TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small" color={status.color as any} variant={status.label === "Unknown" ? "outlined" : "filled"} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Button component={Link} href={`/seller/products/${item.$id}`} size="small" variant="outlined" color="inherit" sx={{ borderRadius: 9999 }}>
                              Edit
                            </Button>
                            <Button onClick={() => onDelete(item.$id)} size="small" variant="outlined" color="error" disabled={saving} sx={{ borderRadius: 9999 }}>
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ p: 2.5 }}>
            <Paper
              elevation={0}
              sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, display: "grid", gap: 2, bgcolor: "#fff" }}
              component="form"
              onSubmit={onCreateProduct}
            >
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                <div>
                  <Typography variant="h6" fontWeight={900}>
                    Add product
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a product that belongs to your seller account.
                  </Typography>
                </div>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button variant="outlined" color="inherit" onClick={() => resetForm()} disabled={saving}>
                    Reset
                  </Button>
                  <Button variant="contained" disableElevation type="submit" disabled={!canSubmit || saving}>
                    {saving ? "Saving..." : "Create"}
                  </Button>
                </Stack>
              </Stack>

              <Divider />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2 }}>
                <Stack spacing={2}>
                  <TextField label="Product name" value={payload.name} onChange={(e) => setPayload((p) => ({ ...p, name: e.target.value }))} required />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField label="Category" value={payload.mainCategoryId} onChange={(e) => setPayload((p) => ({ ...p, mainCategoryId: e.target.value }))} required select fullWidth>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField label="Price" type="number" value={payload.price} onChange={(e) => setPayload((p) => ({ ...p, price: e.target.value }))} InputProps={{ startAdornment: <span className="mr-1 text-slate-500">$</span> as any }} required />
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

                  <TextField label="Description" value={payload.description} onChange={(e) => setPayload((p) => ({ ...p, description: e.target.value }))} placeholder="Key specs, warranty, notes" multiline minRows={4} />

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
                          value: compatibilityOptionIds,
                          onChange: (e) => {
                            const value = e.target.value;
                            setCompatibilityOptionIds(Array.isArray(value) ? (value as string[]) : [String(value)]);
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
                        Images
                      </Typography>
                      <Button variant="outlined" component="label" fullWidth>
                        Upload images
                        <input hidden accept="image/*" multiple type="file" onChange={(e) => setImages(e.target.files ? Array.from(e.target.files) : [])} />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Optional. You can upload multiple images; the first becomes the cover.
                      </Typography>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {imagePreviews.length === 0 && <Chip label="No images yet" size="small" />}
                        {imagePreviews.map((src) => (
                          <Box key={src} sx={{ width: 96, height: 96, position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ece8de" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="Preview" className="h-full w-full object-cover" />
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Products created here are always linked to your seller account and cannot be edited by other sellers.
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
