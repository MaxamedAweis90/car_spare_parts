"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { BreadcrumbTrail } from "@/components/ui/BreadcrumbTrail";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/auth/useSession";

// --- Types ---
type DeliveryMethod = "delivery" | "pickup";
type PaymentMethod = "evc_plus" | "edahab" | "card" | "test_payment";

interface ShippingDetails {
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
}

// --- Constants ---
const STEPS = ["Cart", "Shipping", "Payment"];
const FEES = {
  service: 1.5,
  taxRate: 0.1, // 10%
  delivery: 7.99,
};

// --- Helper Functions ---
function buildPublicProductImageUrl(fileId?: string | null) {
  if (!fileId) return "/placeholder.png"; // Fallback
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!endpoint || !project || !bucket) return "/placeholder.png";
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`
  );
  url.searchParams.set("project", project);
  return url.toString();
}

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    increment,
    decrement,
    remove,
    clear,
    total: cartSubtotal,
  } = useCart();
  const { authenticated, profile, loading: authLoading } = useSession();

  const [activeStep, setActiveStep] = useState(0);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fullName: profile?.name || "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phoneNumber: profile?.phone ? String(profile.phone) : "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("evc_plus");
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState(
    profile?.phone ? String(profile.phone) : ""
  );
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Derived State ---
  const deliveryCost = deliveryMethod === "delivery" ? FEES.delivery : 0;
  const taxCost = cartSubtotal * FEES.taxRate;
  const total = cartSubtotal + deliveryCost + FEES.service + taxCost; // Add tips/others if needed

  // --- Handlers ---
  const handleNext = () => {
    if (activeStep === 0) {
      if (items.length === 0) return;
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Validate shipping
      if (
        !shippingDetails.fullName ||
        !shippingDetails.streetAddress ||
        !shippingDetails.city ||
        !shippingDetails.phoneNumber
      ) {
        setErrorMsg("Please fill in all required shipping fields.");
        return;
      }
      setErrorMsg(null);
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setErrorMsg(null);
  };

  const handleShippingChange =
    (field: keyof ShippingDetails) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setShippingDetails({ ...shippingDetails, [field]: e.target.value });
    };

  const handlePlaceOrder = async () => {
    if (!authenticated) {
      // Prompt login or redirect
      // For now, let's require login
      router.push(`/auth/login?redirect=/cart`);
      return;
    }

    setIsPlacingOrder(true);
    setErrorMsg(null);

    try {
      // Construct Shipping Address string
      const addressString = `${shippingDetails.fullName}, ${shippingDetails.streetAddress}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}. Phone: ${shippingDetails.phoneNumber}`;

      const payload = {
        customerId: profile?.$id || "guest",
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: addressString,
        paymentMethod: paymentMethod,
        paymentDetails:
          paymentMethod === "card"
            ? cardDetails
            : { phoneNumber: paymentPhoneNumber },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Success
      setOrderSuccess(true);
      clear(); // Clear cart
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred placing the order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <Box
        sx={{
          bgcolor: "#fdf6f3",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 10,
        }}
      >
        <Paper
          sx={{ p: 6, maxWidth: 500, textAlign: "center", borderRadius: 4 }}
        >
          <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Order Placed!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Thank you for your purchase. Your order has been securely processed
            and is on its way.
          </Typography>
          <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={() => router.push("/shop")}
            sx={{ fontWeight: 700, px: 4 }}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#fdf6f3", minHeight: "100vh", py: { xs: 4, md: 6 } }}>
      <Box sx={{ mx: "auto", maxWidth: "1200px", px: { xs: 2, md: 3 } }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <BreadcrumbTrail
            items={[{ label: "Home", href: "/" }, { label: "Cart" }]}
          />

          <Stepper
            activeStep={activeStep}
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
          }}
        >
          {/* LEFT COLUMN: Main Content */}
          <Box>
            {errorMsg && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: "#fee2e2",
                  border: "1px solid #ef4444",
                  borderRadius: 2,
                  color: "#b91c1c",
                }}
              >
                {errorMsg}
              </Box>
            )}

            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid #eadcd0",
                bgcolor: "#fffaf7",
                overflow: "hidden",
              }}
            >
              {/* --- STEP 1: CART ITEMS --- */}
              {activeStep === 0 && (
                <>
                  <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #eadcd0" }}>
                    <Typography variant="subtitle1" fontWeight={800}>
                      Shopping Cart ({items.length})
                    </Typography>
                  </Box>

                  {items.length === 0 ? (
                    <Box sx={{ p: 6, textAlign: "center" }}>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        gutterBottom
                      >
                        Your cart is empty
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => router.push("/shop")}
                      >
                        Start Shopping
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={0}>
                      {items.map((item, idx) => (
                        <Box key={item.id} sx={{ px: 3, py: 3 }}>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "80px 1fr",
                                sm: "100px 1fr auto",
                              },
                              gap: { xs: 2, sm: 3 },
                              alignItems: "center",
                            }}
                          >
                            <Paper
                              variant="outlined"
                              sx={{
                                borderColor: "#eadcd0",
                                bgcolor: "white",
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  position: "relative",
                                  width: "100%",
                                  pt: "100%",
                                }}
                              >
                                <Image
                                  src={
                                    item.imageUrl ||
                                    buildPublicProductImageUrl(item.imageId)
                                  }
                                  alt={item.name}
                                  fill
                                  sizes="120px"
                                  style={{ objectFit: "contain" }}
                                />
                              </Box>
                            </Paper>

                            <Stack spacing={0.5}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="#1f2937"
                              >
                                {item.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={800}
                                color="#c56a1b"
                              >
                                ${item.price.toFixed(2)}
                              </Typography>
                            </Stack>

                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              alignItems="center"
                              spacing={1}
                              sx={{ justifySelf: "end" }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => decrement(item.id)}
                                sx={{ border: "1px solid #e5e7eb" }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{ minWidth: 20, textAlign: "center" }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => increment(item.id)}
                                sx={{ border: "1px solid #e5e7eb" }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => remove(item.id)}
                                sx={{ ml: 1, color: "#ef4444" }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Box>
                          {idx < items.length - 1 && (
                            <Divider sx={{ mt: 3, borderColor: "#f0e5dd" }} />
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </>
              )}

              {/* --- STEP 2: SHIPPING --- */}
              {activeStep === 1 && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Shipping Details
                  </Typography>
                  <Box
                    component="form"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 3,
                      mt: 2,
                    }}
                  >
                    <TextField
                      label="Full Name"
                      variant="outlined"
                      fullWidth
                      value={shippingDetails.fullName}
                      onChange={handleShippingChange("fullName")}
                      required
                    />
                    <TextField
                      label="Phone Number"
                      variant="outlined"
                      fullWidth
                      value={shippingDetails.phoneNumber}
                      onChange={handleShippingChange("phoneNumber")}
                      required
                    />
                    <TextField
                      label="Street Address"
                      variant="outlined"
                      fullWidth
                      sx={{ gridColumn: { sm: "1 / -1" } }}
                      value={shippingDetails.streetAddress}
                      onChange={handleShippingChange("streetAddress")}
                      required
                    />
                    <TextField
                      label="City"
                      variant="outlined"
                      fullWidth
                      value={shippingDetails.city}
                      onChange={handleShippingChange("city")}
                      required
                    />
                    <TextField
                      label="State / Province"
                      variant="outlined"
                      fullWidth
                      value={shippingDetails.state}
                      onChange={handleShippingChange("state")}
                    />
                    <TextField
                      label="Zip / Postal Code"
                      variant="outlined"
                      fullWidth
                      value={shippingDetails.zipCode}
                      onChange={handleShippingChange("zipCode")}
                    />
                    <TextField
                      label="Country"
                      variant="outlined"
                      fullWidth
                      value={shippingDetails.country}
                      onChange={handleShippingChange("country")}
                    />
                  </Box>
                </Box>
              )}

              {/* --- STEP 3: PAYMENT / REVIEW --- */}
              {activeStep === 2 && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Review & Pay
                  </Typography>

                  <Stack spacing={3}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="text.secondary"
                      >
                        Shipping To:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ mt: 0.5 }}
                      >
                        {shippingDetails.fullName}
                      </Typography>
                      <Typography variant="body2">
                        {shippingDetails.streetAddress}
                      </Typography>
                      <Typography variant="body2">
                        {shippingDetails.city}, {shippingDetails.country}
                      </Typography>
                      <Typography variant="body2">
                        {shippingDetails.phoneNumber}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setActiveStep(1)}
                        sx={{ mt: 1, textTransform: "none" }}
                      >
                        Edit
                      </Button>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        gutterBottom
                      >
                        Payment Method
                      </Typography>
                      <RadioGroup
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as PaymentMethod)
                        }
                      >
                        <FormControlLabel
                          value="evc_plus"
                          control={<Radio size="small" />}
                          label="EVC Plus (Somali Mobile Money)"
                        />
                        <FormControlLabel
                          value="edahab"
                          control={<Radio size="small" />}
                          label="eDahab (Somali Mobile Money)"
                        />
                        <FormControlLabel
                          value="card"
                          control={<Radio size="small" />}
                          label="Credit / Debit Card"
                        />
                        <FormControlLabel
                          value="test_payment"
                          control={<Radio size="small" />}
                          label="Test Payment (Fake - No validation)"
                        />
                        <FormControlLabel
                          value="cod"
                          control={<Radio size="small" disabled />}
                          label="Cash on Delivery (Coming Soon)"
                        />
                      </RadioGroup>

                      {/* Mobile Payment Form */}
                      {(paymentMethod === "evc_plus" ||
                        paymentMethod === "edahab") && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            border: "1px solid #e5e7eb",
                            borderRadius: 2,
                            bgcolor: "#f9fafb",
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            display="block"
                            gutterBottom
                          >
                            Enter your mobile money phone number:
                          </Typography>
                          <TextField
                            label="Phone Number"
                            placeholder="252..."
                            size="small"
                            fullWidth
                            value={paymentPhoneNumber}
                            onChange={(e) =>
                              setPaymentPhoneNumber(e.target.value)
                            }
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  +
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                      )}

                      {/* Card Payment Form */}
                      {paymentMethod === "card" && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            border: "1px solid #e5e7eb",
                            borderRadius: 2,
                            bgcolor: "#f9fafb",
                          }}
                        >
                          <Stack spacing={2}>
                            <TextField
                              label="Card Number"
                              placeholder="0000 0000 0000 0000"
                              size="small"
                              fullWidth
                              value={cardDetails.number}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  number: e.target.value,
                                })
                              }
                            />
                            <Stack direction="row" spacing={2}>
                              <TextField
                                label="Expiry"
                                placeholder="MM/YY"
                                size="small"
                                value={cardDetails.expiry}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    expiry: e.target.value,
                                  })
                                }
                              />
                              <TextField
                                label="CVC"
                                placeholder="123"
                                size="small"
                                value={cardDetails.cvc}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    cvc: e.target.value,
                                  })
                                }
                              />
                            </Stack>
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Footer Actions */}
              <Box
                sx={{
                  p: 3,
                  borderTop: "1px solid #eadcd0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {activeStep > 0 ? (
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    color="inherit"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {activeStep < 2 ? (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleNext}
                    disabled={items.length === 0}
                    sx={{ fontWeight: 800, px: 4 }}
                  >
                    {activeStep === 0
                      ? "Continue to Shipping"
                      : "Continue to Payment"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    size="large"
                    sx={{ fontWeight: 800, px: 4 }}
                  >
                    {isPlacingOrder
                      ? "Processing..."
                      : `Pay $${total.toFixed(2)}`}
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>

          {/* RIGHT COLUMN: Order Summary */}
          <Box>
            <Stack spacing={2} sx={{ position: { md: "sticky" }, top: 24 }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #eadcd0",
                  bgcolor: "#fffaf7",
                  p: 2.5,
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Order Summary
                  </Typography>

                  <Stack spacing={1}>
                    <Row
                      label="Subtotal"
                      value={`$${cartSubtotal.toFixed(2)}`}
                    />

                    {/* Delivery Toggle (only meaningful in step 0 or 1 really, but visible always) */}
                    {activeStep < 2 && (
                      <Box sx={{ py: 1 }}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                        >
                          Delivery Method
                        </Typography>
                        <RadioGroup
                          value={deliveryMethod}
                          onChange={(e) =>
                            setDeliveryMethod(e.target.value as DeliveryMethod)
                          }
                        >
                          <FormControlLabel
                            value="delivery"
                            control={<Radio size="small" />}
                            label={
                              <DeliveryLabel
                                title="Delivery"
                                price={FEES.delivery}
                                icon={<LocalShippingIcon fontSize="small" />}
                              />
                            }
                          />
                          <FormControlLabel
                            value="pickup"
                            control={<Radio size="small" />}
                            label={
                              <DeliveryLabel
                                title="Pick Up"
                                price={0}
                                icon={
                                  <StoreMallDirectoryIcon fontSize="small" />
                                }
                                muted
                              />
                            }
                          />
                        </RadioGroup>
                      </Box>
                    )}

                    <Divider />
                    <Row
                      label="Delivery"
                      value={
                        deliveryMethod === "delivery"
                          ? `$${FEES.delivery.toFixed(2)}`
                          : "Free"
                      }
                    />
                    <Row
                      label="Service Fee"
                      value={`$${FEES.service.toFixed(2)}`}
                    />
                    <Row label="Tax (10%)" value={`$${taxCost.toFixed(2)}`} />
                    <Divider />
                    <Row
                      label="Total Payable"
                      value={`$${total.toFixed(2)}`}
                      labelStrong
                      valueStrong
                    />
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      fontWeight={700}
                    >
                      Have a coupon?
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        fullWidth
                        InputProps={{ sx: { bgcolor: "white" } }}
                      />
                      <Button variant="outlined" color="inherit">
                        Apply
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  By placing this order, you agree to our Terms of Service and
                  Privacy Policy.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// --- Subcomponents ---

function Row({
  label,
  value,
  labelStrong,
  valueStrong,
}: {
  label: string;
  value: string;
  labelStrong?: boolean;
  valueStrong?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography
        variant="body2"
        fontWeight={labelStrong ? 800 : 500}
        color="#4b5563"
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={valueStrong ? 900 : 700}
        color={valueStrong ? "#c56a1b" : "#111827"}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function DeliveryLabel({
  title,
  price,
  icon,
  muted,
}: {
  title: string;
  price: number;
  icon: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ color: muted ? "#9ca3af" : "#111827" }}
    >
      {icon}
      <Typography variant="body2" fontWeight={600}>
        {title}
      </Typography>
      {price > 0 && (
        <Typography variant="caption" color="text.secondary">
          (+${price.toFixed(2)})
        </Typography>
      )}
    </Stack>
  );
}

