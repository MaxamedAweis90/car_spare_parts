"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import SearchIcon from "@mui/icons-material/Search";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

const PRODUCTS = [
  { id: "PRD-501", name: "Ceramic Brake Kit", category: "Brakes", price: 220, qty: 24, status: "Published" },
  { id: "PRD-502", name: "Alloy Wheel Set", category: "Wheels", price: 540, qty: 12, status: "Published" },
  { id: "PRD-503", name: "Air Filter", category: "Engine", price: 30, qty: 4, status: "Low" },
  { id: "PRD-504", name: "Oil Pack", category: "Fluids", price: 18, qty: 0, status: "Disabled" },
  { id: "PRD-505", name: "Spark Plug", category: "Engine", price: 12, qty: 48, status: "Draft" },
];

export default function SellerProductsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return PRODUCTS.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" ? true : item.status.toLowerCase() === status;
      const matchesCategory = category === "all" ? true : item.category.toLowerCase() === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [category, search, status]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 2.5, bgcolor: "#fff" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            size="small"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Select
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FilterAltOutlinedIcon fontSize="small" />
                </InputAdornment>
              }
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="low">Low stock</MenuItem>
              <MenuItem value="disabled">Disabled</MenuItem>
            </Select>
            <Select size="small" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="all">All categories</MenuItem>
              <MenuItem value="brakes">Brakes</MenuItem>
              <MenuItem value="wheels">Wheels</MenuItem>
              <MenuItem value="engine">Engine</MenuItem>
              <MenuItem value="fluids">Fluids</MenuItem>
            </Select>
            <Button href="/seller/products/new" startIcon={<AddBoxOutlinedIcon />} variant="contained" disableElevation>
              Add product
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, bgcolor: "#fff" }}>
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="subtitle1" fontWeight={800}>
            Products
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Showing {filtered.length} of {PRODUCTS.length}
          </Typography>
        </Box>
        <Divider />
        <Table size="small" sx={{ "& th": { bgcolor: "#fbf9f4", fontWeight: 800, color: "#3b3325", borderColor: "#f0eae1" }, "& td": { borderColor: "#f3ede4" } }}>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((item) => {
              const statusColor =
                item.status === "Published"
                  ? "success"
                  : item.status === "Draft"
                  ? "default"
                  : item.status === "Low"
                  ? "warning"
                  : "error";
              return (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.qty}</TableCell>
                  <TableCell>
                    <Chip label={item.status} size="small" color={statusColor as any} variant={item.status === "Draft" ? "outlined" : "filled"} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" variant="outlined" color="inherit" sx={{ borderRadius: 9999 }}>
                        Edit
                      </Button>
                      <Button size="small" variant="outlined" color="warning" sx={{ borderRadius: 9999 }}>
                        Disable
                      </Button>
                      <Button size="small" variant="outlined" color="error" sx={{ borderRadius: 9999 }}>
                        Delete
                      </Button>
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
