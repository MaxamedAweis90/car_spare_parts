"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";

export default function SupportPage() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, display: "grid", gap: 2.5, bgcolor: "#fff" }}>
        <div>
          <Typography variant="h6" fontWeight={900}>
            Support
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contact admin for approvals, payouts, or urgent order issues.
          </Typography>
        </div>

        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Subject" placeholder="Issue summary" fullWidth />
            <TextField label="Priority" placeholder="Normal" fullWidth />
          </Stack>
          <TextField label="Details" placeholder="Describe the issue" multiline minRows={4} fullWidth />
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button variant="contained" disableElevation>
            Send message
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
