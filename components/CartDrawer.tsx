"use client";

import { useMemo } from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CloseIcon from "@mui/icons-material/Close";
import { ClickAwaySurface } from "./ClickAwaySurface";
import { useCart, type CartItem as StoreCartItem } from "@/lib/cart";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageId?: string | null;
};

export interface CartDrawerProps {
  open?: boolean;
  onClose?: () => void;
  onViewCart?: () => void;
  items?: CartItem[];
}

function buildPublicProductImageUrl(fileId?: string | null) {
  if (!fileId) return null;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!endpoint || !project || !bucket) return null;
  const url = new URL(`${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`);
  url.searchParams.set("project", project);
  return url.toString();
}

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

export function CartDrawer({ open, onClose, onViewCart, items }: CartDrawerProps) {
  const cart = useCart();
  const data: (CartItem | StoreCartItem)[] = items ?? cart.items;
  const drawerOpen = open ?? cart.isOpen;
  const handleClose = onClose ?? cart.closeCart;

  const total = useMemo(() => data.reduce((sum, item) => sum + item.price * item.quantity, 0), [data]);

  return (
    <Drawer anchor="right" open={drawerOpen} onClose={handleClose} PaperProps={{ sx: { width: { xs: 340, sm: 380 }, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 } }}>
      <ClickAwaySurface onClose={handleClose} className="flex h-full flex-col" style={{ backgroundColor: "#f8fafc" }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "transparent" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
          <IconButton onClick={handleClose} aria-label="Close cart" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a" }}>
            Cart
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <Box sx={{ height: "100%", overflowY: "auto", pr: 1, pb: 4 }}>
            <Stack spacing={2} sx={{ px: 2, py: 2 }}>
              {data.length === 0 && (
                <Box sx={{ px: 0.5, py: 6, textAlign: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                    Your cart is empty
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Add a product to see it here.
                  </Typography>
                </Box>
              )}

              {data.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ p: 1.25, borderRadius: 2, bgcolor: "white", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}
                >
                  <Avatar
                    variant="rounded"
                    src={buildPublicProductImageUrl((item as any).imageId ?? null) || undefined}
                    alt={item.name}
                    sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: "#e2e8f0", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.04)" }}
                  >
                    {item.name.slice(0, 1)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Quantity: {item.quantity}
                    </Typography>
                  </Box>

                  <Stack spacing={0.5} alignItems="flex-end">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {formatPrice(item.price)}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="small"
                        sx={{ color: "#0f172a" }}
                        aria-label="Increase quantity"
                        onClick={() => (items ? undefined : cart.increment(item.id))}
                        disabled={Boolean(items)}
                      >
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: "#0f172a" }}
                        aria-label="Decrease quantity"
                        onClick={() => (items ? undefined : cart.decrement(item.id))}
                        disabled={Boolean(items)}
                      >
                        <KeyboardArrowDownIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: "#64748b" }}
                        aria-label="Remove item"
                        onClick={() => (items ? undefined : cart.remove(item.id))}
                        disabled={Boolean(items)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 48,
              background: "linear-gradient(180deg, rgba(248,250,252,0) 0%, rgba(248,250,252,0.9) 60%, #f8fafc 100%)",
            }}
          />
        </Box>

        <Divider />

        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            onClick={onViewCart}
            sx={{ textTransform: "none", fontWeight: 700 }}
            disabled={!onViewCart}
          >
            Go to cart
          </Button>
          <Stack spacing={0} alignItems="flex-end">
            <Typography variant="caption" sx={{ color: "#64748b" }}>
              Total
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a" }}>
              {formatPrice(total)}
            </Typography>
          </Stack>
        </Box>
        </Box>
      </ClickAwaySurface>
    </Drawer>
  );
}
