# Seller Products + Images + Compatibility (Appwrite Manual Setup)

This project’s seller dashboard uses server-side Appwrite APIs under `app/api/seller/*`.
These endpoints expect specific Appwrite collections/buckets and a few env vars.

## 1) Environment variables

Add these to your `.env.local` (names match what the code reads):

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server key; required for image upload/delete)
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PRODUCTS_COLLECTION_ID` (already used by existing products code)

New for this seller workflow:

- `APPWRITE_PRODUCT_BUCKET_ID` (storage bucket id for product images)
- `APPWRITE_CATEGORIES_COLLECTION_ID` (database collection id for categories)
- `APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID` (database collection id for compatibility options)

Notes:
- The code also accepts `NEXT_PUBLIC_APPWRITE_*` variants for the three “new” IDs, but for server usage keep them as `APPWRITE_*`.

## 2) Storage: Product images bucket

Create a bucket in Appwrite Storage (example name: `product-images`).

- Bucket ID: set it to `APPWRITE_PRODUCT_BUCKET_ID`.
- File permissions: the server sets permissions per upload:
  - Read: `Role.any()` (public read for storefront rendering)
  - Update/Delete: `Role.user(<sellerAccountId>)`

No other special bucket settings are required.

## 3) Database collections

### A) Products collection

This project already has a products collection (used by public `/api/products`).
Ensure it contains these attributes (names must match exactly):

Required / core:
- `name` (string)
- `description` (string, optional)
- `price` (double)
- `stock` (integer)

Seller-specific:
- `sellerId` (string) — required
- `mainCategoryId` (string) — required
- `brand` (string, optional)
- `condition` (string, optional)
- `partNumber` (string, optional)
- `compatibilityOptionIds` (string array, optional) — selected compatibilities (admin-managed options)
- `imageIds` (string array, optional) — stores multiple storage file ids

Optional legacy/back-compat (if you already have it):
- `imageId` (string, optional) — older single-image field; seller API keeps this in sync with `imageIds[0]` when replacing images.

Recommended indexes:
- Index on `sellerId` (for seller dashboard listing)
- Index on `mainCategoryId` (for storefront/category filtering)

Permissions:
- If you rely on server routes (recommended), collection permissions can be strict because the server uses an API key.

### B) Categories collection (read-only in seller dashboard)

Create a collection for categories (seller can only READ via API):

Collection ID: set it to `APPWRITE_CATEGORIES_COLLECTION_ID`.

Attributes:
- `name` (string) — required

Recommended index:
- Index on `name` (the API orders by name)

### C) Compatibility options collection (admin-managed)

Create a collection for compatibility options (added by admin in the future). Sellers can only SELECT these options.

Collection ID: set it to `APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID`.

Attributes:
- `label` (string, optional) — if you don’t provide it, the API builds one from the fields below
- `vehicleType` (string) — required
- `make` (string) — required
- `model` (string) — required
- `yearFrom` (integer) — required
- `yearTo` (integer) — required

Recommended indexes:
- Index on `$createdAt` is not required (Appwrite provides it), but ensure attributes exist so listing works.

## 4) What routes use this setup

- Seller products list/create: `GET/POST /api/seller/products`
- Seller product get/update/delete: `GET/PATCH/DELETE /api/seller/products/[productId]`
- Seller categories list (read-only): `GET /api/seller/categories`
- Seller compatibility options list (read-only): `GET /api/seller/compatibility-options`

UI pages:
- Seller products + Add Product tab: `app/(seller)/seller/products/page.tsx`
- Seller edit product page: `app/(seller)/seller/products/[productId]/page.tsx`

## 5) Quick validation checklist

- As a seller, open `/seller/products` and confirm product list loads.
- Add Product:
  - Select a category from the dropdown (loaded from categories collection)
  - Upload multiple images
  - Select compatibility options (loaded from compatibility options collection)
  - Create
- Edit:
  - Open a product, modify fields, save
  - Enable “Replace images” and upload new images; save
- Ownership:
  - A different seller should receive a `403 Forbidden` if they try to open or edit another seller’s product id via the seller APIs.
