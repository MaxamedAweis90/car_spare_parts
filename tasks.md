# Project Tasks: Frontend Upgrade

## Phase 1: Infrastructure & Setup (Completed)

- [x] Install dependencies (`@tanstack/react-query`, `zustand`, `antd`, etc.)
- [x] Setup `QueryProvider` and `AntdRegistryProvider`
- [x] Integrate Providers into `app/layout.tsx`
- [x] Create Global UI Store (`stores/ui-store.ts`)
- [x] Create React Query Hooks:
  - `useProducts` (with filters, pagination)
  - `useOrders`

## Phase 2: Layout & Navigation (Refactored)

- [x] Check & Refactor `app/(admin)/layout.tsx` to Ant Design
- [x] Check & Refactor `app/(seller)/layout.tsx` to Ant Design

## Phase 3: Product Page Implementation

- [x] Implement Main Product Image & Thumbnails
- [x] Implement Product Info & Sidebar (Breadcrumbs, Categories, etc.)
- [x] Implement Product Details (Price, Stock Bar, Buttons)
- [x] Implement Bottom Tabs (Description, Video, Reviews)
- [x] Implement Related Products section
  - [x] Refine Gallery (Hover selection, Image fitting)
  - [x] Finalize Navigation Fixes (Regular products)
- [ ] **Data Tables**:
  - `AdminProductsTable` / `SellerProductsTable` with sorting/filtering
  - `OrdersTable`

## Phase 4: Product Management

- [ ] **Add/Edit Product Form**:
  - Convert existing form to Antd Form
  - Connect to `useCreateProduct` / `useUpdateProduct`
- [ ] **Categories Management**:
  - Implement Category tree/list using Antd

## Phase 5: Testing & Polish

- [ ] Verify Admin/Seller Access flow
- [ ] Check Mobile Responsiveness
- [ ] Optimize loading states (Skeleton screens)
