"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ProcessPaymentModal from "@/components/payment/ProcessPaymentModal";

import { useSession } from "@/lib/auth/useSession";
import { BreadcrumbTrail } from "@/components/ui/BreadcrumbTrail";
import {
  client,
  appwriteClientConfig,
  databasesClient,
} from "@/lib/api/appwrite";
import { Query } from "appwrite";
import { getStatusLabel } from "@/lib/utils/orderStatusTransitions";

interface Order {
  $id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: string[];
  shippingAddress: string;
  paymentMethod: string;
  customerId?: string;
}

// Simple Review Form Component
function ReviewForm({ orderId, productId, existingReview, onSubmit }: any) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync if existingReview updates (from server)
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a star rating");
    setIsSubmitting(true);
    await onSubmit(orderId, productId, rating, comment);
    setIsSubmitting(false);
  };

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Stack direction="row" spacing={0.5}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Box
            key={star}
            onClick={() => setRating(star)}
            sx={{
              cursor: "pointer",
              color: star <= rating ? "#fbbf24" : "#e5e7eb",
            }}
          >
            <span style={{ fontSize: "20px" }}>★</span>
          </Box>
        ))}
      </Stack>
      <textarea
        className="w-full rounded border border-gray-300 p-2 text-sm"
        rows={2}
        placeholder="Write a review..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button
        variant="contained"
        size="small"
        disabled={isSubmitting}
        onClick={handleSubmit}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
      >
        {existingReview ? "Update Review" : "Submit Review"}
      </Button>
    </Stack>
  );
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { authenticated, profile, loading: authLoading } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handlePayClick = (order: Order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      router.push("/auth/login?redirect=/orders");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders?customerId=${profile?.$id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch orders");
        setOrders(data.orders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authenticated, authLoading, profile?.$id, router]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!profile?.$id) return;

    const channel = `databases.${appwriteClientConfig.databaseId}.collections.${appwriteClientConfig.ordersCollectionId}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      // Check if the event is relevant to us (e.g. update)
      // The payload contains the node 'payload' which is the document
      const event = response.events[0];
      const payload = response.payload as Order;

      if (!payload) return;

      // We only care if it's OUR order (filtered by customerId potentially, but subscription listens to all unless row-level security blocks it, which it should)
      // Appwrite subscriptions respect permissions. If we can see it, we receive it.

      // However, usually we might confuse creation vs update.
      // If Create: add to list?
      // If Update: update item in list?
      // If Delete: remove from list?

      if (
        event.endsWith(".create") &&
        (payload as any).customerId === profile.$id
      ) {
        setOrders((prev) => [payload, ...prev]);
      } else if (event.endsWith(".update")) {
        setOrders((prev) =>
          prev.map((o) => (o.$id === payload.$id ? payload : o)),
        );
      } else if (event.endsWith(".delete")) {
        setOrders((prev) => prev.filter((o) => o.$id !== payload.$id));
      }
    });

    return () => {
      unsubscribe();
    };
    return () => {
      unsubscribe();
    };
  }, [profile?.$id]);

  // --- REVIEWS LOGIC ---
  const [reviews, setReviews] = useState<Record<string, any>>({}); // Key: `${orderId}-${productId}`

  const fetchReviews = async () => {
    // Fetch all reviews by this customer (in a real app, maybe filter by recent or visible orders)
    try {
      // Corrected: Use databasesClient and Query directly
      const res = await databasesClient.listDocuments(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.reviewsCollectionId,
        [Query.equal("customerId", profile?.$id || "")], // Assuming we can filter by customer
      );

      const reviewMap: Record<string, any> = {};
      res.documents.forEach((doc: any) => {
        reviewMap[`${doc.orderId}-${doc.productId}`] = doc;
      });
      setReviews(reviewMap);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    }
  };

  useEffect(() => {
    if (authenticated && profile?.$id) {
      fetchReviews();
    }
  }, [authenticated, profile?.$id]);

  const handleSubmitReview = async (
    orderId: string,
    productId: string,
    rating: number,
    comment: string,
  ) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setReviews((prev) => ({
        ...prev,
        [`${orderId}-${productId}`]: data.review,
      }));
      alert("Review submitted!");
    } catch (e: any) {
      alert(e.message);
    }
  };
  // ---------------------

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_verification":
        return "warning";
      case "awaiting_payment":
        return "info";
      case "paid":
      case "approved_for_fulfillment":
      case "delivered":
      case "completed":
        return "success";
      case "packing":
        return "info";
      case "shipped":
        return "primary";
      case "rejected":
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="warning" />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#fdf6f3", minHeight: "100vh", py: { xs: 4, md: 6 } }}>
      <Box sx={{ mx: "auto", maxWidth: "1000px", px: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <BreadcrumbTrail
            items={[{ label: "Home", href: "/" }, { label: "My Orders" }]}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h4" fontWeight={800} color="slate.900">
              My Orders
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {orders.length} orders total
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={() => router.push("/customer/wallet")}
                size="small"
              >
                Manage Wallet
              </Button>
            </Stack>
          </Box>

          {orders.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: "center", borderRadius: 4 }}>
              <ShoppingBagIcon sx={{ fontSize: 60, color: "#e5e7eb", mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No orders yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>
                You haven't placed any orders yet. Start shopping to see your
                orders here!
              </Typography>
              <Button
                variant="contained"
                color="warning"
                onClick={() => router.push("/shop")}
                sx={{ borderRadius: 99, px: 4 }}
              >
                Go Shopping
              </Button>
            </Paper>
          ) : (
            <Stack spacing={2.5}>
              {orders.map((order) => {
                const date = new Date(order.createdAt).toLocaleDateString(
                  "en-GB",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  },
                );

                let orderItems: any[] = [];
                try {
                  orderItems = order.items.map((it) => JSON.parse(it));
                } catch (e) {}

                return (
                  <Paper
                    key={order.$id}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid #eadcd0",
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "#f9f7f2",
                        borderBottom: "1px solid #eadcd0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      <Stack direction="row" spacing={4}>
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            textTransform="uppercase"
                          >
                            Order Placed
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {date}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            textTransform="uppercase"
                          >
                            Total
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            ${order.totalPrice.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            textTransform="uppercase"
                          >
                            Ship To
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              maxWidth: 150,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {order.shippingAddress.split(",")[0]}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                          textTransform="uppercase"
                        >
                          Order #
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color="warning.main"
                        >
                          {order.$id.slice(-8).toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ p: 3 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        sx={{ mb: 3 }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={800}
                            gutterBottom
                          >
                            {getStatusLabel(order.status as any)}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <LocalShippingIcon
                              sx={{ fontSize: 18, color: "text.secondary" }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {order.status === "shipped"
                                ? "Your package is on the way."
                                : order.status === "awaiting_payment"
                                  ? "Please complete payment to proceed."
                                  : order.status === "pending_verification"
                                    ? "Seller is reviewing your order."
                                    : "Check status updates below."}
                            </Typography>
                          </Stack>
                        </Box>
                        <Chip
                          label={getStatusLabel(
                            order.status as any,
                          ).toUpperCase()}
                          color={getStatusColor(order.status) as any}
                          sx={{ fontWeight: 800, borderRadius: 1 }}
                        />
                      </Stack>

                      <Divider sx={{ mb: 3 }} />

                      <Stack spacing={2}>
                        {orderItems.map((item, idx) => (
                          <Box key={idx} sx={{ display: "flex", gap: 2 }}>
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                bgcolor: "#f5f5f5",
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #eee",
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  style={{ objectFit: "contain" }}
                                />
                              ) : (
                                <ShoppingBagIcon sx={{ color: "#ddd" }} />
                              )}
                            </Box>

                            {/* Item Details & Review Widget */}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {(item as any).name || "Produt Name"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Quantity: {(item as any).quantity}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{ mt: 0.5 }}
                              >
                                ${(item as any).price?.toFixed(2)}
                              </Typography>

                              {/* REVIEW WIDGET */}
                              {(order.status === "delivered" ||
                                order.status === "completed") && (
                                <Box
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: "white",
                                    borderRadius: 2,
                                    border: "1px dashed #e5e7eb",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight={700}
                                    color="text.secondary"
                                  >
                                    Rate & Review Product
                                  </Typography>
                                  <ReviewForm
                                    orderId={order.$id}
                                    productId={(item as any).productId}
                                    existingReview={
                                      reviews[
                                        `${order.$id}-${(item as any).productId}`
                                      ]
                                    }
                                    onSubmit={handleSubmitReview}
                                  />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>

                      <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                        {order.status === "awaiting_payment" && (
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              py: 1,
                            }}
                            onClick={() => handlePayClick(order)}
                          >
                            Pay Now (${order.totalPrice.toFixed(2)})
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          color="inherit"
                          fullWidth
                          sx={{ borderRadius: 2, textTransform: "none", py: 1 }}
                        >
                          Track Package
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          fullWidth
                          sx={{ borderRadius: 2, textTransform: "none", py: 1 }}
                        >
                          Contact Seller
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      <ProcessPaymentModal
        open={paymentModalOpen}
        onCancel={() => {
          setPaymentModalOpen(false);
          setSelectedOrder(null);
        }}
        orderId={selectedOrder?.$id || ""}
        amount={selectedOrder?.totalPrice || 0}
      />
    </Box>
  );
}
