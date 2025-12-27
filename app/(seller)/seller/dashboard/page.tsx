"use client";

import { useEffect, useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useSellerStore } from "@/lib/SellerStoreProvider";

interface SellerStats {
  totalVisits: number;
  bounceRate: number;
  returningUsers: number;
  revenueData: Array<{ date: string; revenue: number }>;
  lastWeekRevenue: Array<{ date: string; revenue: number }>;
  customerStats: {
    newCustomers: number;
    returningCustomers: number;
  };
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: string;
}

export default function SellerDashboardPage() {
  const { store } = useSellerStore();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const sellerId = store?.sellerId;

  useEffect(() => {
    if (!sellerId) return;

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const statsRes = await fetch(`/api/seller/stats?sellerId=${sellerId}`);
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const ordersRes = await fetch(`/api/orders?sellerId=${sellerId}`);
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          const recentTransactions = ordersData.orders
            .slice(0, 5)
            .map((order: any) => ({
              id: order.$id,
              date: new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              amount: order.totalPrice,
              status: order.status,
            }));
          setTransactions(recentTransactions);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard transactions:", error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    void fetchStats();
    void fetchTransactions();
  }, [sellerId]);

  // Initialize charts
  useEffect(() => {
    if (!stats || typeof window === "undefined") return;

    const interval = setInterval(() => {
      if ((window as any).Chart) {
        clearInterval(interval);
        initCharts();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [stats]);

  const initCharts = () => {
    const Chart = (window as any).Chart;
    if (!Chart || !stats) return;

    // Revenue Chart
    const revenueCtx = document.getElementById(
      "revenueChart"
    ) as HTMLCanvasElement;
    if (revenueCtx) {
      const existing = Chart.getChart("revenueChart");
      if (existing) existing.destroy();

      const labels = stats.revenueData.map((d) => {
        const date = new Date(d.date);
        return date.toLocaleDateString("en-US", { weekday: "short" });
      });

      new Chart(revenueCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "This Week",
              data: stats.revenueData.map((d) => d.revenue),
              borderColor: "#7cb342",
              backgroundColor: "rgba(124, 179, 66, 0.1)",
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#7cb342",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
            },
            {
              label: "Last Week",
              data: stats.lastWeekRevenue.map((d) => d.revenue),
              borderColor: "#ffa726",
              backgroundColor: "rgba(255, 167, 38, 0.1)",
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "#ffa726",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              align: "end",
              labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 12, weight: "bold" },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#f0f0f0", drawBorder: false },
              ticks: {
                callback: (value: any) => `£${value}`,
                font: { size: 11 },
              },
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
          },
        },
      });
    }

    // Customer Donut Chart
    const customerCtx = document.getElementById(
      "customerChart"
    ) as HTMLCanvasElement;
    if (customerCtx) {
      const existing = Chart.getChart("customerChart");
      if (existing) existing.destroy();

      const total =
        stats.customerStats.newCustomers +
        stats.customerStats.returningCustomers;
      const percentage =
        total > 0
          ? Math.round((stats.customerStats.returningCustomers / total) * 100)
          : 0;

      new Chart(customerCtx, {
        type: "doughnut",
        data: {
          labels: ["Current Customers", "New Customers"],
          datasets: [
            {
              data: [
                stats.customerStats.returningCustomers,
                stats.customerStats.newCustomers,
              ],
              backgroundColor: ["#7cb342", "#e0e0e0"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                usePointStyle: true,
                padding: 15,
                font: { size: 12 },
              },
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const label = context.label || "";
                  const value = context.parsed || 0;
                  return `${label}: ${value}`;
                },
              },
            },
          },
        },
        plugins: [
          {
            id: "centerText",
            beforeDraw: (chart: any) => {
              const { width, height, ctx } = chart;
              ctx.restore();
              const fontSize = (height / 114).toFixed(2);
              ctx.font = `bold ${fontSize}em sans-serif`;
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#333";
              const text = `${percentage}%`;
              const textX = Math.round(
                (width - ctx.measureText(text).width) / 2
              );
              const textY = height / 2;
              ctx.fillText(text, textX, textY);
              ctx.save();
            },
          },
        ],
      });
    }
  };

  // if (loading) {
  //   return (
  //     <Box
  //       sx={{
  //         display: "flex",
  //         alignItems: "center",
  //         justifyContent: "center",
  //         minHeight: "60vh",
  //       }}
  //     >
  //       <CircularProgress color="warning" />
  //     </Box>
  //   );
  // }

  const statCards = [
    {
      label: "Total Visits",
      value: stats?.totalVisits || 0,
      change: "+14.5%",
      sparkline: [42, 45, 48, 46, 50, 52, 49],
    },
    {
      label: "Bounce Rate",
      value: `${stats?.bounceRate || 0}%`,
      change: "-3.1%",
      sparkline: [35, 32, 30, 28, 26, 25, 24],
    },
    {
      label: "Returning Users",
      value: stats?.returningUsers || 0,
      change: "+23.8%",
      sparkline: [18, 20, 22, 25, 28, 30, 32],
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: 0,
      }}
    >
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={900} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All details about your selling products are here.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
        }}
      >
        {statCards.map((card, index) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              borderRadius: 3,
              background: statsLoading
                ? "#fff"
                : "linear-gradient(135deg, #7cb342 0%, #9ccc65 100%)",
              border: statsLoading ? "1px solid #e0e0e0" : "none",
              p: 2.5,
              color: statsLoading ? "text.secondary" : "#fff",
              position: "relative",
              overflow: "hidden",
              minHeight: 160,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {statsLoading ? (
              <Stack alignItems="center" justifyContent="center" spacing={1}>
                <CircularProgress size={20} color="inherit" />
                <Typography variant="caption">
                  Loading {card.label}...
                </Typography>
              </Stack>
            ) : (
              <>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, fontWeight: 600, mb: 1 }}
                >
                  {card.label}
                </Typography>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1.5 }}
                >
                  <Typography variant="h4" fontWeight={900}>
                    {card.value}
                  </Typography>
                  <Chip
                    label={card.change}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}
                  />
                </Stack>

                {/* Mini Sparkline */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 0.5,
                    height: 40,
                    mt: 2,
                  }}
                >
                  {card.sparkline.map((value, idx) => {
                    const max = Math.max(...card.sparkline);
                    const height = (value / max) * 100;
                    return (
                      <Box
                        key={idx}
                        sx={{
                          flex: 1,
                          bgcolor: "rgba(255,255,255,0.3)",
                          borderRadius: 1,
                          transition: "all 0.3s",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.5)" },
                        }}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </Box>
              </>
            )}
          </Paper>
        ))}
      </Box>

      {/* Charts Row */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
        }}
      >
        {/* Revenue Chart */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: "#fff",
            p: 3,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Revenue
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: "#7cb342",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    This week
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: "#ffa726",
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Last week
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
          <Box
            sx={{
              position: "relative",
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {statsLoading ? (
              <Stack alignItems="center" spacing={2}>
                <CircularProgress color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Loading revenue data...
                </Typography>
              </Stack>
            ) : (
              <canvas
                id="revenueChart"
                style={{ width: "100%", height: "100%" }}
              ></canvas>
            )}
          </Box>
        </Paper>

        {/* Customer Chart */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            bgcolor: "#fff",
            p: 3,
          }}
        >
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
            Customers
          </Typography>
          <Box
            sx={{
              position: "relative",
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {statsLoading ? (
              <Stack alignItems="center" spacing={2}>
                <CircularProgress color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Loading insights...
                </Typography>
              </Stack>
            ) : (
              <canvas
                id="customerChart"
                style={{ width: "100%", height: "100%" }}
              ></canvas>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Recent Transactions */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          bgcolor: "#fff",
          p: 3,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={900}>
            Recent Transaction
          </Typography>
          <Button size="small" href="/seller/orders">
            View All
          </Button>
        </Stack>

        <Box sx={{ overflowX: "auto" }}>
          {transactionsLoading ? (
            <Box
              sx={{
                py: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CircularProgress size={30} color="warning" />
              <Typography variant="body2" color="text.secondary">
                Fetching transactions...
              </Typography>
            </Box>
          ) : transactions.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No recent transactions found.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      #{transaction.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell align="right">
                      £{transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={
                          transaction.status === "completed"
                            ? "success"
                            : transaction.status === "pending"
                            ? "warning"
                            : "default"
                        }
                        sx={{ fontWeight: 700, textTransform: "capitalize" }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
