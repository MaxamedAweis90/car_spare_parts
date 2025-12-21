# Category Hierarchy (vehicle/system/sellable)

This project uses a strict 3-level category hierarchy driven by the `type` field.

## Types

- `vehicle`: top-level group (no parent)
- `system`: belongs to a vehicle
- `sellable`: belongs to a system (this is what sellers attach to products)

## Parent Rules

- `vehicle`
  - `parentCategoryId` **must be null**
- `system`
  - `parentCategoryId` **must point to a `vehicle`** category
- `sellable`
  - `parentCategoryId` **must point to a `system`** category

## Seller Behavior

- Seller category list (`/api/seller/categories`) returns **sellable categories only**.
- Seller UIs should display hierarchy labels like `Vehicle > System > Sellable` while still saving `mainCategoryId` as the sellable category id.

## Admin Behavior

- Admin create/update category endpoints reject invalid type/parent combinations.
- Admin Catalog UI uses a type-first flow and restricts parent selection to valid options.
