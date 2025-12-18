"use client";

import { useMemo, useState } from "react";
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

type Status = "New" | "Accepted" | "Shipped" | "Completed" | "Cancelled";

interface OrderItem {
  id: string;
  product: string;
  buyer: string;
  qty: number;
  total: number;
  status: Status;
  date: string;
}

const INITIAL: OrderItem[] = [
  { id: "ORD-1041", product: "Ceramic Brake Kit", buyer: "Dev Patel", qty: 2, total: 220, status: "New", date: "Today" },
  { id: "ORD-1040", product: "Alloy Wheel Set", buyer: "Lina Chen", qty: 1, total: 540, status: "Accepted", date: "Today" },
  { id: "ORD-1039", product: "Air Filter", buyer: "Sam Wilson", qty: 3, total: 90, status: "Shipped", date: "Yesterday" },
  { id: "ORD-1038", product: "Oil Pack", buyer: "Ravi Kumar", qty: 1, total: 45, status: "Completed", date: "Yesterday" },
];

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

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL);

  const filtered = useMemo(() => {
    return statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const updateStatus = (id: string, status: Status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ px: 2.75, py: 2.25, display: "flex", alignItems: "center", gap: 2, justifyContent: "space-between", flexWrap: "wrap", borderBottom: "1px solid #f0eae1", bgcolor: "#f9f7f2" }}>
          <div>
            <Typography variant="h6" fontWeight={900}>
              Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lifecycle: New → Accepted → Shipped → Completed. Completed orders are locked.
            </Typography>
          </div>
          <Select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} sx={{ minWidth: 200, bgcolor: "#fff" }}>
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Accepted">Accepted</MenuItem>
            <MenuItem value="Shipped">Shipped</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </Box>

        <Table size="small" sx={{ "& th": { bgcolor: "#fbf9f4", fontWeight: 800, color: "#3b3325", borderColor: "#f0eae1" }, "& td": { borderColor: "#f3ede4" } }}>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Buyer</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((order) => {
              const actions = nextActions(order.status);
              const locked = order.status === "Completed" || order.status === "Cancelled";
              return (
                <TableRow key={order.id} hover>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell>{order.buyer}</TableCell>
                  <TableCell align="right">{order.qty}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={order.status === "Completed" ? "success" : order.status === "Shipped" ? "info" : order.status === "Accepted" ? "warning" : order.status === "Cancelled" ? "default" : "primary"}
                      variant={order.status === "New" ? "outlined" : "filled"}
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell align="right">${order.total.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {actions.map((next) => (
                        <Button key={next} size="small" variant="outlined" color="inherit" onClick={() => updateStatus(order.id, next)} disabled={locked} sx={{ borderRadius: 9999 }}>
                          {next}
                        </Button>
                      ))}
                      {actions.length === 0 && <Typography variant="caption" color="text.secondary">Locked</Typography>}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
