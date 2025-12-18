"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";

export default function StoreSettingsPage() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, display: "grid", gap: 2.5, bgcolor: "#fff" }}>
        <div>
          <Typography variant="h6" fontWeight={900}>
            Store identity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Buyers trust clear store details. Keep this accurate.
          </Typography>
        </div>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Stack spacing={2}>
            <TextField label="Store name" placeholder="Your store name" fullWidth />
            <TextField label="Store logo URL" placeholder="https://..." fullWidth />
            <TextField label="Contact email" placeholder="seller@store.com" fullWidth />
          </Stack>
          <Stack spacing={2}>
            <TextField label="Contact phone" placeholder="+1 555 123 4567" fullWidth />
            <TextField label="Location" placeholder="City, Country" fullWidth />
            <TextField label="Description" placeholder="What you sell, shipping promises, warranties" multiline minRows={3} fullWidth />
          </Stack>
        </Box>

        <Divider />

        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={800}>
            Inventory rules
          </Typography>
          <FormControlLabel control={<Switch defaultChecked />} label="Warn at low stock" />
          <FormControlLabel control={<Switch defaultChecked />} label="Auto-disable when quantity hits zero" />
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button variant="contained" disableElevation>
            Save changes
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
