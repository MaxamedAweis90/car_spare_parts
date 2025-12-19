# Appwrite Auth Manual

## 1) Required environment variables
Set these in `.env.local` for Next.js and in Appwrite project settings.

- Server (used by API routes):
  - `APPWRITE_ENDPOINT` (e.g., https://cloud.appwrite.io/v1)
  - `APPWRITE_PROJECT_ID`
  - `APPWRITE_API_KEY` (server key with Users + Databases permissions)
  - `APPWRITE_DATABASE_ID`
  - `APPWRITE_USERS_COLLECTION_ID`
  - `APPWRITE_PRODUCTS_COLLECTION_ID`
  - `APPWRITE_ORDERS_COLLECTION_ID`
  - `APPWRITE_MAIN_ADMIN_USER_ID` (existing main admin user id)
   - `APPWRITE_STORE_COLLECTION_ID`
   - `APPWRITE_STORE_AVATAR_BUCKET_ID`
  - `APPWRITE_AVATAR_BUCKET_ID` / `APPWRITE_PRODUCT_BUCKET_ID` (for uploads)

- Client (public; browser SDK):
  - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
  - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
  - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
  - `NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID`
  - `NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID`
  - `NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID`
  - `NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID`
   - `NEXT_PUBLIC_APPWRITE_STORE_COLLECTION_ID`
   - `NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID`

## 2) Appwrite console setup
1. **Email/Password auth**: Settings → Auth → Providers → enable Email/Password.
2. **Google OAuth2**:
   - In Auth → Providers → Google, enable and paste Google Client ID/Secret.
   - Allowed redirect URL: `http://localhost:3000/auth/callback` (add your production URL too, e.g., `https://yourdomain.com/auth/callback`).
   - Allowed logout URL: `http://localhost:3000` (and production equivalent).
3. **Database & collections**:
   - Use the existing `users` collection. Ensure these attributes exist (strings unless noted):
     - `name`, `email`, `role`, `createdAt`, `isActive` (boolean), `avatarId` (optional), `passwordHash` (optional), `appwriteUserId` (optional).
   - Products, orders collections can remain as-is.
4. **Permissions** (minimum safe defaults):
   - Collection-level: enable document-level security.
   - For `users` collection, allow admins to read/write. If you want users to read their own profile, add read permissions for `role:member` and implement per-document write rules for owners.
5. **Buckets**: Create buckets for `avatars` and `products`; set `APPWRITE_AVATAR_BUCKET_ID` and `APPWRITE_PRODUCT_BUCKET_ID` accordingly.

## 3) Google Cloud console
1. Create OAuth 2.0 Client ID (Web application).
2. Authorized redirect URIs must include the same callback(s):
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (when deployed)
3. Copy the client ID/secret into Appwrite Google provider settings.

## 4) How the flows work
- **Register** (`POST /api/auth/register`): hashes password with bcrypt, creates Appwrite auth user, and creates a profile document in the existing `users` collection with role `customer`.
- **Login** (`POST /api/auth/login`): verifies hashed password from the profile, then proxies Appwrite email/password session creation; forwards Appwrite session cookies and returns the session + JWT.
- **Logout** (`POST /api/auth/logout`): deletes the current Appwrite session and clears cookies.
- **Me** (`GET /api/auth/me`): uses the Appwrite session cookie to read the current account and optional profile.
- **Google login**: the frontend calls `accountClient.createOAuth2Session("google", success, failure)`. Appwrite sets the session cookies and redirects to `/auth/callback`, which calls `/api/auth/oauth/sync` to ensure a profile document exists.

## 5) Testing checklist
1. **Email/password register**: go to `/auth/register`, create a user, ensure a new Appwrite auth user and a profile document appear in the `users` collection.
2. **Email/password login**: log in at `/auth/login`; check cookies are set; `/api/auth/me` should return `{ authenticated: true }`.
3. **Google login**: click “Login with Google”, complete consent, land on `/auth/callback`, then return home; `/api/auth/me` should reflect the Google account and a profile document should exist (or be created) with `role = customer`.
4. **Logout**: click Logout on the home page; `/api/auth/me` should return 401.
5. **Protected UI**: the home page shows current auth status; add guards to other pages by calling `/api/auth/me` or the `useSession` hook.

## 6) Security notes
- Passwords are never stored in plain text; `passwordHash` is bcrypt hashed.
- Sessions rely on Appwrite’s HTTP-only cookies; JWT is returned from Appwrite for API clients if needed.
- Keep the server API key on the server only (`APPWRITE_API_KEY` must never be exposed to the client).
