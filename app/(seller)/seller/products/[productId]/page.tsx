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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { ProductGallery } from "@/components/features/products/ProductGallery";
import ProductCard from "@/components/features/products/ProductCard";
import { getProductImageUrl } from "@/lib/utils/product-image";

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

type ManagedImage =
  | { type: "existing"; id: string; url: string }
  | { type: "new"; file: File; url: string; tempId: string };

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
        : ((doc.description as any) ?? null),
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
        : ((doc.mainCategoryId as any) ?? null),
    brand:
      typeof doc.brand === "string" ? doc.brand : ((doc.brand as any) ?? null),
    condition:
      typeof doc.condition === "string"
        ? doc.condition
        : ((doc.condition as any) ?? null),
    partNumber:
      typeof doc.partNumber === "string"
        ? doc.partNumber
        : ((doc.partNumber as any) ?? null),
    imageIds: Array.isArray(doc.imageIds)
      ? (doc.imageIds as string[])
      : undefined,
    imageUrls: Array.isArray(doc.imageUrls)
      ? (doc.imageUrls as string[])
      : undefined,
    compatibilityOptionIds: Array.isArray((doc as any).compatibilityOptionIds)
      ? ((doc as any).compatibilityOptionIds as unknown[] as string[])
      : undefined,
    compatibilityOptions: Array.isArray((doc as any).compatibilityOptions)
      ? ((doc as any).compatibilityOptions as unknown[] as any[])
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
  const [compatibilityOptions, setCompatibilityOptions] = useState<
    CompatibilityOptionItem[]
  >([]);
  const [product, setProduct] = useState<SellerProduct | null>(null);

  const [managedImages, setManagedImages] = useState<ManagedImage[]>([]);
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);
  const [galleryPreviewOpen, setGalleryPreviewOpen] = useState(false);

  const [selection, setSelection] = useState<CompatibilitySelection>({
    compatibilityOptionIds: [],
  });

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
    return () => {
      managedImages.forEach((img) => {
        if (img.type === "new") {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [managedImages]);

  const previewUrls = useMemo(() => {
    return managedImages.map((img) => img.url);
  }, [managedImages]);

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
            .filter(
              (c: any) =>
                c && typeof c.id === "string" && typeof c.name === "string",
            )
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              label: typeof c.label === "string" ? c.label : undefined,
            }))
        : [];
      setCategories(loadedCategories);

      const loadedCompatOptions: CompatibilityOptionItem[] = Array.isArray(
        compatBody?.items,
      )
        ? compatBody.items
            .filter(
              (c: any) =>
                c && typeof c.id === "string" && typeof c.label === "string",
            )
            .map((c: any) => ({ id: c.id, label: c.label }))
        : [];
      setCompatibilityOptions(loadedCompatOptions);

      const normalized = normalizeProduct(prodBody?.product);
      if (!normalized) throw new Error("Invalid product payload");

      setProduct(normalized);

      const loadedImages: ManagedImage[] = [];
      if (normalized.imageIds && normalized.imageUrls) {
        normalized.imageIds.forEach((id, idx) => {
          const url = normalized.imageUrls?.[idx];
          if (url) loadedImages.push({ type: "existing", id, url });
        });
      }
      setManagedImages(loadedImages);

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

      const ids = Array.isArray(normalized.compatibilityOptionIds)
        ? normalized.compatibilityOptionIds
        : [];
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

  const canSave = Boolean(
    payload.name.trim() &&
    payload.mainCategoryId &&
    payload.price !== "" &&
    payload.stock !== "",
  );

  const handleAddNew = (files: FileList | null) => {
    if (!files) return;
    const currentCount = managedImages.length;
    const remaining = 6 - currentCount;
    if (remaining <= 0) return;

    const incoming = Array.from(files).slice(0, remaining);
    const newItems: ManagedImage[] = incoming.map((file) => ({
      type: "new",
      file,
      url: URL.createObjectURL(file),
      tempId: `new-${Math.random().toString(36).substr(2, 9)}`,
    }));
    setManagedImages((prev) => [...prev, ...newItems]);
  };

  const handleRemoveImage = (index: number) => {
    setManagedImages((prev) => {
      const next = [...prev];
      const removed = next[index];
      if (removed.type === "new") URL.revokeObjectURL(removed.url);
      next.splice(index, 1);
      return next;
    });
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    setManagedImages((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleReplaceImage = (index: number, file: File) => {
    setManagedImages((prev) => {
      const next = [...prev];
      const old = next[index];
      if (old.type === "new") URL.revokeObjectURL(old.url);
      next[index] = {
        type: "new",
        file,
        url: URL.createObjectURL(file),
        tempId: `replace-${Math.random().toString(36).substr(2, 9)}`,
      };
      return next;
    });
  };

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

      form.set(
        "compatibilityOptionIds",
        JSON.stringify(selection.compatibilityOptionIds),
      );

      // New Image Logic: Send Manifest for Reordering
      const newFiles: File[] = [];
      const manifest = managedImages.map((img) => {
        if (img.type === "existing") return img.id;
        const fileIndex = newFiles.length;
        newFiles.push(img.file);
        return `NEW_${fileIndex}`;
      });

      form.set("keptImageIds", JSON.stringify(manifest));
      newFiles.forEach((file) => form.append("images", file));

      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PATCH",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to save");

      const updated = normalizeProduct(body?.product);
      setProduct(updated);

      // Reset image state with updated product data
      const updatedImages: ManagedImage[] = [];
      if (updated?.imageIds && updated?.imageUrls) {
        updated.imageIds.forEach((id, idx) => {
          const url = updated.imageUrls?.[idx];
          if (url) updatedImages.push({ type: "existing", id, url });
        });
      }
      setManagedImages(updatedImages);

      router.replace(`/seller/products/${productId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!productId) return;
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
      router.replace("/seller/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const currentCategoryName = product?.mainCategoryId
    ? categoryLabelById.get(product.mainCategoryId)
    : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper
        elevation={0}
        sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff" }}
      >
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <div>
              <Typography variant="h6" fontWeight={900}>
                Edit product
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 0.5, flexWrap: "wrap" }}
              >
                <Chip label={productId} size="small" variant="outlined" />
                {currentCategoryName && (
                  <Chip label={currentCategoryName} size="small" />
                )}
              </Stack>
            </div>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                component={Link}
                href="/seller/products"
                variant="outlined"
                color="inherit"
              >
                Back
              </Button>
              <Button
                onClick={onDelete}
                variant="outlined"
                color="error"
                disabled={saving || loading}
              >
                Delete
              </Button>
              <Button
                type="submit"
                form="edit-product-form"
                variant="contained"
                disableElevation
                disabled={!canSave || saving || loading}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Stack>
          </Stack>
        </Box>
        <Divider />

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
              sx={{
                border: "1px solid #ece8de",
                borderRadius: 3,
                p: 3,
                display: "grid",
                gap: 2,
                bgcolor: "#fff",
              }}
              component="form"
              id="edit-product-form"
              onSubmit={onSave}
            >
              <Typography variant="subtitle1" fontWeight={900}>
                Details
              </Typography>
              <Divider />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                  gap: 2,
                }}
              >
                <Stack spacing={2}>
                  <TextField
                    label="Product name"
                    value={payload.name}
                    onChange={(e) =>
                      setPayload((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Category"
                      value={payload.mainCategoryId}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          mainCategoryId: e.target.value,
                        }))
                      }
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
                    <TextField
                      label="Price"
                      type="number"
                      value={payload.price}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, price: e.target.value }))
                      }
                      required
                    />
                    <TextField
                      label="Stock"
                      type="number"
                      value={payload.stock}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, stock: e.target.value }))
                      }
                      required
                    />
                  </Stack>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Brand"
                      value={payload.brand}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, brand: e.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Condition"
                      value={payload.condition}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, condition: e.target.value }))
                      }
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
                    <TextField
                      label="Part number"
                      value={payload.partNumber}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          partNumber: e.target.value,
                        }))
                      }
                      fullWidth
                    />
                  </Stack>

                  <TextField
                    label="Description"
                    value={payload.description}
                    onChange={(e) =>
                      setPayload((p) => ({ ...p, description: e.target.value }))
                    }
                    multiline
                    minRows={4}
                  />

                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}
                  >
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
                            const ids = Array.isArray(value)
                              ? (value as string[])
                              : [String(value)];
                            setSelection({ compatibilityOptionIds: ids });
                          },
                          renderValue: (selected) => {
                            const ids = selected as string[];
                            const labels = ids
                              .map(
                                (id) =>
                                  compatibilityOptions.find((o) => o.id === id)
                                    ?.label,
                              )
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
                  {/* Preview Section */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      borderColor: "#ece8de",
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={800} mb={2}>
                      Visual Previews
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<i className="fa-solid fa-id-card" />}
                        onClick={() => setCardPreviewOpen(true)}
                        fullWidth
                      >
                        Show Card
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<i className="fa-solid fa-images" />}
                        onClick={() => setGalleryPreviewOpen(true)}
                        fullWidth
                      >
                        Show Previewer
                      </Button>
                    </Stack>
                  </Paper>

                  {/* Image Management */}
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}
                  >
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          mb: 1,
                          p: 1.5,
                          bgcolor: "#f0f7ff",
                          borderRadius: 2,
                          border: "1px solid #d0e7ff",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="primary.dark"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            fontWeight: 700,
                          }}
                        >
                          <i className="fa-solid fa-circle-info" />
                          Image Requirements:
                        </Typography>
                        <ul
                          style={{
                            margin: "4px 0 0 16px",
                            padding: 0,
                            fontSize: "11px",
                            color: "#444",
                          }}
                        >
                          <li>
                            Maximum <b>6 images</b> allowed.
                          </li>
                          <li>
                            Recommended size: At least <b>800x800px</b>.
                          </li>
                          <li>
                            Aspect Ratio: <b>1:1 (Square)</b> is best.
                          </li>
                          <li>
                            First image will be the <b>Main Cover</b>.
                          </li>
                        </ul>
                      </Box>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" fontWeight={800}>
                          Manage Gallery ({managedImages.length}/6)
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          component="label"
                          startIcon={<i className="fa-solid fa-plus" />}
                          disableElevation
                          disabled={managedImages.length >= 6}
                        >
                          Add Images
                          <input
                            hidden
                            accept="image/*"
                            multiple
                            type="file"
                            onChange={(e) => handleAddNew(e.target.files)}
                            disabled={managedImages.length >= 6}
                          />
                        </Button>
                      </Stack>

                      <Stack spacing={1}>
                        {managedImages.map((img, idx) => (
                          <Paper
                            key={img.type === "existing" ? img.id : img.tempId}
                            variant="outlined"
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 1.5,
                                overflow: "hidden",
                                border: "1px solid #eee",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={img.url}
                                alt="Gallery item"
                                className="h-full w-full object-cover"
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                color="text.secondary"
                              >
                                {img.type === "existing" ? "EXISTING" : "NEW"}
                              </Typography>
                              {idx === 0 && (
                                <Chip
                                  label="Main"
                                  size="small"
                                  color="primary"
                                  sx={{
                                    ml: 1,
                                    height: 16,
                                    fontSize: 10,
                                    fontWeight: 800,
                                  }}
                                />
                              )}
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Move Up">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveImage(idx, "up")}
                                    disabled={idx === 0}
                                  >
                                    <i className="fa-solid fa-chevron-up text-xs" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move Down">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveImage(idx, "down")}
                                    disabled={idx === managedImages.length - 1}
                                  >
                                    <i className="fa-solid fa-chevron-down text-xs" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Replace Image">
                                <IconButton size="small" component="label">
                                  <i className="fa-solid fa-sync text-xs" />
                                  <input
                                    hidden
                                    accept="image/*"
                                    type="file"
                                    onChange={(e) => {
                                      if (e.target.files?.[0])
                                        handleReplaceImage(
                                          idx,
                                          e.target.files[0],
                                        );
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveImage(idx)}
                                >
                                  <i className="fa-solid fa-trash text-xs" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>

                      {managedImages.length === 0 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{ py: 2 }}
                        >
                          No images added yet. At least one image is
                          recommended.
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Card Preview Modal */}
      <Dialog
        open={cardPreviewOpen}
        onClose={() => setCardPreviewOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Product Card Preview</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <div className="h-[320px] w-[240px]">
              <ProductCard
                id={productId || "preview"}
                name={payload.name || "Product Name"}
                price={Number(payload.price) || 0}
                imageUrl={previewUrls[0] || null}
                stock={Number(payload.stock) || 0}
                href="#"
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCardPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Gallery Preview Modal */}
      <Dialog
        open={galleryPreviewOpen}
        onClose={() => setGalleryPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Product Gallery Preview
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 2 }}>
            <ProductGallery
              name={payload.name || "Product Name"}
              previewUrls={previewUrls}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGalleryPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
