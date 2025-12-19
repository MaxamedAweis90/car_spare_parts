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

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onViewCart?: () => void;
  items?: CartItem[];
}

const FALLBACK_ITEMS: CartItem[] = [
  { id: "1", name: "Brake Rotor Kit", price: 300, quantity: 1, imageUrl: "/heroimages/brakes.png" },
  { id: "2", name: "Performance Oil", price: 46, quantity: 2, imageUrl: "/heroimages/car.png" },
  { id: "3", name: "Ceramic Brake Pads", price: 65, quantity: 1, imageUrl: "/heroimages/brakes.png" },
];

function formatPrice(value: number) {
  return `£${value.toFixed(2)}`;
}

export function CartDrawer({ open, onClose, onViewCart, items }: CartDrawerProps) {
  const data = items && items.length ? items : FALLBACK_ITEMS;

  const total = useMemo(() => data.reduce((sum, item) => sum + item.price * item.quantity, 0), [data]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 340, sm: 380 }, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 } }}>
      <ClickAwaySurface onClose={onClose} className="flex h-full flex-col" style={{ backgroundColor: "#f8fafc" }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "transparent" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
          <IconButton onClick={onClose} aria-label="Close cart" size="small">
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
                    src={item.imageUrl || undefined}
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
                      <IconButton size="small" sx={{ color: "#0f172a" }} aria-label="Increase quantity">
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: "#0f172a" }} aria-label="Decrease quantity">
                        <KeyboardArrowDownIcon fontSize="small" />
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
          <Button variant="contained" color="success" onClick={onViewCart} sx={{ textTransform: "none", fontWeight: 700 }}>
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
