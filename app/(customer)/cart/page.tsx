"use client";

import { useState, useEffect } from "react";
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
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StoreMallDirectoryIcon from "@mui/icons-material/StoreMallDirectory";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import PaymentIcon from "@mui/icons-material/Payment";
import LockIcon from "@mui/icons-material/Lock";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { BreadcrumbTrail } from "@/components/ui/BreadcrumbTrail";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/auth/useSession";

// --- Types ---
type DeliveryMethod = "delivery" | "pickup";
type PaymentMethodId = "stripe" | "paypal" | "evc_plus" | "edahab";

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

// Initialize Stripe outside of render to avoid recreating it
// Make sure to populate NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

// --- Helper Functions ---
function buildPublicProductImageUrl(fileId?: string | null) {
  if (!fileId) return "/placeholder.png";
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!endpoint || !project || !bucket) return "/placeholder.png";
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`,
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/auth/login?redirect=/cart");
    }
  }, [authLoading, authenticated, router]);

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

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // --- Derived State ---
  const deliveryCost = deliveryMethod === "delivery" ? FEES.delivery : 0;
  const taxCost = cartSubtotal * FEES.taxRate;
  const total = cartSubtotal + deliveryCost + FEES.service + taxCost;

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

  const handleOrderComplete = () => {
    setOrderSuccess(true);
    clear();
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
                    {/* Other fields */}
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

              {/* --- STEP 3: PAYMENT --- */}
              {activeStep === 2 && (
                <StripePaymentWrapper
                  total={total}
                  items={items}
                  shippingDetails={shippingDetails}
                  onSuccess={handleOrderComplete}
                  onBack={handleBack}
                  profile={profile}
                  authenticated={authenticated}
                />
              )}

              {/* Footer Actions (Only for Step 0 and 1) */}
              {activeStep < 2 && (
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

                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleNext}
                    disabled={items.length === 0}
                    sx={{ fontWeight: 800, px: 4 }}
                  >
                    Continue
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>

          {/* RIGHT COLUMN: Order Summary (Same as before) */}
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
                </Stack>
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// --- Payment Sub-component ---
function StripePaymentWrapper({
  total,
  items,
  shippingDetails,
  onSuccess,
  onBack,
  profile,
  authenticated,
}: {
  total: number;
  items: any[];
  shippingDetails: ShippingDetails;
  onSuccess: () => void;
  onBack: () => void;
  profile: any;
  authenticated: boolean;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Initialize Payment Intent on mount
  useEffect(() => {
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total, currency: "usd" }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => console.error(err));
  }, [total]);

  // Options for Stripe Elements
  const options = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: "stripe",
    } as const,
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Payment Method
      </Typography>

      {clientSecret ? (
        <Elements options={options} stripe={stripePromise}>
          <PaymentForm
            clientSecret={clientSecret}
            onSuccess={onSuccess}
            onBack={onBack}
            items={items}
            shippingDetails={shippingDetails}
            profile={profile}
            authenticated={authenticated}
            total={total}
          />
        </Elements>
      ) : (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <Typography>Loading secure payment...</Typography>
        </Box>
      )}
    </Box>
  );
}

function PaymentForm({
  clientSecret,
  onSuccess,
  onBack,
  items,
  shippingDetails,
  profile,
  authenticated,
  total,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleMethodSelect = (method: PaymentMethodId) => {
    setSelectedMethod(method);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !selectedMethod) {
      return;
    }

    // Only Stripe is functional
    if (selectedMethod !== "stripe") {
      return;
    }

    setIsLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "An error occurred");
        setIsLoading(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment success! Now create order in backend
        await createOrder(paymentIntent.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (paymentIntentId: string) => {
    try {
      // Construct Shipping Address string
      const addressString = `${shippingDetails.fullName}, ${shippingDetails.streetAddress}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}. Phone: ${shippingDetails.phoneNumber}`;

      const payload = {
        customerId: profile?.$id || "guest", // or session
        items: items.map((item: any) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: addressString,
        paymentMethod: "stripe",
        paymentDetails: {
          pi: paymentIntentId,
          ps: "paid",
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create order");

      onSuccess();
    } catch (error: any) {
      setErrorMessage(
        "Payment succeeded but order creation failed. Please contact support. Ref: " +
          paymentIntentId,
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        {/* Payment Method Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* Stripe */}
          <PaymentCard
            selected={selectedMethod === "stripe"}
            onClick={() => handleMethodSelect("stripe")}
            icon={
              <Box
                sx={{
                  bgcolor: "#333",
                  color: "white",
                  px: 1,
                  borderRadius: 1,
                  fontWeight: 900,
                  fontFamily: "sans-serif",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                stripe{" "}
                <span style={{ fontWeight: 400, fontSize: "0.8rem" }}>
                  Test
                </span>
              </Box>
            }
            label="Stripe"
            dark
          />

          {/* PayPal */}
          <PaymentCard
            selected={selectedMethod === "paypal"}
            onClick={() => handleMethodSelect("paypal")}
            icon={
              <Box
                sx={{
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  color: "#003087",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#003087" }}>Pay</span>
                <span style={{ color: "#009cde" }}>Pal</span>
              </Box>
            }
            label="PayPal"
          />

          {/* EVC Plus */}
          <PaymentCard
            selected={selectedMethod === "evc_plus"}
            onClick={() => handleMethodSelect("evc_plus")}
            icon={<SmartphoneIcon sx={{ color: "#555" }} />}
            label="EVC Plus"
          />

          {/* eDahab */}
          <PaymentCard
            selected={selectedMethod === "edahab"}
            onClick={() => handleMethodSelect("edahab")}
            icon={<CurrencyExchangeIcon sx={{ color: "#555" }} />}
            label="eDahab"
          />
        </Box>

        {/* Content based on selection */}
        <Box sx={{ minHeight: 120 }}>
          {!selectedMethod && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Please select a payment method to proceed.
            </Typography>
          )}

          {selectedMethod !== "stripe" && selectedMethod !== null && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              This payment method (
              {selectedMethod === "evc_plus"
                ? "EVC Plus"
                : selectedMethod === "edahab"
                  ? "eDahab"
                  : "PayPal"}
              ) is coming soon. Please use Stripe Test for now.
            </Alert>
          )}

          {selectedMethod === "stripe" && (
            <Stack spacing={2} sx={{ animation: "fadeIn 0.3s ease-in" }}>
              <Alert severity="success" icon={<CreditCardIcon />}>
                Test Mode Active: Use card <strong>4242 4242 4242 4242</strong>{" "}
                with any future date and CVC.
              </Alert>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #e5e7eb",
                  borderRadius: 2,
                  bgcolor: "white",
                }}
              >
                <PaymentElement />
              </Box>
            </Stack>
          )}
        </Box>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            pt: 2,
            borderTop: "1px solid #eee",
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            color="inherit"
          >
            Back
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="warning"
            size="large"
            disabled={
              selectedMethod !== "stripe" || isLoading || !stripe || !elements
            }
            sx={{ fontWeight: 800, px: 4 }}
          >
            {isLoading ? "Processing..." : `Pay $${total.toFixed(2)}`}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}

function PaymentCard({
  selected,
  onClick,
  icon,
  label,
  dark,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  dark?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        cursor: "pointer",
        border: selected ? "2px solid #c56a1b" : "1px solid #e5e7eb",
        bgcolor: dark
          ? selected
            ? "#1f2937"
            : "#000"
          : selected
            ? "#fffaf7"
            : "white",
        color: dark ? "white" : "inherit",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "#c56a1b",
          bgcolor: dark ? "#374151" : "#fdf6f3",
        },
        height: 60,
      }}
    >
      {icon}
      {!dark && label !== "PayPal" && (
        <Typography fontWeight={700} variant="body2">
          {label}
        </Typography>
      )}
    </Paper>
  );
}

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
