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
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SearchIcon from "@mui/icons-material/Search";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

type CategoryItem = { id: string; name: string; label?: string };

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
    description:
      typeof doc.description === "string"
        ? doc.description
        : (doc.description as any) ?? null,
    price:
      typeof doc.price === "number"
        ? doc.price
        : doc.price == null
        ? null
        : Number(doc.price),
    stock:
      typeof doc.stock === "number"
        ? doc.stock
        : doc.stock == null
        ? null
        : Number(doc.stock),
    mainCategoryId:
      typeof doc.mainCategoryId === "string"
        ? doc.mainCategoryId
        : (doc.mainCategoryId as any) ?? null,
    brand:
      typeof doc.brand === "string" ? doc.brand : (doc.brand as any) ?? null,
    condition:
      typeof doc.condition === "string"
        ? doc.condition
        : (doc.condition as any) ?? null,
    partNumber:
      typeof doc.partNumber === "string"
        ? doc.partNumber
        : (doc.partNumber as any) ?? null,
    imageId:
      typeof doc.imageId === "string"
        ? doc.imageId
        : (doc.imageId as any) ?? null,
    imageIds: Array.isArray(doc.imageIds)
      ? (doc.imageIds as string[])
      : undefined,
    imageUrls: Array.isArray(doc.imageUrls)
      ? (doc.imageUrls as string[])
      : undefined,
  };
}

function stockLabel(stock: number | null | undefined) {
  if (stock == null) return { label: "Unknown", color: "default" as const };
  if (stock === 0) return { label: "Out", color: "error" as const };
  if (stock <= 5) return { label: "Low", color: "warning" as const };
  return { label: "In stock", color: "success" as const };
}

export default function SellerProductsPage() {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [category, setCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/seller/categories", { cache: "no-store" }),
        fetch("/api/seller/products?limit=200", { cache: "no-store" }),
      ]);

      if (!catRes.ok) {
        const body = await catRes.json().catch(() => null);
        throw new Error(body?.error || "Failed to load categories");
      }

      if (!prodRes.ok) {
        const body = await prodRes.json().catch(() => null);
        throw new Error(body?.error || "Failed to load products");
      }

      const catsBody = await catRes.json();
      const prodsBody = await prodRes.json();

      const loadedCategories: CategoryItem[] = Array.isArray(catsBody?.items)
        ? catsBody.items
            .filter(
              (c: any) =>
                c && typeof c.id === "string" && typeof c.name === "string"
            )
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              label: typeof c.label === "string" ? c.label : undefined,
            }))
        : [];
      setCategories(loadedCategories);

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

  const categoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.label || c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        category === "all" ? true : (item.mainCategoryId || "") === category;

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

  const onDelete = async (productId: string) => {
    const ok =
      typeof window !== "undefined"
        ? window.confirm("Delete this product? This cannot be undone.")
        : true;
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE",
      });
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
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #ece8de",
          borderRadius: 3,
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{ p: 2.5, borderBottom: "1px solid #f0eae1", bgcolor: "#f9f7f2" }}
        >
          <Typography variant="h6" fontWeight={900}>
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your inventory, prices and stock levels.
          </Typography>
        </Box>

        {error && (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Paper
              variant="outlined"
              sx={{
                borderColor: "#fecaca",
                bgcolor: "#fff1f2",
                p: 1.5,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="#991b1b" fontWeight={800}>
                {error}
              </Typography>
            </Paper>
          </Box>
        )}

        <Box sx={{ p: 2.5, display: "grid", gap: 2.5 }}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #ece8de",
              borderRadius: 3,
              p: 2.5,
              bgcolor: "#fff",
            }}
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", lg: "center" }}
            >
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
                sx={{ flex: 1, minWidth: { xs: "100%", md: 240 } }}
              />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Select
                  size="small"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(String(e.target.value))}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterAltOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  }
                  sx={{ minWidth: { xs: "100%", sm: 140 } }}
                >
                  <MenuItem value="all">All stock</MenuItem>
                  <MenuItem value="in">In stock</MenuItem>
                  <MenuItem value="low">Low stock</MenuItem>
                  <MenuItem value="out">Out of stock</MenuItem>
                </Select>

                <Select
                  size="small"
                  value={category}
                  onChange={(e) => setCategory(String(e.target.value))}
                  sx={{ minWidth: { xs: "100%", sm: 160 } }}
                >
                  <MenuItem value="all">All categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.label || c.name}
                    </MenuItem>
                  ))}
                </Select>

                <Button
                  component={Link}
                  href="/seller/products/new"
                  startIcon={<AddBoxOutlinedIcon />}
                  variant="contained"
                  disableElevation
                  sx={{ color: "#fff", fontWeight: 700, borderRadius: 2 }}
                >
                  Add product
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #ece8de",
              borderRadius: 3,
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 2,
                bgcolor: "#fbf9f4",
                borderBottom: "1px solid #f0eae1",
              }}
            >
              <Typography variant="subtitle2" fontWeight={900}>
                {loading ? "Refreshing..." : `Products (${filtered.length})`}
              </Typography>
            </Box>
            <Box sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  minWidth: 800,
                  "& th": {
                    bgcolor: "#fbf9f4",
                    fontWeight: 800,
                    color: "#3b3325",
                    borderColor: "#f0eae1",
                    py: 1.5,
                  },
                  "& td": { borderColor: "#f3ede4", py: 1.5 },
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
                  {loading && products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={24} color="warning" />
                        <Typography
                          variant="body2"
                          sx={{ mt: 1 }}
                          color="text.secondary"
                        >
                          Fetching products...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">
                          No products found matching your search.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => {
                      const stock =
                        typeof item.stock === "number" ? item.stock : 0;
                      const status = stockLabel(stock);
                      const categoryName = item.mainCategoryId
                        ? categoryLabelById.get(item.mainCategoryId)
                        : "";

                      return (
                        <TableRow key={item.$id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {item.name}
                            </Typography>
                            {item.brand && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.brand}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{categoryName || "—"}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={800}>
                              ${Number(item.price ?? 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{stock}</TableCell>
                          <TableCell>
                            <Chip
                              label={status.label}
                              size="small"
                              color={status.color as any}
                              variant={
                                status.label === "Unknown"
                                  ? "outlined"
                                  : "filled"
                              }
                              sx={{ fontWeight: 700, borderRadius: 1.5 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              spacing={1}
                            >
                              <Button
                                component={Link}
                                href={`/seller/products/${item.$id}`}
                                size="small"
                                variant="outlined"
                                color="inherit"
                                sx={{
                                  borderRadius: 1.5,
                                  fontWeight: 700,
                                  textTransform: "none",
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => onDelete(item.$id)}
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={saving}
                                sx={{
                                  borderRadius: 1.5,
                                  fontWeight: 700,
                                  textTransform: "none",
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
}
