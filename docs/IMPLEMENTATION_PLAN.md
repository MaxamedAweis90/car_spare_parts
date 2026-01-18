# IMPLEMENATION PLAN: Next.js Frontend Upgrade

## Objective

Upgrade the car spare-parts e-commerce website to improve performance, admin usability, and UI design using TanStack Query, Zustand, and Ant Design, specifically focusing on Admin and Seller interfaces.

## 1. Project Setup & Configuration

- [ ] **Install Dependencies**:
  - `@tanstack/react-query`, `@tanstack/react-query-devtools`
  - `zustand`
  - `antd`, `@ant-design/nextjs-registry`, `@ant-design/icons`
- [ ] **Setup Providers**:
  - Create `components/providers/QueryProvider.tsx` to wrap the app with `QueryClientProvider`.
  - Create `components/providers/AntdConfigProvider.tsx` using `@ant-design/nextjs-registry` to ensure Ant Design works with Next.js App Router (SSR).
  - Update `app/layout.tsx` (or `(admin)/layout.tsx` & `(seller)/layout.tsx`) to include these providers.

## 2. State Management (Zustand)

- [ ] **UI Store** (`stores/ui-store.ts`):
  - Manage sidebar open/close state.
  - Manage active modal states.
  - Manage theme/display preferences if applicable.
- [ ] **Data Stores** (`stores/filter-store.ts`):
  - Manage product filters (categories, price range, search query) for client-side persistence.
  - Manage pagination state (page, limit).

## 3. Data Fetching (TanStack Query + Appwrite SDK)

- [ ] **Refactor API Layer**:
  - Move from `fetch('/api/...')` to direct Appwrite SDK calls (`databases.listDocuments`, etc.) where security permissions allow (Client-side fetching).
  - Create a custom hook layer in `hooks/queries/` and `hooks/mutations/`.
- [ ] **Hooks Implementation**:
  - `useProducts`: Fetch products with support for pagination, sorting, and filtering.
  - `useProduct`: Fetch single product details.
  - `useOrders`: Fetch orders for Admin/Seller.
  - `useCategories`: Fetch categories.
  - `useUpdateProduct`, `useCreateProduct`: Mutations for product management.
  - `useUpdateOrder`: Mutation for order status updates.

## 4. UI Implementation (Ant Design - Admin & Seller)

- [ ] **Admin/Seller Layout**:
  - Rebuild `app/(admin)/layout.tsx` and `app/(seller)/layout.tsx` using Ant Design's `Layout` (Sider, Header, Content).
  - Implement a responsive sidebar with Antd `Menu`.
- [ ] **Dashboard Components**:
  - **Tables**: Implement `AntTable` for Products and Orders with server-side pagination (using Query data) and sorting.
  - **Forms**: Create reusable form components (or use Antd `Form` directly) for "Add Product", "Edit Store".
  - **Feedback**: Use Antd `message`, `notification`, and `Spin` for loading/error states.
- [ ] **Performance Optimization**:
  - Ensure dashboards show "Skeleton" loaders while fetching.
  - Implement "Keep Previous Data" pattern for pagination to prevent layout shift.

## 5. UI Implementation (General/Customer)

- [ ] Ensure the integration does not break the customer-facing pages.
- [ ] Optionally wrap customer pages with QueryProvider for data fetching improvements if scope allows.

## 6. Cleanup & Migration

- [ ] Remove unused `fetch` services in `services/` that are replaced by Query hooks.
- [ ] Verify functionality of all existing features (Auth, Cart, Checkout flow).

## Tasks Logic

1.  **Dependencies**: Run installation.
2.  **Providers**: Create and mount.
3.  **Hooks**: Create the Appwrite wrappers.
4.  **Admin UI**: Replace layout and dashboard.
5.  **Seller UI**: Replace layout and products page.
6.  **Verify**: Check "wow" factor and performance.
