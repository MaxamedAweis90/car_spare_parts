# Admin Catalog Management (Appwrite Manual Setup)

This project adds admin-only APIs under `app/api/admin/*` and an admin UI at `/admin/catalog`.
Admins can manage **Categories**, **Compatibilities**, and **Products**.

## 1) Environment variables

Required for admin APIs:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PRODUCTS_COLLECTION_ID`

For catalog collections:

- `APPWRITE_CATEGORIES_COLLECTION_ID`

For compatibilities/options collection (you can use either name):

- `APPWRITE_COMPATIBILITIES_COLLECTION_ID` (your current setup)
- OR `APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID`

For product image replacement (admin can replace images):

- `APPWRITE_PRODUCT_BUCKET_ID`

## 2) Categories collection (admin CRUD)

Collection ID: `APPWRITE_CATEGORIES_COLLECTION_ID`

Attributes:
- `name` (string) — required
- `parentCategoryId` (string) — optional
- `type` (string) — optional

Recommended indexes:
- Index on `name` (admin + seller UIs list categories ordered by name)

Admin API routes:
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/categories/[categoryId]`
- `PATCH /api/admin/categories/[categoryId]`
- `DELETE /api/admin/categories/[categoryId]`

## 3) Compatibilities collection (admin CRUD)

This project treats compatibilities as **admin-managed** entries stored in a dedicated collection.

Collection ID: `APPWRITE_COMPATIBILITIES_COLLECTION_ID` (or `APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID`)

Attributes (important):
- `productId` (string) — optional
  - In your screenshot, `productId` is currently an **integer and required**. That will NOT work.
  - Products in this app use Appwrite document `$id` (string). So `productId` must be a **string**.
- If you cannot change the existing attribute type, create a new collection (recommended) or delete/recreate the attribute.
- `vehicleType` (string) — required
- `make` (string) — required
- `model` (string) — required
- `yearFrom` (integer) — required
- `yearTo` (integer) — required
- `label` (string) — optional (if omitted, UI builds a label from the fields)

Recommended indexes:
- Index on `productId` (optional, but recommended if you use product filtering)

Admin API routes:
- `GET /api/admin/compatibilities?productId=...`
- `GET /api/admin/compatibilities` (all)
- `POST /api/admin/compatibilities`
- `GET /api/admin/compatibilities/[compatibilityId]`
- `PATCH /api/admin/compatibilities/[compatibilityId]`
- `DELETE /api/admin/compatibilities/[compatibilityId]`

Seller usage:
- Seller edit screens consume read-only options via `GET /api/seller/compatibility-options`.

## 4) Products management (admin)

Admins can view and edit any product.

Admin API routes:
- `GET /api/admin/products`
- `GET /api/admin/products/[productId]`
- `PATCH /api/admin/products/[productId]` (multipart form)
- `DELETE /api/admin/products/[productId]`

Editable fields include:
- core: `name`, `description`, `price`, `stock`
- ownership: `sellerId`
- classification: `mainCategoryId`
- metadata: `brand`, `condition`, `partNumber`
- images: `replaceImages=true` + `images[]`
- assignment: `compatibilityOptionIds` (array of compatibility document IDs)

## 5) Permissions & security model

- UI access:
  - Admin pages are protected by `app/(admin)/layout.tsx` (roles `admin` and `main_admin`).
- API access:
  - Admin APIs use `requireAdmin()` which validates role server-side.
- Appwrite permissions:
  - The server uses an API key (`APPWRITE_API_KEY`) so it can create/update/delete documents regardless of per-document permissions.
  - For storage uploads:
    - Images are uploaded public-read.
    - Admin uploads do not assign a user update/delete permission; deletion is done server-side via API key.

## 6) Testing checklist

- Go to `/auth/admin/login` and login as an admin.
- Open `/admin/catalog`:
  - Categories tab:
    - Create, edit, delete categories
  - Compatibilities tab:
    - Pick a product, create compatibilities, edit, delete
  - Products tab:
    - Open a product and edit name/category/sellerId
    - Replace images
    - Assign compatibilities and save

Expected:
- Admin can edit any seller product.
- Compatibility assignments reflect on product document via `compatibilityOptionIds`.
