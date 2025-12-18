"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
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

const PAYOUTS = [
  { id: "PAY-2201", amount: 2400, status: "Paid", date: "Jan 10" },
  { id: "PAY-2200", amount: 1800, status: "Paid", date: "Dec 28" },
  { id: "PAY-2199", amount: 950, status: "Pending", date: "Dec 14" },
];

const SUMMARY = [
  { label: "Total revenue", value: 28400, icon: <MonetizationOnOutlinedIcon fontSize="small" />, color: "#0f766e" },
  { label: "This month", value: 8400, icon: <ReceiptLongOutlinedIcon fontSize="small" />, color: "#2563eb" },
  { label: "Pending payouts", value: 950, icon: <AccountBalanceWalletOutlinedIcon fontSize="small" />, color: "#c56a1b" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function EarningsPage() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Grid container spacing={2}>
        {SUMMARY.map((item) => (
          <Grid key={item.label} item xs={12} md={4}>
            <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 2.5, bgcolor: "#fff" }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${item.color}14`, color: item.color, display: "grid", placeItems: "center" }}>
                  {item.icon}
                </Box>
                <div>
                  <Typography variant="body2" color="text.secondary" fontWeight={700}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>
                    {formatCurrency(item.value)}
                  </Typography>
                  <LinearProgress variant="determinate" value={70} sx={{ mt: 1, height: 6, borderRadius: 9999, bgcolor: "#f2ede4" }} />
                </div>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ px: 2.75, py: 2.25, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, borderBottom: "1px solid #f0eae1", bgcolor: "#f9f7f2" }}>
          <div>
            <Typography variant="h6" fontWeight={900}>
              Payouts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track pending and paid payouts. Add date-range filter later.
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="inherit">
              Download report
            </Button>
            <Button variant="contained" disableElevation>
              Request payout
            </Button>
          </Stack>
        </Box>

        <Table size="small" sx={{ "& th": { bgcolor: "#fbf9f4", fontWeight: 800, color: "#3b3325", borderColor: "#f0eae1" }, "& td": { borderColor: "#f3ede4" } }}>
          <TableHead>
            <TableRow>
              <TableCell>Payout</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PAYOUTS.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.id}</TableCell>
                <TableCell>
                  <Chip label={p.status} size="small" color={p.status === "Paid" ? "success" : "warning"} variant={p.status === "Pending" ? "outlined" : "filled"} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                </TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
