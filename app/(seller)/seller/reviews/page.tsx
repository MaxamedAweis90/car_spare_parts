"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "@/lib/auth/useSession";
import {
  appwriteClientConfig,
  client,
  databasesClient,
} from "@/lib/api/appwrite";
import { Query } from "appwrite";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import CircularProgress from "@mui/material/CircularProgress";
import Rating from "@mui/material/Rating";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export default function SellerReviewsPage() {
  const { authenticated, profile, loading: authLoading } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (authenticated && profile?.$id) {
      fetchReviews();
    }
  }, [authenticated, profile?.$id, authLoading]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Query reviews where sellerId == profile.$id
      const res = await databasesClient.listDocuments(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.reviewsCollectionId,
        [
          Query.equal("sellerId", profile?.$id || ""),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ],
      );
      setReviews(res.documents);

      // Fetch ALL products for this seller (limit 100)
      // We will then filter this list client-side to only keep products that appear in the reviews.
      // This avoids potential issues with Query.equal('$id', array) if the list is long or unsupported.
      const productsRes = await databasesClient.listDocuments(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        [Query.equal("sellerId", profile?.$id || ""), Query.limit(100)],
      );

      const map: Record<string, any> = {};
      const productIdsSet = new Set(res.documents.map((r) => r.productId));

      productsRes.documents.forEach((p) => {
        // Only add to map if this product is actually in the reviews list
        if (productIdsSet.has(p.$id)) {
          map[p.$id] = p;
        }
      });
      setProductsMap(map);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // Filter Logic (Simple client-side for now)
  // New = created in last 7 days? Or just all?
  // Requirement says "New Reviews (recent/unseen) and All Reviews list".
  // Let's define "New" as last 3 days
  const now = new Date();
  const threeDaysAgo = new Date(now.setDate(now.getDate() - 3));

  const newReviews = reviews.filter(
    (r) => new Date(r.$createdAt) > threeDaysAgo,
  );

  // Apply Tab Filter THEN Product Filter
  const tabFiltered = tab === 0 ? newReviews : reviews;

  const displayedReviews = tabFiltered.filter((r) => {
    if (selectedProduct) {
      return r.productId === selectedProduct.$id;
    }
    return true;
  });

  if (loading)
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Customer Reviews
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        See what customers are saying about your products.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={handleChangeTab}>
          <Tab label={`New Reviews (${newReviews.length})`} />
          <Tab label={`All Reviews (${reviews.length})`} />
        </Tabs>
      </Box>

      {/* Product Filter Dropdown */}
      <Box sx={{ mb: 4, maxWidth: 400 }}>
        <Autocomplete
          options={Object.values(productsMap)}
          getOptionLabel={(option) => option.name || "Unknown Product"}
          value={selectedProduct}
          onChange={(event, newValue) => setSelectedProduct(newValue)}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps}>
                {option.images?.[0] && (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      overflow: "hidden",
                      mr: 2,
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={option.images[0]}
                      alt={option.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                )}
                <Typography variant="body2">{option.name}</Typography>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Product"
              placeholder="Search for a product..."
              variant="outlined"
              size="small"
            />
          )}
        />
      </Box>

      {displayedReviews.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            No reviews found in this category.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {displayedReviews.map((review) => {
            const product = productsMap[review.productId];
            return (
              <Paper key={review.$id} sx={{ p: 3, borderRadius: 2 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={3}
                  justifyContent="space-between"
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">
                        • {new Date(review.$createdAt).toLocaleDateString()}
                      </Typography>
                      {tab === 0 && (
                        <Chip
                          label="New"
                          color="success"
                          size="small"
                          sx={{ height: 20, fontSize: "0.6rem" }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body1" fontWeight={500} gutterBottom>
                      {review.comment || "No comment provided."}
                    </Typography>

                    {/* Updated Product Display */}
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                      }}
                    >
                      {product?.images?.[0] && (
                        <Box
                          sx={{
                            position: "relative",
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        </Box>
                      )}
                      <Box>
                        <Typography variant="subtitle2">
                          {product
                            ? product.name
                            : `Product ID: ${review.productId.slice(0, 8)}...`}
                        </Typography>
                        {product && (
                          <Typography variant="caption" color="text.secondary">
                            {product.category || "General"}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      minWidth: 200,
                      borderLeft: { md: "1px solid #eee" },
                      pl: { md: 3 },
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Order ID
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      #{review.orderId.slice(-8).toUpperCase()}
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      Customer ID
                    </Typography>
                    <Typography variant="body2">
                      {review.customerId.slice(-8)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
