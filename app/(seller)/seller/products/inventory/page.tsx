"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";

const INVENTORY = [
  { name: "Ceramic Brake Kit", sku: "BR-401", qty: 24, threshold: 10 },
  { name: "Air Filter", sku: "EN-212", qty: 4, threshold: 8 },
  { name: "Oil Pack", sku: "FL-102", qty: 0, threshold: 6 },
  { name: "Spark Plug", sku: "EN-110", qty: 48, threshold: 12 },
];

function statusOf(item: { qty: number; threshold: number }) {
  if (item.qty === 0) return { label: "Out of stock", color: "error", percent: 0 };
  if (item.qty <= item.threshold) return { label: "Low stock", color: "warning", percent: Math.min(100, (item.qty / item.threshold) * 100) };
  return { label: "Healthy", color: "success", percent: 100 };
}

export default function InventoryPage() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, bgcolor: "#fff" }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
          Inventory health
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track low-stock items. Set auto-disable when quantity hits zero.
        </Typography>

        <Stack spacing={1.5}>
          {INVENTORY.map((item) => {
            const status = statusOf(item);
            return (
              <Paper key={item.sku} variant="outlined" sx={{ p: 2, borderColor: "#ece8de", borderRadius: 2.5 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                  <div>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU {item.sku}
                    </Typography>
                  </div>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={`${item.qty} in stock`} size="small" color={status.color as any} variant="outlined" />
                    <Chip label={status.label} size="small" color={status.color as any} />
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={status.percent}
                  color={status.color as any}
                  sx={{ mt: 1.5, borderRadius: 9999, height: 8 }}
                />
              </Paper>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}
