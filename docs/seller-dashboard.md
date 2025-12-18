# Seller Dashboard Notes

## Structure
- Layout: `/app/(seller)/layout.tsx` with sidebar, top bar, and protected shell for seller-only routes.
- Routes: `/seller` → `/seller/dashboard` (redirect), products (`/seller/products`, `/seller/products/new`, `/seller/products/inventory`, `/seller/products/categories`), `/seller/orders`, `/seller/earnings`, `/seller/settings`, `/seller/profile`, `/seller/support`.
- UI: Tailwind + MUI (cards, tables, chips, menus). Sidebar icons via MUI Icons.

## Permissions
- Access limited to `role = seller`; pending sellers are redirected to `/auth/seller/pending`.
- Layout uses `useSession` (Appwrite-backed) to gate all seller routes.
- No admin/customer flow changes.

## Order Status Flow
- Lifecycle: `New → Accepted → Shipped → Completed` (with `Cancelled` branch).
- Sellers can only update status; completed/cancelled orders are locked.
- Price edits and deletions are disallowed post-order (policy stubbed in UI for now).

## Product Visibility Rules
- Draft products stay hidden from customers.
- Published products should require stock > 0; optionally auto-disable when stock hits 0.
- Multiple image upload with cover inferred from first image (UI stubbed).

## Extension Points
- Wire tables to Appwrite collections (products, orders) filtered by `sellerId` for isolation.
- Add server actions/API routes for seller CRUD, inventory thresholds, and payouts.
- Add date-range filters, CSV export, and lightweight charts on dashboard/earnings.
- Implement notifications (orders, low stock) feeding the top-bar badge.
- Harden logout to call `/api/auth/logout` once available.
