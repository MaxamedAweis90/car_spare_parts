"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

const CATEGORIES = ["Brakes", "Engine", "Wheels", "Fluids", "Interior"];

export default function CategoriesPage() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, bgcolor: "#fff" }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
          Categories
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Keep categories tidy so products stay discoverable.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField label="New category" placeholder="e.g. Body, Lighting" fullWidth />
          <Button variant="contained" disableElevation>
            Add
          </Button>
        </Stack>

        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} label={cat} onDelete={() => {}} variant="outlined" sx={{ borderColor: "#e6dfd1", bgcolor: "#fbf9f4", borderRadius: 1.5 }} />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

