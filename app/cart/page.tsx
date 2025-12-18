"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";

const CART_ITEMS = [
  {
    id: "1",
    name: "Performance Brake Kit",
    brand: "Canadian Footwear",
    color: "Blue",
    size: "6",
    price: 653,
    compareAt: 652,
    discountLabel: "20% OFF",
    image: "/heroimages/brakes.png",
    quantity: 1,
  },
  {
    id: "2",
    name: "Acton Propulsion",
    brand: "Canadian Footwear",
    color: "Black",
    size: "6",
    price: 653,
    compareAt: 652,
    discountLabel: "20% OFF",
    image: "/heroimages/brakes.png",
    quantity: 1,
  },
  {
    id: "3",
    name: "Kodiak Trek",
    brand: "Canadian Footwear",
    color: "Blue",
    size: "6",
    price: 653,
    compareAt: 652,
    discountLabel: "20% OFF",
    image: "/heroimages/brakes.png",
    quantity: 1,
  },
  {
    id: "4",
    name: "Terra Crossbow",
    brand: "Canadian Footwear",
    color: "Blue",
    size: "6",
    price: 653,
    compareAt: 652,
    discountLabel: "20% OFF",
    image: "/heroimages/brakes.png",
    quantity: 1,
  },
];

const FEES = {
  delivery: 7.99,
  service: 1.5,
  tax: 7,
  credits: 8,
  tips: 4,
};

const STEPS = ["Cart", "Shipping", "Payment"];

export default function CartPage() {
  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + FEES.delivery + FEES.service + FEES.tax + FEES.tips - FEES.credits;

  return (
    <Box sx={{ bgcolor: "#fdf6f3", minHeight: "100vh", py: { xs: 4, md: 6 } }}>
      <Box sx={{ mx: "auto", maxWidth: "1200px", px: { xs: 2, md: 3 } }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <BreadcrumbTrail items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />

          <Stepper
            activeStep={0}
            alternativeLabel
            sx={{
              pt: 1,
              pb: 0.5,
              "& .MuiStepConnector-line": { borderColor: "#e5e7eb" },
              "& .MuiStepLabel-label": { fontWeight: 700, color: "#9ca3af" },
              "& .Mui-active .MuiStepLabel-label": { color: "#c56a1b" },
              "& .Mui-completed .MuiStepLabel-label": { color: "#c56a1b" },
              "& .MuiStepIcon-root": { color: "#e5e7eb" },
              "& .Mui-active .MuiStepIcon-root": { color: "#c56a1b" },
              "& .Mui-completed .MuiStepIcon-root": { color: "#c56a1b" },
            }}
          >
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 3 }}>
          <Box>
            <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #eadcd0", bgcolor: "#fffaf7" }}>
              <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #eadcd0" }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  My Cart ({CART_ITEMS.length})
                </Typography>
              </Box>

              <Stack spacing={0}>
                {CART_ITEMS.map((item, idx) => (
                  <Box key={item.id} sx={{ px: 3, py: 3 }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "96px 1fr", sm: "120px 1fr auto" },
                        gap: { xs: 2, sm: 3 },
                        alignItems: "center",
                      }}
                    >
                      <Paper variant="outlined" sx={{ borderColor: "#eadcd0", bgcolor: "white", borderRadius: 2, overflow: "hidden" }}>
                        <Box sx={{ position: "relative", width: "100%", pt: "100%" }}>
                          <Image src={item.image} alt={item.name} fill sizes="120px" style={{ objectFit: "contain" }} />
                        </Box>
                      </Paper>

                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight={700} color="#1f2937">
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="#6b7280">
                          {item.brand}
                        </Typography>
                        <Typography variant="caption" color="#6b7280">
                          Color: {item.color} | Size: {item.size}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Typography variant="body2" fontWeight={800} color="#c56a1b">
                            £{item.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="#9ca3af" sx={{ textDecoration: "line-through" }}>
                            £{item.compareAt.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="#c56a1b" fontWeight={700}>
                            {item.discountLabel}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} sx={{ justifySelf: "end" }}>
                        <IconButton size="small" aria-label="Decrease quantity" sx={{ border: "1px solid #e5e7eb" }}>
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" fontWeight={700}>
                          {item.quantity}
                        </Typography>
                        <IconButton size="small" aria-label="Increase quantity" sx={{ border: "1px solid #e5e7eb" }}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" aria-label="Remove item" sx={{ ml: 1, color: "#9ca3af" }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>

                    {idx < CART_ITEMS.length - 1 && <Divider sx={{ mt: 3, borderColor: "#f0e5dd" }} />}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>

          <Box>
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #eadcd0", bgcolor: "#fffaf7", p: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Coupons
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Coupon code"
                    size="small"
                    InputProps={{ sx: { bgcolor: "white", borderRadius: 2 } }}
                  />
                  <Button variant="outlined" color="inherit" sx={{ textTransform: "none", fontWeight: 700, borderColor: "#d1d5db" }}>
                    Apply now
                  </Button>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid #eadcd0", bgcolor: "#fffaf7", p: 2.5 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Your Order
                  </Typography>

                  <Stack spacing={1}>
                    <Row label="Subtotal" value={`£${subtotal.toFixed(2)}`} />
                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Delivery
                      </Typography>
                      <RadioGroup defaultValue="delivery" name="delivery">
                        <FormControlLabel
                          value="delivery"
                          control={<Radio size="small" />}
                          label={<DeliveryLabel title="Delivery" price={FEES.delivery} icon={<LocalShippingIcon fontSize="small" />} />}
                        />
                        <FormControlLabel
                          value="pickup"
                          control={<Radio size="small" />}
                          label={<DeliveryLabel title="Pick Up" price={0} icon={<StoreMallDirectoryIcon fontSize="small" />} muted />}
                        />
                      </RadioGroup>
                    </Stack>

                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Tip
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {[2, 4, 7].map((tip) => (
                          <Chip key={tip} label={`£${tip.toFixed(2)}`} color={tip === FEES.tips ? "warning" : "default"} variant={tip === FEES.tips ? "filled" : "outlined"} />
                        ))}
                      </Stack>
                      <TextField
                        size="small"
                        placeholder="Other"
                        InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
                        sx={{ maxWidth: 160 }}
                      />
                    </Stack>

                    <Divider />
                    <Row label="Service Fee" value={`£${FEES.service.toFixed(2)}`} />
                    <Row label="Tax" value={`£${FEES.tax.toFixed(2)}`} />
                    <Row label="Use Credits" value={`-£${FEES.credits.toFixed(2)}`} valueColor="#c56a1b" />
                    <Divider />
                    <Row label="Total Payable" value={`£${total.toFixed(2)}`} labelStrong valueStrong />
                  </Stack>

                  <Button variant="contained" color="warning" sx={{ textTransform: "none", fontWeight: 800, py: 1.2 }} fullWidth>
                    Proceed to checkout
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function Row({ label, value, labelStrong, valueStrong, valueColor }: { label: string; value: string; labelStrong?: boolean; valueStrong?: boolean; valueColor?: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" fontWeight={labelStrong ? 800 : 600} color="#4b5563">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={valueStrong ? 800 : 700} color={valueColor || "#111827"}>
        {value}
      </Typography>
    </Stack>
  );
}

function DeliveryLabel({ title, price, icon, muted }: { title: string; price: number; icon: React.ReactNode; muted?: boolean }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ color: muted ? "#9ca3af" : "#111827" }}>
      {icon}
      <Typography variant="body2" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="body2" color="#9ca3af">
        £{price.toFixed(2)}
      </Typography>
    </Stack>
  );
}
