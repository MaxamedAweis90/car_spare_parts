"use client";

import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Grid2";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import CircleIcon from "@mui/icons-material/Circle";

const SNAPSHOT = [
  { label: "Active products", value: 128, delta: "+6 this week", icon: <Inventory2OutlinedIcon fontSize="small" />, color: "#3f5c45", spark: [34, 32, 36, 41, 44] },
  { label: "Open orders", value: 18, delta: "+4 vs yesterday", icon: <ShoppingBagOutlinedIcon fontSize="small" />, color: "#956200", spark: [9, 11, 12, 15, 18] },
  { label: "Revenue YTD", value: 12840, delta: "+12% MoM", icon: <MonetizationOnOutlinedIcon fontSize="small" />, color: "#1d3d83", spark: [8200, 9300, 10100, 11850, 12840] },
  { label: "Stock alerts", value: 4, delta: "Needs attention", icon: <WarningAmberOutlinedIcon fontSize="small" />, color: "#a3410f", spark: [6, 5, 4, 4, 4] },
];

const ORDERS = [
  { id: "ORD-1041", product: "Ceramic Brake Kit", buyer: "Dev Patel", qty: 2, status: "New", total: 220 },
  { id: "ORD-1040", product: "Alloy Wheel Set", buyer: "Lina Chen", qty: 1, status: "Processing", total: 540 },
  { id: "ORD-1039", product: "Air Filter", buyer: "Sam Wilson", qty: 3, status: "Shipped", total: 90 },
  { id: "ORD-1038", product: "Oil Pack", buyer: "Ravi Kumar", qty: 1, status: "Completed", total: 45 },
];

const INVENTORY_WATCH = [
  { name: "Brake Pads", sku: "BR-401", qty: 6, status: "Low" },
  { name: "Air Filter", sku: "EN-212", qty: 4, status: "Low" },
  { name: "Spark Plug", sku: "EN-110", qty: 0, status: "Out" },
  { name: "Oil Pack", sku: "FL-102", qty: 3, status: "Low" },
];

const QUICK_TASKS = [
  "Publish draft products",
  "Confirm new orders",
  "Upload store logo",
  "Add tracking numbers",
];

const WEEKLY_SALES = [
  { label: "Mon", value: 18 },
  { label: "Tue", value: 32 },
  { label: "Wed", value: 46 },
  { label: "Thu", value: 34 },
  { label: "Fri", value: 64 },
  { label: "Sat", value: 58 },
  { label: "Sun", value: 42 },
];

const FULFILLMENT = [
  { label: "Pending", value: 14, color: "#f59e0b" },
  { label: "Processing", value: 22, color: "#2563eb" },
  { label: "Shipped", value: 28, color: "#0f766e" },
  { label: "Completed", value: 36, color: "#1f2937" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function SellerDashboardPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, bgcolor: "#f6f4ef", p: { xs: 1.5, md: 0 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          border: "1px solid #ece8de",
          background: "linear-gradient(135deg, #fbfaf7 0%, #f2eee5 55%, #ffffff 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
          <div>
            <Typography variant="overline" color="text.secondary" fontWeight={800}>
              Seller control center
            </Typography>
            <Typography variant="h5" fontWeight={900}>
              Health, fulfillment, and growth snapshot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review the latest performance signals and jump into the next action fast.
            </Typography>
          </div>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", sm: "auto" }}>
            <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />} color="inherit" fullWidth>
              View storefront
            </Button>
            <Button variant="contained" startIcon={<AddBoxOutlinedIcon />} disableElevation href="/seller/products/new" fullWidth>
              Add product
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid2 container spacing={2}>
        {SNAPSHOT.map((item) => (
          <Grid2 key={item.label} item xs={12} sm={6} lg={3}>
            <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #ece8de", bgcolor: "#fff", p: 2, display: "flex", gap: 1.25 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: `${item.color}20`, color: item.color }}>{item.icon}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {item.label === "Revenue YTD" ? formatCurrency(item.value) : item.value}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <CircleIcon sx={{ fontSize: 8, color: item.label === "Stock alerts" ? "#d97706" : "#0f766e" }} />
                  <Typography variant="caption" color="text.secondary">
                    {item.delta}
                  </Typography>
                </Stack>
                <Box sx={{ mt: 1, display: "flex", alignItems: "flex-end", gap: 0.5, height: 36 }}>
                  {item.spark.map((value, index) => {
                    const max = Math.max(...item.spark);
                    return (
                      <Box key={`${item.label}-${index}`} sx={{ width: 7, borderRadius: 9999, bgcolor: `${item.color}55` }} style={{ height: `${Math.max(12, (value / max) * 34)}%` }} />
                    );
                  })}
                </Box>
              </Box>
            </Paper>
          </Grid2>
        ))}
      </Grid2>

      <Grid2 container spacing={2}>
        <Grid2 item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #ece8de", bgcolor: "#fff", p: { xs: 2, md: 2.75 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
              <div>
                <Typography variant="subtitle1" fontWeight={900}>
                  Weekly sales trend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Traffic and paid order volume across the last seven days.
                </Typography>
              </div>
              <Chip label="Last 7 days" size="small" sx={{ bgcolor: "#f9f7f2", border: "1px solid #ece8de" }} />
            </Stack>

            <Box sx={{ position: "relative", height: 240, borderRadius: 12, border: "1px solid #f0eae1", bgcolor: "#fbf9f4", p: 2, display: "grid", alignItems: "end" }}>
              <Divider sx={{ position: "absolute", bottom: 72, left: 24, right: 24, borderColor: "#e8e0d2" }} />
              <Divider sx={{ position: "absolute", bottom: 144, left: 24, right: 24, borderColor: "#e8e0d2" }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 1.2, alignItems: "end", height: "100%" }}>
                {WEEKLY_SALES.map((entry) => (
                  <Stack key={entry.label} spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: "70%",
                        height: `${Math.max(12, entry.value)}%`,
                        maxHeight: "100%",
                        bgcolor: "#1f2937",
                        borderRadius: "12px 12px 6px 6px",
                        boxShadow: "0 10px 20px rgba(17, 24, 39, 0.12)",
                        transition: "height 0.25s ease",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {entry.label}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid2>

        <Grid2 item xs={12} md={4}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #ece8de", bgcolor: "#fff", p: { xs: 2, md: 2.5 }, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={900}>
                Fulfillment mix
              </Typography>
              <Chip label="Today" size="small" sx={{ bgcolor: "#f9f7f2", border: "1px solid #ece8de" }} />
            </Stack>
            <Stack spacing={1.5}>
              {FULFILLMENT.map((item) => (
                <Stack key={item.label} spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={800}>{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.value}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    sx={{ height: 8, borderRadius: 9999, bgcolor: "#f3ede4", "& .MuiLinearProgress-bar": { bgcolor: item.color } }}
                  />
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #ece8de", bgcolor: "#fff", p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>
              Quick actions
            </Typography>
            <Stack spacing={1.2}>
              {QUICK_TASKS.map((action, index) => (
                <Stack key={action} direction="row" alignItems="center" spacing={1.25}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "#1f2937", fontSize: 12 }}>{index + 1}</Avatar>
                  <Typography variant="body2" fontWeight={700}>
                    {action}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid2>
      </Grid2>

      <Grid2 container spacing={2}>
        <Grid2 item xs={12} lg={8}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #ece8de", bgcolor: "#fff", p: { xs: 2, md: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={900}>
                Recent orders
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<LocalShippingOutlinedIcon />} color="inherit">
                  Ship queue
                </Button>
                <Button size="small" variant="text" href="/seller/orders">
                  View all
                </Button>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <Table size="small" sx={{ "& th": { bgcolor: "#fbf9f4", fontWeight: 800, color: "#3b3325", borderColor: "#f0eae1" }, "& td": { borderColor: "#f3ede4" } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ORDERS.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell>{order.buyer}</TableCell>
                    <TableCell align="right">{order.qty}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        color={order.status === "Completed" ? "success" : order.status === "Shipped" ? "info" : order.status === "Processing" ? "warning" : "default"}
                        variant={order.status === "New" ? "outlined" : "filled"}
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid2>

        <Grid2 item xs={12} lg={4}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #ece8de", bgcolor: "#fff", p: { xs: 2, md: 2.5 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={900}>
                Inventory watchlist
              </Typography>
              <Tooltip title="Manage products">
                <IconButton size="small" href="/seller/products" component="a">
                  <TableRowsOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Stack spacing={1.2}>
              {INVENTORY_WATCH.map((item) => {
                const color = item.status === "Out" ? "error" : item.status === "Low" ? "warning" : "success";
                return (
                  <Paper key={item.sku} variant="outlined" sx={{ p: 1.5, borderColor: "#e5dece", borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <div>
                        <Typography variant="body2" fontWeight={800}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">SKU {item.sku}</Typography>
                      </div>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={`${item.qty} in stock`} size="small" color={color as any} variant={item.status === "Healthy" ? "outlined" : "filled"} sx={{ borderRadius: 1.5 }} />
                        <Chip label={item.status} size="small" color={color as any} variant="outlined" sx={{ borderRadius: 1.5 }} />
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={item.status === "Out" ? 0 : Math.min(100, (item.qty / 12) * 100)}
                      color={color as any}
                      sx={{ mt: 1, borderRadius: 9999, height: 6 }}
                    />
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        </Grid2>
      </Grid2>
    </Box>
  );
}
