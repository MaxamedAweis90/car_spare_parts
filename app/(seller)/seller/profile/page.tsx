"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";

export default function ProfilePage() {
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <Paper elevation={0} sx={{ border: "1px solid #ece8de", borderRadius: 3, p: 3, display: "grid", gap: 2.5, bgcolor: "#fff" }}>
        <div>
          <Typography variant="h6" fontWeight={900}>
            Profile
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personal info stays private; store details are public.
          </Typography>
        </div>

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 56, height: 56, bgcolor: "#2d3b48" }}>SE</Avatar>
          <Button variant="outlined" color="inherit">Change avatar</Button>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Stack spacing={2}>
            <TextField label="Full name" placeholder="Seller Name" fullWidth />
            <TextField label="Email" placeholder="seller@email.com" fullWidth />
          </Stack>
          <Stack spacing={2}>
            <TextField label="Phone" placeholder="+1 555 123 4567" fullWidth />
            <TextField label="Timezone" placeholder="GMT-5" fullWidth />
          </Stack>
        </Box>

        <Divider />

        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={800}>
            Change password
          </Typography>
          <TextField label="Current password" type="password" fullWidth />
          <TextField label="New password" type="password" fullWidth />
          <TextField label="Confirm new password" type="password" fullWidth />
        </Stack>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button variant="contained" disableElevation>
            Save profile
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
