# Seller Store Appwrite Setup

## 1. Manual configuration steps

### Create the `sellerStores` collection
1. In the Appwrite console, open **Database → Collections → Create collection**.
2. Collection name: `sellerStores` (ID can be `sellerStores`).
3. Enable **document security**.
4. Add the following attributes (string unless noted):
   - `sellerId` (required) – references the user profile document ID.
   - `storeName` (required, max length ≥ 120).
   - `storeSlug` (required, lowercase slug, unique).
   - `storeDescription` (optional, text/long string).
   - `storeAvatarId` (optional) – Appwrite file ID.
   - `storeBannerId` (optional).
   - `contactPhone` (optional, string – keep as text to allow formatted values such as `+252…`).
   - `contactEmail` (optional).
   - `isActive` (required boolean, default `true`).
5. Indexes:
   - `sellerId` – key `sellerId`, type `key`, required for exact lookups.
   - `storeSlug` – key `storeSlug`, type `key`, enforce **unique** to guarantee one public URL per store.
6. Permissions:
   - Allow **Admins** (role: `team:admins` or custom admin role) to read all documents. If you do not use Appwrite teams for admins, rely on the server API key (already used by our API routes).
   - Grant document-level permissions to owners. The code automatically grants update/delete permissions to the authenticated seller’s Appwrite account (`Role.user(<accountId>)`).
   - Appwrite automatically maintains `$createdAt` and `$updatedAt` system fields, so no additional timestamp attributes are required.

### Storage bucket for seller avatars
1. Navigate to **Storage → Create bucket**.
2. Name: `seller-store-avatars` (ID `sellerStoreAvatars`).
3. File size limit: 2‒5 MB (adjust as needed).
4. Permissions: disable public read; only server API key should manage files. Our API layer proxies file uploads and deletes, so no extra per-user permissions are necessary.
5. Record the bucket ID for environment setup.

### Optional: OAuth / auth considerations
- Sellers must authenticate through Appwrite (existing login flow). No extra OAuth scopes required beyond what is already configured.
- Ensure seller accounts have `role = "seller"` and `sellerApproved = true` before they reach the dashboard; the layout guard enforces this.

## 2. Environment variables
Add the following keys to both the server (`.env`) and client (`.env.local`) environments as noted. Values should match the resources created above.

| Key | Scope | Description |
| --- | --- | --- |
| `APPWRITE_STORE_COLLECTION_ID` | Server | ID of the `sellerStores` collection |
| `APPWRITE_STORE_AVATAR_BUCKET_ID` | Server | Bucket ID for store avatar images |
| `NEXT_PUBLIC_APPWRITE_STORE_COLLECTION_ID` | Client | Same as above, exposed to the browser SDK |
| `NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID` | Client | Bucket ID for client-side previews |

_All previously required Auth/Appwrite environment variables remain unchanged. Ensure the new keys accompany the existing ones in deployment configs._

## 3. Data flow reference

### Store lifecycle
1. **Creation**: The first time a seller hits the dashboard, the layout (and dashboard screen) requests `/api/seller/store`. If no document exists, the API calls `createStoreForSeller` to create one with default fields and owner permissions.
2. **Reading**: Sellers call `GET /api/seller/store`; admins can query via server-side tooling; customers call `GET /api/stores/[slug]` (public endpoint) which only returns active stores.
3. **Updates**: Sellers submit the Store Settings form. The client posts to `/api/seller/store` with `PUT`, updating name, description, contacts, visibility, and automatically refreshing `updatedAt`. Changing the name regenerates the slug while keeping a deterministic suffix based on the seller ID.

### Avatar upload flow
1. Seller chooses an image in Store Settings. The form posts multipart data to `/api/seller/store/avatar`.
2. API verifies the authenticated seller, uploads the image to the dedicated bucket via `storageServer.createFile`, updates the store document with the returned `fileId`, and then deletes the previous avatar (if any) to avoid orphaned files.
3. Client receives the updated store payload and refreshes the preview using `getImageUrl("storeAvatars", fileId)`.

### Public rendering
- Dashboard and layout resolve avatar URLs through the shared storage helper, ensuring consistent visuals.
- The public `/stores/[slug]` page runs server-side, loading the store via Appwrite SDK and building an Appwrite `view` URL with project credentials. When `isActive` is false or the document is missing, the page returns a 404.

### Permissions enforcement
- Seller-only routes call `requireSeller`, which validates the Appwrite session, role, and approval status before any data changes.
- API handlers never trust client-provided `sellerId`; they derive it from the authenticated profile document and scope queries with `Query.equal("sellerId", ...)`.
- Customer access goes through the public API route, which only serves active stores and excludes contact details if they are missing.
- Avatar deletions happen server-side with the Appwrite API key, preventing clients from tampering with other sellers’ files.

With these pieces in place, the seller store profile, avatar management, and public storefront exposure remain consistent with the project’s existing Appwrite architecture.
