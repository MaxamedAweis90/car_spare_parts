"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";

type CategoryItem = { id: string; name: string; label?: string };

type CompatibilityOptionItem = { id: string; label: string };

const CONDITIONS = ["New", "Used", "Refurbished", "Open Box"] as const;

const MAX_IMAGES = 6;
const DRAFT_KEY = "seller:add-product-draft:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v))
    .map((v) => v.trim())
    .filter(Boolean);
}

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export default function SellerAddProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [compatibilityOptions, setCompatibilityOptions] = useState<
    CompatibilityOptionItem[]
  >([]);
  const [compatibilityOptionIds, setCompatibilityOptionIds] = useState<
    string[]
  >([]);

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
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isRecord(parsed)) return;

      const draftPayload = isRecord(parsed.payload) ? parsed.payload : null;
      const draftCompat = normalizeStringArray(parsed.compatibilityOptionIds);

      if (draftPayload) {
        setPayload({
          name: normalizeString(draftPayload.name),
          mainCategoryId: normalizeString(draftPayload.mainCategoryId),
          price: normalizeString(draftPayload.price),
          stock: normalizeString(draftPayload.stock),
          description: normalizeString(draftPayload.description),
          brand: normalizeString(draftPayload.brand),
          condition: normalizeString(draftPayload.condition),
          partNumber: normalizeString(draftPayload.partNumber),
        });
      }
      if (draftCompat.length) setCompatibilityOptionIds(draftCompat);
      setNotice("Draft restored (images are not included).");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [catRes, compatRes] = await Promise.all([
          fetch("/api/seller/categories", { cache: "no-store" }),
          fetch("/api/seller/compatibility-options", { cache: "no-store" }),
        ]);

        if (!catRes.ok) {
          const body = await catRes.json().catch(() => null);
          throw new Error(body?.error || "Failed to load categories");
        }
        if (!compatRes.ok) {
          const body = await compatRes.json().catch(() => null);
          throw new Error(
            body?.error || "Failed to load compatibility options"
          );
        }

        const catsBody = await catRes.json();
        const compatBody = await compatRes.json();

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

        const loadedCompatOptions: CompatibilityOptionItem[] = Array.isArray(
          compatBody?.items
        )
          ? compatBody.items
              .filter(
                (c: any) =>
                  c && typeof c.id === "string" && typeof c.label === "string"
              )
              .map((c: any) => ({ id: c.id, label: c.label }))
          : [];
        setCompatibilityOptions(loadedCompatOptions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
        setCategories([]);
        setCompatibilityOptions([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAll();
  }, []);

  const canSubmit = useMemo(() => {
    return Boolean(
      payload.name.trim() &&
        payload.mainCategoryId &&
        payload.price !== "" &&
        payload.stock !== ""
    );
  }, [payload]);

  const categoryValue = useMemo(() => {
    const id = payload.mainCategoryId;
    if (!id) return null;
    return categories.find((c) => c.id === id) ?? null;
  }, [categories, payload.mainCategoryId]);

  const selectedCompatibilityOptions = useMemo(() => {
    if (!compatibilityOptionIds.length) return [] as CompatibilityOptionItem[];
    const selected = new Set(compatibilityOptionIds);
    return compatibilityOptions.filter((o) => selected.has(o.id));
  }, [compatibilityOptionIds, compatibilityOptions]);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    setNotice(null);

    const incoming = Array.from(files);
    const existingKeys = new Set(images.map(fileKey));
    const uniqueIncoming = incoming.filter(
      (f) => !existingKeys.has(fileKey(f))
    );

    const room = Math.max(0, MAX_IMAGES - images.length);
    const next = [...images, ...uniqueIncoming.slice(0, room)];

    if (images.length + uniqueIncoming.length > MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} images.`);
    }

    setImages(next);
    if (images.length === 0 && next.length > 0) setMainImageIndex(0);
  };

  const removeImage = (index: number) => {
    if (index < 0 || index >= images.length) return;
    setError(null);
    setNotice(null);

    const mainFile = images[mainImageIndex] ?? null;
    const next = images.filter((_, idx) => idx !== index);
    setImages(next);

    if (!next.length) {
      setMainImageIndex(0);
      return;
    }

    if (mainFile && next.includes(mainFile))
      setMainImageIndex(next.indexOf(mainFile));
    else setMainImageIndex(0);
  };

  const moveImage = (from: number, to: number) => {
    if (from < 0 || to < 0 || from >= images.length || to >= images.length)
      return;
    if (from === to) return;
    setError(null);
    setNotice(null);

    const mainFile = images[mainImageIndex] ?? null;
    const next = images.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next);

    if (mainFile && next.includes(mainFile))
      setMainImageIndex(next.indexOf(mainFile));
    else setMainImageIndex(0);
  };

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
    setCompatibilityOptionIds([]);
    setImages([]);
    setMainImageIndex(0);
    setNotice(null);
  };

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          payload,
          compatibilityOptionIds,
          savedAt: new Date().toISOString(),
        })
      );
      setError(null);
      setNotice("Draft saved (images are not included).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save draft");
    }
  };

  useEffect(() => {
    if (mainImageIndex < 0) setMainImageIndex(0);
    if (mainImageIndex >= images.length && images.length > 0)
      setMainImageIndex(0);
  }, [images.length, mainImageIndex]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;

    setSaving(true);
    setError(null);
    setNotice(null);
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
        JSON.stringify(compatibilityOptionIds)
      );

      const orderedImages = images.length
        ? [
            images[mainImageIndex],
            ...images.filter((_, idx) => idx !== mainImageIndex),
          ]
        : [];
      orderedImages.forEach((file) => form.append("images", file));

      const res = await fetch("/api/seller/products", {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to create product");

      resetForm();
      router.replace("/seller/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper
        elevation={0}
        sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff" }}
      >
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Add product
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add product details, choose category and compatibility, then
                upload images.
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              justifyContent={{ xs: "center", sm: "flex-end" }}
            >
              <Button
                variant="outlined"
                color="inherit"
                onClick={saveDraft}
                disabled={saving}
                size="small"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Save draft
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetForm}
                disabled={saving}
                size="small"
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                disableElevation
                type="submit"
                form="seller-add-product-form"
                disabled={!canSubmit || saving || loading}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {saving ? "Creating..." : "Create"}
              </Button>
            </Stack>
          </Stack>
        </Box>
        <Divider />

        {(error || notice || loading) && (
          <Box sx={{ px: 2.5, py: 1.5 }}>
            <Paper
              variant="outlined"
              sx={{
                borderColor: error ? "#fecaca" : notice ? "#fde68a" : "#ece8de",
                bgcolor: error ? "#fff1f2" : notice ? "#fffbeb" : "#fff",
                p: 1.5,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                {loading && (
                  <CircularProgress size={18} sx={{ color: "#c56a1b" }} />
                )}
                <Typography
                  variant="body2"
                  color={
                    error ? "#991b1b" : notice ? "#92400e" : "text.secondary"
                  }
                  fontWeight={800}
                >
                  {error
                    ? error
                    : notice
                    ? notice
                    : "Loading categories and compatibility options..."}
                </Typography>
              </Stack>
            </Paper>
          </Box>
        )}

        <Box
          component="form"
          id="seller-add-product-form"
          onSubmit={onSubmit}
          sx={{ p: 2.5, display: "grid", gap: 2.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #ece8de",
              borderRadius: 3,
              p: 3,
              bgcolor: "#fff",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={900}>
                1) Images
              </Typography>

              <Button
                variant="outlined"
                component="label"
                sx={{ width: { xs: "100%", sm: 240 } }}
                disabled={saving}
              >
                Upload images (max 6)
                <input
                  hidden
                  accept="image/*"
                  multiple
                  type="file"
                  onChange={(e) => handleImages(e.target.files)}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                Choose the main image — it will be used as the product cover.
              </Typography>

              <Stack direction="row" gap={1.5} flexWrap="wrap" sx={{ mt: 1 }}>
                {imagePreviews.length === 0 && (
                  <Box
                    sx={{
                      py: 3,
                      px: 2,
                      border: "2px dashed #ece8de",
                      borderRadius: 3,
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No images selected
                    </Typography>
                  </Box>
                )}

                {imagePreviews.map((src, idx) => {
                  const isMain = idx === mainImageIndex;
                  return (
                    <Box
                      key={src}
                      sx={{
                        width: 110,
                        borderRadius: 2,
                        border: isMain
                          ? "2px solid #c56a1b"
                          : "1px solid #ece8de",
                        overflow: "hidden",
                        bgcolor: "#fff",
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: 110,
                          bgcolor: "#fbf9f4",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={images[idx]?.name || `Image ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {isMain && (
                          <Box sx={{ position: "absolute", left: 8, top: 8 }}>
                            <Chip
                              label="Main"
                              size="small"
                              sx={{ fontWeight: 800, bgcolor: "#fff" }}
                            />
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ p: 1, display: "grid", gap: 1 }}>
                        <Button
                          variant={isMain ? "contained" : "outlined"}
                          disableElevation
                          size="small"
                          fullWidth
                          onClick={() => setMainImageIndex(idx)}
                          disabled={saving}
                        >
                          {isMain ? "Main image" : "Make main"}
                        </Button>

                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={() => moveImage(idx, idx - 1)}
                            disabled={saving || idx === 0}
                          >
                            Left
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={() => moveImage(idx, idx + 1)}
                            disabled={
                              saving || idx === imagePreviews.length - 1
                            }
                          >
                            Right
                          </Button>
                        </Stack>

                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => removeImage(idx)}
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #ece8de",
              borderRadius: 3,
              p: 3,
              bgcolor: "#fff",
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={900}>
                2) Basic info
              </Typography>

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
                  label="Price"
                  type="number"
                  value={payload.price}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, price: e.target.value }))
                  }
                  InputProps={{
                    startAdornment: (
                      <span className="mr-1 text-slate-500">$</span>
                    ) as any,
                  }}
                  required
                  fullWidth
                />
                <TextField
                  label="Stock"
                  type="number"
                  value={payload.stock}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, stock: e.target.value }))
                  }
                  required
                  fullWidth
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
                    setPayload((p) => ({ ...p, partNumber: e.target.value }))
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
                placeholder="Key specs, warranty, notes"
                multiline
                minRows={4}
              />
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #ece8de",
              borderRadius: 3,
              p: 3,
              bgcolor: "#fff",
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={900}>
                3) Category & compatibility
              </Typography>

              <Autocomplete
                options={categories}
                value={categoryValue}
                onChange={(_, next) => {
                  setPayload((p) => ({ ...p, mainCategoryId: next?.id ?? "" }));
                }}
                getOptionLabel={(option) => option.label || option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category (sellable)"
                    required
                    helperText="Type to search categories."
                  />
                )}
              />

              <Autocomplete
                multiple
                options={compatibilityOptions}
                value={selectedCompatibilityOptions}
                onChange={(_, next) => {
                  setCompatibilityOptionIds(next.map((o) => o.id));
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterSelectedOptions
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Compatibility options"
                    helperText="Type to search, select multiple (admin-managed)."
                  />
                )}
              />
            </Stack>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
}
