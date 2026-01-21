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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import { ProductGallery } from "@/components/features/products/ProductGallery";
import ProductCard from "@/components/features/products/ProductCard";

type CategoryItem = { id: string; name: string; label?: string };
type CompatibilityOptionItem = { id: string; label: string };
const CONDITIONS = ["New", "Used", "Refurbished", "Open Box"] as const;

type ManagedImage =
  | { type: "existing"; id: string; url: string }
  | { type: "new"; file: File; url: string; tempId: string };

export default function SellerAddProductPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [compatibilityOptions, setCompatibilityOptions] = useState<
    CompatibilityOptionItem[]
  >([]);

  const [managedImages, setManagedImages] = useState<ManagedImage[]>([]);
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);
  const [galleryPreviewOpen, setGalleryPreviewOpen] = useState(false);

  const [payload, setPayload] = useState({
    name: "",
    mainCategoryId: "",
    price: "",
    stock: "",
    description: "",
    brand: "",
    condition: "New",
    partNumber: "",
  });

  const [selection, setSelection] = useState({
    compatibilityOptionIds: [] as string[],
  });

  useEffect(() => {
    async function loadResources() {
      try {
        const [catsRes, compatRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/compatibility-options"),
        ]);
        const [catsBody, compatBody] = await Promise.all([
          catsRes.json(),
          compatRes.json(),
        ]);
        setCategories(catsBody?.items || []);
        setCompatibilityOptions(compatBody?.items || []);
      } catch (e) {
        console.error("Failed to load resources", e);
      }
    }
    loadResources();
  }, []);

  useEffect(() => {
    return () => {
      managedImages.forEach((img) => {
        if (img.type === "new") {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [managedImages.length]); // Use length or some other simple trigger

  const previewUrls = useMemo(() => {
    return managedImages.map((img) => img.url);
  }, [managedImages]);

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
    if (
      !payload.name.trim() ||
      !payload.mainCategoryId ||
      payload.price === "" ||
      payload.stock === "" ||
      managedImages.length === 0
    ) {
      setError(
        "Please fill in all required fields and add at least one image.",
      );
      return;
    }

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

      // Append images in the current managed order
      managedImages.forEach((img) => {
        if (img.type === "new") {
          form.append("images", img.file);
        }
      });

      const res = await fetch("/api/seller/products", {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Failed to create product");

      router.push("/seller/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", py: 4, px: 2 }}>
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 4, border: "1px solid #eee" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          mb={4}
        >
          <Box>
            <Typography variant="h4" fontWeight={900} color="primary.main">
              New Product
            </Typography>
            <Typography variant="body1" color="text.secondary">
              List a new item in your store
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={saving}
              onClick={onSave}
              sx={{
                borderRadius: 2,
                px: 4,
                boxShadow: "0 4px 14px 0 rgba(0,118,255,0.39)",
              }}
            >
              {saving ? "Creating..." : "Publish Product"}
            </Button>
          </Stack>
        </Stack>

        {error && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "#fff1f0",
              border: "1px solid #ffa39e",
              borderRadius: 2,
            }}
          >
            <Typography color="error.dark" fontWeight={700}>
              {error}
            </Typography>
          </Box>
        )}

        <Box
          component="form"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          <Paper
            variant="outlined"
            className="lg:col-span-8"
            sx={{ p: 3, borderRadius: 3, borderColor: "#ece8de" }}
          >
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={800}>
                Core Details
              </Typography>
              <TextField
                label="Product Name"
                fullWidth
                required
                value={payload.name}
                onChange={(e) =>
                  setPayload({ ...payload, name: e.target.value })
                }
                placeholder="e.g. Brake Pad Set for Ford Mustang"
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Category"
                  select
                  fullWidth
                  required
                  value={payload.mainCategoryId}
                  onChange={(e) =>
                    setPayload({ ...payload, mainCategoryId: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Condition"
                  select
                  fullWidth
                  value={payload.condition}
                  onChange={(e) =>
                    setPayload({ ...payload, condition: e.target.value })
                  }
                >
                  {CONDITIONS.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Price (USD)"
                  type="number"
                  fullWidth
                  required
                  value={payload.price}
                  onChange={(e) =>
                    setPayload({ ...payload, price: e.target.value })
                  }
                />
                <TextField
                  label="Initial Stock"
                  type="number"
                  fullWidth
                  required
                  value={payload.stock}
                  onChange={(e) =>
                    setPayload({ ...payload, stock: e.target.value })
                  }
                />
              </Stack>
              <TextField
                label="Description"
                multiline
                rows={4}
                fullWidth
                value={payload.description}
                onChange={(e) =>
                  setPayload({ ...payload, description: e.target.value })
                }
              />
              <Divider />
              <Typography variant="h6" fontWeight={800}>
                Extra Info
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Brand"
                  fullWidth
                  value={payload.brand}
                  onChange={(e) =>
                    setPayload({ ...payload, brand: e.target.value })
                  }
                />
                <TextField
                  label="Part Number"
                  fullWidth
                  value={payload.partNumber}
                  onChange={(e) =>
                    setPayload({ ...payload, partNumber: e.target.value })
                  }
                />
              </Stack>
              <TextField
                label="Compatibility"
                select
                fullWidth
                SelectProps={{
                  multiple: true,
                  value: selection.compatibilityOptionIds,
                  onChange: (e) => {
                    setSelection({
                      compatibilityOptionIds: e.target.value as string[],
                    });
                  },
                  renderValue: (selected) => {
                    const ids = selected as string[];
                    return ids
                      .map(
                        (id) =>
                          compatibilityOptions.find((o) => o.id === id)?.label,
                      )
                      .filter(Boolean)
                      .join(", ");
                  },
                }}
              >
                {compatibilityOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          <Box className="lg:col-span-4">
            <Stack spacing={3}>
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
                    disabled={managedImages.length === 0}
                  >
                    Card
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<i className="fa-solid fa-images" />}
                    onClick={() => setGalleryPreviewOpen(true)}
                    fullWidth
                    disabled={managedImages.length === 0}
                  >
                    Gallery
                  </Button>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}
              >
                <Stack spacing={2}>
                  <Box
                    sx={{
                      mb: 2,
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
                      Gallery ({managedImages.length}/6)
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      component="label"
                      startIcon={<i className="fa-solid fa-plus" />}
                      disableElevation
                      disabled={managedImages.length >= 6}
                    >
                      Add
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
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid #eee",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={img.url}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          {idx === 0 && (
                            <Chip
                              label="Main"
                              size="small"
                              color="primary"
                              sx={{ height: 16, fontSize: 10, fontWeight: 800 }}
                            />
                          )}
                        </Box>
                        <Stack direction="row" spacing={0}>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveImage(idx, "up")}
                            disabled={idx === 0}
                          >
                            <i className="fa-solid fa-chevron-up text-[10px]" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveImage(idx, "down")}
                            disabled={idx === managedImages.length - 1}
                          >
                            <i className="fa-solid fa-chevron-down text-[10px]" />
                          </IconButton>
                          <IconButton size="small" component="label">
                            <i className="fa-solid fa-sync text-[10px]" />
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={(e) => {
                                if (e.target.files?.[0])
                                  handleReplaceImage(idx, e.target.files[0]);
                              }}
                            />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <i className="fa-solid fa-trash text-[10px]" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                    {managedImages.length === 0 && (
                      <Box
                        sx={{
                          py: 4,
                          border: "2px dashed #eee",
                          borderRadius: 2,
                          textAlign: "center",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#fafafa" },
                        }}
                        component="label"
                      >
                        <input
                          hidden
                          accept="image/*"
                          multiple
                          type="file"
                          onChange={(e) => handleAddNew(e.target.files)}
                        />
                        <i className="fa-solid fa-cloud-upload-alt text-2xl text-gray-300 mb-2 block" />
                        <Typography variant="caption" color="text.secondary">
                          Upload product images
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Card Preview Modal */}
      <Dialog
        open={cardPreviewOpen}
        onClose={() => setCardPreviewOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Card Preview</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <div className="h-[320px] w-[240px]">
              <ProductCard
                id="preview"
                name={payload.name || "Product Name"}
                price={Number(payload.price) || 0}
                imageUrl={previewUrls[0] || null}
                stock={Number(payload.stock) || 0}
                href="#"
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
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
        <DialogTitle sx={{ fontWeight: 800 }}>Gallery Preview</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 2 }}>
            <ProductGallery
              name={payload.name || "Product Name"}
              previewUrls={previewUrls}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGalleryPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
