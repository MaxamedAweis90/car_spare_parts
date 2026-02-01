"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import {
  client,
  appwriteClientConfig,
  databasesClient,
} from "@/lib/api/appwrite";
import { Query } from "appwrite";
import { BreadcrumbTrail } from "@/components/ui/BreadcrumbTrail";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";

// Reusing the ReviewForm logic to ensure consistency
function ReviewForm({ orderId, productId, existingReview, onSubmit }: any) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <span style={{ fontSize: "24px" }}>★</span>
          </Box>
        ))}
      </Stack>
      <textarea
        className="w-full rounded border border-gray-300 p-2 text-sm"
        rows={3}
        placeholder="Share your experience..."
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
        {existingReview ? "Update" : "Submit"}
      </Button>
    </Stack>
  );
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const router = useRouter();
  // Unwrap params using React.use for compatibility
  const resolvedParams = use(params);
  const { orderId } = resolvedParams;

  const { authenticated, profile, loading: authLoading } = useSession();
  const [order, setOrder] = useState<any>(null);
  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Auth Check & Fetch Data
  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      // Force login then return here
      router.push(`/auth/login?redirect=/reviews/${orderId}`);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // A. Fetch Order
        const orderDoc = await databasesClient.getDocument(
          appwriteClientConfig.databaseId,
          appwriteClientConfig.ordersCollectionId,
          orderId as string,
        );

        // B. Verify Ownership
        if (orderDoc.customerId !== profile?.$id) {
          setError("You don't have permission to review this order.");
          setLoading(false);
          return;
        }

        setOrder(orderDoc);

        // C. Fetch Existing Reviews
        const res = await databasesClient.listDocuments(
          appwriteClientConfig.databaseId,
          appwriteClientConfig.reviewsCollectionId,
          [
            Query.equal("orderId", orderId as string),
            Query.equal("customerId", profile?.$id as string),
          ],
        );

        const reviewMap: Record<string, any> = {};
        res.documents.forEach((doc: any) => {
          reviewMap[doc.productId] = doc; // easier to map by productId here
        });
        setReviews(reviewMap);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, authenticated, orderId, profile?.$id, router]);

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
        [productId]: data.review,
      }));
      // Optional: show snackbar
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading || authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
        <Button onClick={() => router.push("/")} sx={{ mt: 2 }}>
          Go Home
        </Button>
      </Box>
    );
  }

  let items: any[] = [];
  try {
    items = order?.items.map((it: string) => JSON.parse(it)) || [];
  } catch (e) {}

  return (
    <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh", py: 6 }}>
      <Box sx={{ maxWidth: "800px", mx: "auto", px: 2 }}>
        <Stack spacing={4}>
          <BreadcrumbTrail
            items={[
              { label: "Home", href: "/" },
              { label: "My Orders", href: "/orders" },
              { label: "Review Order" },
            ]}
          />

          <Box>
            <Typography variant="h4" fontWeight={800}>
              Review Products
            </Typography>
            <Typography color="text.secondary">
              Order #{orderId.slice(-8).toUpperCase()} • {items.length} Items
            </Typography>
          </Box>

          {items.map((item, idx) => (
            <Paper key={idx} sx={{ p: 3, borderRadius: 3 }}>
              <Stack
                direction={{ xs: "col", sm: "row" }}
                spacing={3}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#f3f4f6",
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, width: "100%" }}>
                  <Typography variant="h6" fontWeight={700}>
                    {item.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Qty: {item.quantity}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <ReviewForm
                    orderId={orderId}
                    productId={item.productId}
                    existingReview={reviews[item.productId]}
                    onSubmit={handleSubmitReview}
                  />
                </Box>
              </Stack>
            </Paper>
          ))}

          <Button variant="outlined" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
