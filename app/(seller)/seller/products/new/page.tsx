"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Image from "next/image";

interface ImageItem {
  name: string;
  src: string;
}

export default function SellerAddProductPage() {
  const [draft, setDraft] = useState(true);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [payload, setPayload] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    description: "",
  });

  const disablePublish = useMemo(() => {
    return !payload.name || !payload.category || !payload.price || !payload.quantity;
  }, [payload]);

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((file) => ({ name: file.name, src: URL.createObjectURL(file) }));
    setImages(next);
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, display: "grid", gap: 2, bgcolor: "#fff" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <div>
            <Typography variant="h6" fontWeight={900}>
              Add product
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete the required fields. Drafts stay invisible to customers.
            </Typography>
          </div>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControlLabel
              control={<Switch checked={draft} onChange={(e) => setDraft(e.target.checked)} />}
              label="Save as draft"
            />
            <Button variant="outlined" color="inherit">
              Save draft
            </Button>
            <Button variant="contained" disableElevation disabled={disablePublish && draft === false}>
              Publish
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Product name"
              value={payload.name}
              onChange={(e) => setPayload((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Category"
                value={payload.category}
                onChange={(e) => setPayload((p) => ({ ...p, category: e.target.value }))}
                required
                select
              >
                <MenuItem value="Brakes">Brakes</MenuItem>
                <MenuItem value="Engine">Engine</MenuItem>
                <MenuItem value="Wheels">Wheels</MenuItem>
                <MenuItem value="Fluids">Fluids</MenuItem>
              </TextField>
              <TextField
                label="Price"
                type="number"
                value={payload.price}
                onChange={(e) => setPayload((p) => ({ ...p, price: e.target.value }))}
                InputProps={{ startAdornment: <span className="mr-1 text-slate-500">$</span> as any }}
                required
              />
              <TextField
                label="Quantity"
                type="number"
                value={payload.quantity}
                onChange={(e) => setPayload((p) => ({ ...p, quantity: e.target.value }))}
                required
              />
            </Stack>
            <TextField
              label="Description"
              value={payload.description}
              onChange={(e) => setPayload((p) => ({ ...p, description: e.target.value }))}
              placeholder="Key specs, compatibility, warranty"
              multiline
              minRows={4}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="SKU" placeholder="Optional" />
              <Select fullWidth displayEmpty defaultValue="draft">
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
              <Select fullWidth displayEmpty defaultValue="in_stock">
                <MenuItem value="in_stock">In stock</MenuItem>
                <MenuItem value="low">Low stock</MenuItem>
                <MenuItem value="out">Out of stock (auto-disable)</MenuItem>
              </Select>
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Images
                </Typography>
                <Button variant="outlined" component="label" fullWidth>
                  Upload images
                  <input hidden accept="image/*" multiple type="file" onChange={(e) => handleImages(e.target.files)} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  Upload multiple images. First image becomes the cover.
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {images.length === 0 && <Chip label="No images yet" size="small" />}
                  {images.map((img) => (
                    <Box key={img.src} sx={{ width: 96, height: 96, position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ece8de" }}>
                      <Image src={img.src} alt={img.name} fill sizes="96px" style={{ objectFit: "cover" }} />
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#ece8de" }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Publishing rules
                </Typography>
                <ul className="list-disc pl-4 text-sm text-slate-600 space-y-1">
                  <li>Draft products are hidden from customers.</li>
                  <li>Published products require stock greater than zero.</li>
                  <li>Auto-disable if quantity reaches zero.</li>
                </ul>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
