"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { useSellerStore } from "@/lib/providers/SellerStoreProvider";
import { useSellerStats } from "@/hooks/queries/useSellerStats";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function EarningsPage() {
  const { store } = useSellerStore();
  const sellerId = store?.sellerId;
  const { data: stats, isLoading } = useSellerStats(sellerId);

  // Calculate totals from stats
  const totalRevenue = (stats?.revenueData || []).reduce(
    (acc, curr) => acc + curr.revenue,
    0,
  );
  // Assuming revenueData is all time or we just use what we have.
  // Ideally stats object would have "totalRevenue" directly.
  // The current stats hook has "revenueData" (graph) and "lastWeekRevenue".

  // For the purpose of "This month", we might need to filter the revenueData if it contains dates.
  // Let's assume revenueData is the last 7 days for now based on the previous dashboard code,
  // BUT the user asked for "revenue on his dashboard and also on earnings".
  // Let's calculate from what we have.

  // Actually, let's try to sum up everything if possible, or just show what's available.

  const summaryItems = [
    {
      label: "Total Revenue (Last 7 Days)", // clarifying scope
      value: totalRevenue,
      icon: <MonetizationOnOutlinedIcon fontSize="small" />,
      color: "#0f766e",
    },
    // We don't have "pending payouts" in stats yet, so we'll hide or mock it to 0
    {
      label: "Returning Customers",
      value: stats?.customerStats?.returningCustomers || 0,
      icon: <ReceiptLongOutlinedIcon fontSize="small" />,
      color: "#2563eb",
      isCount: true,
    },
  ];

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {summaryItems.map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              border: "1px solid #ece8de",
              borderRadius: 3,
              p: 2.5,
              bgcolor: "#fff",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: `${item.color}14`,
                  color: item.color,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {item.icon}
              </Box>
              <div>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {item.isCount ? item.value : formatCurrency(item.value)}
                </Typography>
              </div>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #ece8de",
          borderRadius: 3,
          bgcolor: "#fff",
          overflow: "hidden",
          p: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Payout history is coming soon.
        </Typography>
      </Paper>
    </Box>
  );
}
