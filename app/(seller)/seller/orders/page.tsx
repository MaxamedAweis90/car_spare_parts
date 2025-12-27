"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { useSellerStore } from "@/lib/SellerStoreProvider";
import { client, appwriteClientConfig } from "@/lib/appwrite";

type Status = "New" | "Accepted" | "Shipped" | "Completed" | "Cancelled";

interface OrderItem {
  id: string;
  fullId: string; // Store full ID for API calls
  product: string;
  buyer: string;
  qty: number;
  total: number;
  status: Status;
  date: string;
}

function nextActions(status: Status): Status[] {
  switch (status) {
    case "New":
      return ["Accepted", "Cancelled"];
    case "Accepted":
      return ["Shipped", "Cancelled"];
    case "Shipped":
      return ["Completed"];
    default:
      return [];
  }
}

// Map database status to display status
function mapStatus(dbStatus: string): Status {
  if (dbStatus === "pending") return "New";
  if (dbStatus === "paid") return "Accepted";
  if (dbStatus === "shipped") return "Shipped";
  if (dbStatus === "completed") return "Completed";
  if (dbStatus === "cancelled") return "Cancelled";
  return "New";
}

// Map display status to database status
function mapStatusToDb(status: Status): string {
  if (status === "New") return "pending";
  if (status === "Accepted") return "paid";
  if (status === "Shipped") return "shipped";
  if (status === "Completed") return "completed";
  if (status === "Cancelled") return "cancelled";
  return "pending";
}

export default function OrdersPage() {
  const { store } = useSellerStore();
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const sellerId = store?.sellerId;

  const fetchOrders = async () => {
    if (!sellerId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/orders?sellerId=${sellerId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch orders");

      const mapped: OrderItem[] = data.orders.map((o: any) => {
        let items: any[] = [];
        try {
          items = o.items.map((it: string) => JSON.parse(it));
        } catch (e) {
          console.error("Failed to parse items", o.items);
        }

        const firstItem = items[0];
        const productLabel =
          items.length > 1
            ? `${firstItem?.name || "Product"} + ${items.length - 1} more`
            : firstItem?.name || "Unnamed Product";
        const quantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

        return {
          id: o.$id.slice(-6).toUpperCase(),
          fullId: o.$id,
          product: productLabel,
          buyer: o.customerId.slice(-6),
          qty: quantity,
          total: o.totalPrice,
          status: mapStatus(o.status),
          date: new Date(o.createdAt || o.$createdAt).toLocaleDateString(),
        };
      });

      setOrders(mapped);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!sellerId) return;

    const channel = `databases.${appwriteClientConfig.databaseId}.collections.${appwriteClientConfig.ordersCollectionId}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      const event = response.events[0];
      const payload = response.payload as any;

      if (!payload) return;

      // Check if this order contains our products
      // We'll just refetch for simplicity, but you could optimize this
      if (event.endsWith(".update") || event.endsWith(".create")) {
        fetchOrders();
      } else if (event.endsWith(".delete")) {
        setOrders((prev) => prev.filter((o) => o.fullId !== payload.$id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sellerId]);

  const updateStatus = async (
    fullId: string,
    displayId: string,
    newStatus: Status
  ) => {
    if (!sellerId) return;

    try {
      setUpdating(displayId);

      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === displayId ? { ...o, status: newStatus } : o))
      );

      const res = await fetch(`/api/orders/${fullId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: mapStatusToDb(newStatus),
          sellerId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }

      setSnackbar({
        open: true,
        message: `Order updated to ${newStatus}`,
        severity: "success",
      });
    } catch (err: any) {
      // Revert optimistic update
      fetchOrders();
      setSnackbar({
        open: true,
        message: err.message || "Failed to update order",
        severity: "error",
      });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = useMemo(() => {
    return statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #ece8de",
          borderRadius: 3,
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2.75,
            py: 2.25,
            display: "flex",
            alignItems: "center",
            gap: 2,
            justifyContent: "space-between",
            flexWrap: "wrap",
            borderBottom: "1px solid #f0eae1",
            bgcolor: "#f9f7f2",
          }}
        >
          <div>
            <Typography variant="h6" fontWeight={900}>
              Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lifecycle: New → Accepted → Shipped → Completed. Completed orders
              are locked.
            </Typography>
          </div>
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            sx={{ minWidth: 200, bgcolor: "#fff" }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Accepted">Accepted</MenuItem>
            <MenuItem value="Shipped">Shipped</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </Box>

        {loading ? (
          <Box sx={{ p: 10, textAlign: "center" }}>
            <CircularProgress color="warning" />
            <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
              Loading orders...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 10, textAlign: "center" }}>
            <Typography variant="body1" fontWeight={700}>
              No orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Orders from customers will appear here.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: 900,
                "& th": {
                  bgcolor: "#fbf9f4",
                  fontWeight: 800,
                  color: "#3b3325",
                  borderColor: "#f0eae1",
                },
                "& td": { borderColor: "#f3ede4" },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Buyer (ID)</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((order) => {
                  const actions = nextActions(order.status);
                  const locked =
                    order.status === "Completed" ||
                    order.status === "Cancelled";
                  return (
                    <TableRow key={order.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "#c56a1b" }}>
                        #{order.id}
                      </TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell>{order.buyer}</TableCell>
                      <TableCell align="right">{order.qty}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          color={
                            order.status === "Completed"
                              ? "success"
                              : order.status === "Shipped"
                              ? "info"
                              : order.status === "Accepted"
                              ? "warning"
                              : order.status === "Cancelled"
                              ? "default"
                              : "primary"
                          }
                          variant={
                            order.status === "New" ? "outlined" : "filled"
                          }
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        £{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          {actions.map((next) => (
                            <Button
                              key={next}
                              size="small"
                              variant="outlined"
                              color="inherit"
                              onClick={() =>
                                updateStatus(order.fullId, order.id, next)
                              }
                              disabled={locked || updating === order.id}
                              sx={{
                                borderRadius: 9999,
                                textTransform: "none",
                                fontWeight: 700,
                              }}
                            >
                              {updating === order.id ? "..." : next}
                            </Button>
                          ))}
                          {actions.length === 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Locked
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
