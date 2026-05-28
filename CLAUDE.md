# CSA Market — CLAUDE.md

> **Always update this file when completing work items, discovering bugs, or making architectural decisions.**
> This is a side project by Alex Zhong. Licensed under MIT — see [LICENSE](LICENSE).

## On Completing Any Work Item

When you finish a feature, fix, or infrastructure change, you **must** do all of the following before committing:

1. **Update this file (CLAUDE.md)** — mark the item done in What's Next, move completed audit items out, and update Known Issues / Tech Debt if relevant.
2. **Update Known Issues** — remove fixed bugs, add newly discovered ones.
3. **No test suite exists yet** — if you add backend routes, manually verify the endpoint with curl or a REST client before marking done.

---

## Project Overview

**CSA Market** is a mobile marketplace app for Chinese Student Association members to buy and sell second-hand items locally. Users list items with photos, message sellers in-app, and meet up to exchange goods.

**Stack:**

- Frontend: React Native (Expo SDK 54) + NativeWind (Tailwind CSS) + Expo Router (file-based routing) — port varies (Expo Go)
- Backend: Express.js 5 + MongoDB Atlas (Mongoose 8) — port 3000 dev
- Auth: Custom JWT + bcrypt (`jsonwebtoken` + `bcryptjs`) — token stored in `expo-secure-store` under `csa_auth_token`, passed as `Authorization: Bearer`
- Images: AWS S3 (`@aws-sdk/client-s3`) — up to 5 images per listing; URLs stored directly in Post documents
- AI Moderation: Google Gemini (`@google/generative-ai`) — image safety check (currently commented out in `addPost`)
- Messaging: REST polling (no WebSocket); messages encrypted client-side with X25519 ECDH + AES-256-GCM (`@noble/curves` + `@noble/ciphers`) before being stored in MongoDB

---

## Dev Setup

### Backend

```bash
cd backend
npm install
node server.js        # or: nodemon server.js for hot-reload
```

Requires `.env` in `backend/`:

```env
PORT=3000
MONGO_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
AWS_S3_BUCKET_NAME=...
AWS_REGION=us-east-2
GEMINI_API_KEY=...
JWT_SECRET=...
```

### Frontend

```bash
cd frontend
npm install
npx expo start        # scan QR with Expo Go, or press i/a for simulator
```

Requires `.env` in `frontend/`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

> **Network note:** When running on a physical device, replace `localhost` in `EXPO_PUBLIC_API_BASE_URL` with your machine's LAN IP (e.g. `http://192.168.x.x:3000`). The backend `app.json` `NSExceptionDomains` already whitelists `localhost`, `127.0.0.1`, and `192.168.0.103`.

---

## Architecture

```text
frontend/app/
  (tabs)/
    index.jsx         Home — hero, stats, categories, how-it-works
    market.jsx        Marketplace feed — search, category filter, item grid
    post.jsx          Create listing — form + image picker → POST /api/users/post/add
    messages.jsx      Inbox + inline chat modal — polling /api/users/conversation/*
    profile.jsx       Own profile — active/sold listings, favorites
  (auth)/
    sign-in.jsx       Clerk email+password sign-in
    sign-up.jsx       Clerk registration + email verification
  item.jsx            Item detail page — images, description, contact seller CTA
  about.jsx           Static about page
  privacy.jsx         Privacy policy
  terms.jsx           Terms of service
  report.jsx          Report a listing
  profile-edit.jsx    Edit own name, bio, phone, avatar
  profile/[userId]    Public user profile view
  edit-item/[itemId]  Edit existing listing
  mark-sold/[itemId]  Mark listing as sold / revert to active
  _layout.jsx         Root layout — Clerk provider, auth gate, font loading

frontend/components/
  MarketPlace/ItemCard.jsx    Grid card for marketplace listings
  Loading/LoadingPage.jsx     Full-screen spinner
  Message/                   (reserved — unused so far)
  Profile/                   (reserved — unused so far)
  ui/                        (reserved — unused so far)

frontend/service/api.js      Centralised fetch wrapper — all API calls go through here
frontend/utils/auth.js       Token helpers: saveToken, getToken, removeToken, getMe (JWT decode)
frontend/context/AuthContext.jsx  Global auth state — replaces Clerk provider

backend/
  server.js                  Express entry — CORS, JSON, Clerk middleware, route mounting
  routes/
    userRoute.js             /api/users/* — auth-gated (requireAuth from @clerk/express)
    postRoute.js             /api/posts/* — mostly public
    profileRoute.js          /api/profiles/*
    featureRoute.js          /api/features/*
  controllers/
    userController.js        User CRUD, conversations, messages, post ownership ops
    PostController.js        Post CRUD, category filter
    profileController.js     Profile lookup
    reportController.js      Report submission
    featuresController.js    Stats (user count, post count, trade count)
  models/
    User.js                  Clerk ID, name, email, avatar, favorites[], active[], sold[], conversations[]
    Post.js                  Title, description, price, category, condition, location, images[], status
    Conversation.js          participants[], lastMessage ref, post ref, updatedAt
    Message.js               conversationId, sender, receiver, message (plaintext), timestamp, check
    Profile.js               (separate profile document — partially used)
    Report.js                Reported post + reason
    review.js                Empty — unused
  middleware/upload.js        Multer in-memory storage (used before S3 upload)
  middleware/auth.js          Custom JWT requireAuth middleware
  config/s3Config.js          S3 client init
  utils/
    s3Upload.js              uploadToS3 / deleteFromS3 helpers
    geminiModeration.js      isImageSafe(file) — Gemini vision safety check
  db/mongo.js                Mongoose connection
  api/clerk.js               Clerk backend client init
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | public | Register — hash password, send 6-digit email code |
| POST | /api/auth/verify-email | public | Verify email code → return JWT |
| POST | /api/auth/login | public | Login → return JWT |
| GET | /api/posts | public | All active listings |
| GET | /api/posts/post | public | Listings filtered by `?category=` |
| GET | /api/posts/:id | public | Single listing detail |
| PUT | /api/posts/:id | required | Update listing (multipart, up to 5 new images) |
| POST | /api/posts/:id/report | required | Report a listing |
| GET | /api/posts/userpost/active | public | Active posts for `?userId=` |
| GET | /api/posts/userpost/sold | public | Sold posts for `?userId=` |
| GET | /api/users/me | required | Current user's Mongo document (includes `_id`) |
| GET | /api/users/profile | required | Current user's full profile |
| PUT | /api/users/profile | required | Update name, bio, phone, avatar, location |
| GET | /api/users/profile/:id | required | Public profile by userId (Mongo ObjectId) |
| GET | /api/users/post/active | required | Current user's active listings |
| GET | /api/users/post/active/:id | required | Active listings for another user by userId |
| POST | /api/users/post/active | required | Add post ref to user's active array |
| GET | /api/users/post/sold | required | Current user's sold listings |
| GET | /api/users/post/sold/:id | required | Sold listings for another user by userId |
| PATCH | /api/users/post/:id | required | Toggle post status active ↔ sold |
| DELETE | /api/users/post/:id | required | Delete post + S3 images + clean user refs |
| GET | /api/users/post/favorites | required | Current user's favorited posts |
| POST | /api/users/post/favorites | required | Add or remove a favorite (`action: "add"/"remove"`) |
| POST | /api/users/post/add | required | Create new listing (multipart, up to 5 images) |
| GET | /api/users/conversation | required | All conversations for current user |
| POST | /api/users/conversation/start | required | Start or resume a conversation for a post |
| GET | /api/users/conversation/:id/messages | required | Fetch all messages in a conversation |
| POST | /api/users/conversation/:id/messages | required | Send a message |
| GET | /api/users/reviews | required | Current user's reviews (array, currently empty) |
| GET | /api/features/feature | public | Live stats: user count, post count, trade count |
| POST | /api/profiles/profile | public | Profile lookup by payload |

---

## Key Decisions

- **Custom JWT auth** — bcryptjs password hashing, jsonwebtoken session management. Backend `requireAuth` middleware in `backend/middleware/auth.js` reads `Authorization: Bearer`, verifies against `JWT_SECRET`, attaches `req.userId`. All controllers use `req.userId` — no Clerk dependency.
- **MongoDB `_id` as universal user identifier** — `User._id` (ObjectId) replaces `clerkId` everywhere. `Post.userId` is an ObjectId ref to `User`.
- **Email verification** — 6-digit code generated at registration, stored in `User.emailVerificationToken` (expires 10 min). Verified via `POST /api/auth/verify-email`.
- **MongoDB Atlas (Mongoose)** — schemaful documents; ObjectId refs between User, Post, Conversation, Message.
- **S3 for images** — uploaded server-side via multer → S3; only public URLs stored in the DB. `deleteFromS3` is called on post deletion.
- **NativeWind (Tailwind)** — utility-first styling; no StyleSheet API used in new components.
- **Expo Router** — file-based navigation; `(tabs)` for main nav, `(auth)` for unauthenticated screens.
- **Gemini image moderation commented out** — `isImageSafe()` is implemented but commented out in `addPost`. Re-enable by uncommenting the block in `userController.js`. Requires `GEMINI_API_KEY` in `.env`.

---

## Routes (Frontend)

| Path | Screen | Notes |
|------|--------|-------|
| `/` | HomeScreen | Hero, stats, categories |
| `/(tabs)/market` | MarketScreen | Browse and search listings |
| `/(tabs)/post` | PostScreen | Create a listing |
| `/(tabs)/messages` | MessagesScreen | Inbox + inline chat modal |
| `/(tabs)/profile` | ProfileScreen | Own profile and listings |
| `/(auth)/sign-in` | SignInPage | Email + password |
| `/(auth)/sign-up` | SignUpPage | Register + email verification |
| `/item` | ItemScreen | Listing detail (passed via router params) |
| `/about` | AboutScreen | About CSA Market |
| `/privacy` | PrivacyScreen | Privacy policy |
| `/terms` | TermsScreen | Terms of service |
| `/report` | ReportScreen | Report a listing |
| `/profile-edit` | ProfileEditScreen | Edit own profile |
| `/profile/[userId]` | PublicProfileScreen | View another user's profile (userId = Mongo ObjectId) |
| `/edit-item/[itemId]` | EditItemScreen | Edit own listing |
| `/mark-sold/[itemId]` | MarkSoldScreen | Mark listing sold or revert |

---

## What's Next (Priority Order)

### 0. ✅ Replace Clerk with Custom Auth (JWT + bcrypt) — DONE

#### Why

Clerk is a third-party service that owns our user identity, charges at scale, and adds a split-brain problem: user data lives in both Clerk and MongoDB, causing avatar/name staleness and `clerkId` as a foreign key throughout the DB. The goal is to own auth entirely — credentials stored in MongoDB, sessions managed with our own JWTs.

#### What Clerk currently does (everything we need to replace)

| Clerk responsibility | Where it's used |
|---|---|
| Sign-up: create user with firstName, lastName, email, password | `frontend/app/(auth)/sign-up.jsx` → `useSignUp()` |
| Email verification (6-digit code) | `sign-up.jsx` → `signUp.prepareEmailAddressVerification` |
| Sign-in: email + password → session | `frontend/app/(auth)/sign-in.jsx` → `useSignIn()` |
| Session/JWT storage on device | `frontend/utils/tokenCache.js` → `expo-secure-store` |
| Auth state globally (`isSignedIn`, `isLoaded`) | `frontend/app/_layout.jsx` → `useAuth()` |
| Current user object (`user.firstName`, `user.imageUrl`) | `index.jsx`, `profile.jsx`, `post.jsx`, many others → `useUser()` |
| JWT passed to backend as `Authorization: Bearer` | `frontend/service/api.js` → `getToken()` |
| Backend JWT verification + `req.auth().userId` | `backend/server.js` → `requireAuth()` middleware from `@clerk/express` |
| `clerkId` as the user identifier in every Mongo query | All of `userController.js`, `User.js` model, `Post.js` model |

#### New architecture

**Backend:**
- `User` model gets: `passwordHash: String` (bcrypt), `avatar: String` (URL, user-controlled), remove `clerkId` field, use MongoDB `_id` (as string) as the universal user identifier.
- `Post` model: replace `clerkId: String` field with `userId: ObjectId` ref to `User`.
- New auth routes (`/api/auth/*`, **no** `requireAuth` middleware):
  - `POST /api/auth/register` — validate input, hash password with bcrypt, create `User`, send verification email (nodemailer or similar), return `{ message: "Check your email" }`.
  - `POST /api/auth/verify-email` — check 6-digit code stored temporarily in Mongo (`emailVerificationToken`, `emailVerificationExpires` fields on `User`), set `verified: true`, return JWT.
  - `POST /api/auth/login` — find user by email, `bcrypt.compare`, return signed JWT (`{ userId, email, firstName, lastName, avatar }`).
- Custom `requireAuth` middleware (`backend/middleware/auth.js`):
  - Read `Authorization: Bearer <token>`, verify with `jwt.verify(token, process.env.JWT_SECRET)`.
  - Attach `req.userId` (string). All controllers switch from `req.auth().userId` → `req.userId`.
- Remove: `@clerk/express`, `@clerk/backend` packages. Remove `backend/api/clerk.js`.

**Frontend:**
- Remove: `@clerk/clerk-expo` package, `ClerkProvider` from `_layout.jsx`, `tokenCache.js` (repurpose for our own JWT storage), `useAuth()`, `useUser()`, `useSignIn()`, `useSignUp()` hooks everywhere.
- New `frontend/utils/auth.js` — thin wrapper around `expo-secure-store`:
  - `saveToken(jwt)`, `getToken()`, `removeToken()` — stores under key `csa_auth_token`.
  - `getMe()` — decodes the JWT payload (no verify needed client-side, just `atob` the middle segment) to get `{ userId, firstName, lastName, email, avatar }` without a network call.
- New `frontend/context/AuthContext.jsx` — React context replacing Clerk's global hooks:
  - State: `{ user, token, isLoaded, isSignedIn }`.
  - `login(email, password)` → `POST /api/auth/login` → save token → set state.
  - `register(firstName, lastName, email, password)` → `POST /api/auth/register`.
  - `verifyEmail(code)` → `POST /api/auth/verify-email` → save token → set state.
  - `logout()` → remove token → clear state.
  - `updateUser(fields)` → optimistically update local state + call `PUT /api/users/profile`.
  - Wrap the entire app in `_layout.jsx` (replaces `ClerkProvider`).
- `sign-in.jsx` and `sign-up.jsx` — rewrite to call `AuthContext` methods instead of Clerk hooks. Same UI, different wiring.
- `_layout.jsx` — replace `useAuth()` with `useAuthContext()`. Auth gate logic is identical: if `!isSignedIn` redirect to sign-in, if `isSignedIn` redirect to tabs.
- Every screen that reads `useUser()` → switch to `useAuthContext().user`. Fields stay the same (`firstName`, `lastName`, `avatar`, `email`), just sourced from our JWT payload / context instead of Clerk.
- `api.js` — `getToken()` currently calls Clerk's `useAuth().getToken()`. Replace with `SecureStore.getItemAsync("csa_auth_token")` directly (or via `auth.js` helper). All API calls already pass the token correctly in `Authorization: Bearer` — no change needed there.

#### New `User` model shape

```js
{
  _id: ObjectId,            // becomes the universal userId
  firstName: String,
  lastName: String,
  email: String (unique),
  passwordHash: String,
  avatar: String (default ""),
  verified: Boolean (default false),
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  description: String (default ""),
  location: String (default ""),
  PhoneNumber: String,
  favorites: [ObjectId → Post],
  active: [ObjectId → Post],
  sold: [ObjectId → Post],
  conversations: [ObjectId → Conversation],
  rating: Number (default 5),
  createdAt: Date,
}
```

#### Files to create

| File | Purpose |
|---|---|
| `backend/middleware/auth.js` | Custom JWT `requireAuth` middleware |
| `backend/controllers/authController.js` | `register`, `verifyEmail`, `login` handlers |
| `backend/routes/authRoute.js` | `/api/auth/*` routes (no auth middleware) |
| `frontend/utils/auth.js` | `saveToken`, `getToken`, `removeToken`, `getMe` |
| `frontend/context/AuthContext.jsx` | Global auth state + `login`, `logout`, `register`, `verifyEmail`, `updateUser` |

#### Files to rewrite

| File | Change |
|---|---|
| `backend/models/User.js` | Remove `clerkId`, add `passwordHash`, `emailVerificationToken`, `emailVerificationExpires` |
| `backend/models/Post.js` | Replace `clerkId: String` with `userId: ObjectId` ref |
| `backend/server.js` | Remove `@clerk/express` import + `requireAuth()` on `/api/users`; mount `/api/auth` route |
| `backend/controllers/userController.js` | All `req.auth().userId` → `req.userId`; remove `saveUser` (registration now handled by authController); remove 3× `@ufl.edu` checks |
| `backend/routes/userRoute.js` | Apply custom `requireAuth` middleware instead of Clerk's |
| `frontend/app/_layout.jsx` | Replace `ClerkProvider` + `useAuth()` with `AuthProvider` + `useAuthContext()` |
| `frontend/app/(auth)/sign-in.jsx` | Call `AuthContext.login()` instead of Clerk hooks |
| `frontend/app/(auth)/sign-up.jsx` | Call `AuthContext.register()` + `verifyEmail()` instead of Clerk hooks |
| `frontend/app/(tabs)/index.jsx` | Remove `saveUser` call (no longer needed), remove non-UFL dialog |
| `frontend/app/(tabs)/profile.jsx` | `useUser()` → `useAuthContext().user` |
| `frontend/app/(tabs)/post.jsx` | `useAuth().getToken()` → `auth.getToken()` |
| `frontend/app/(tabs)/messages.jsx` | Same token swap |
| `frontend/app/profile-edit.jsx` | Same token swap; avatar edit now updates Mongo directly (already does, just remove Clerk dependency) |
| `frontend/app/edit-item/[itemId].jsx` | Same token swap |
| `frontend/app/mark-sold/[itemId].jsx` | Same token swap |
| `frontend/app/item.jsx` | Same token swap |
| `frontend/app/report.jsx` | Same token swap |
| `frontend/app/profile/[clerkId].jsx` | Rename param to `[userId]`; update route + API call |
| `frontend/utils/tokenCache.js` | Remove (replaced by `auth.js`) |

#### Packages to remove

- Frontend: `@clerk/clerk-expo`
- Backend: `@clerk/express`, `@clerk/backend` (keep `jsonwebtoken`, `bcryptjs` instead)

#### Packages to add

- Backend: `bcryptjs`, `jsonwebtoken`, `nodemailer` (or `resend` for transactional email)
- Frontend: nothing new — `expo-secure-store` already installed

#### Order of implementation

1. Backend first: new `User` model → `authController` → `auth.js` middleware → update all controllers → update `Post` model → test all endpoints with curl.
2. Frontend second: `AuthContext` → `auth.js` util → rewrite `_layout.jsx` → rewrite sign-in/sign-up → swap `useUser()`/`useAuth()` in each screen.
3. Remove Clerk packages last, after everything else works.

---

### 1. ✅ Rebrand from Gator Exchange to CSA Market — DONE

All UI text, legal pages, app.json metadata, bundle IDs, and the LICENSE file updated to CSA Market / Alex Zhong.

### 2. ✅ End-to-End Encrypted Messaging — DONE

Currently messages are stored and transmitted as plaintext in MongoDB. The server can read every message. This needs to be fixed.

#### Planned Approach — X25519 ECDH + AES-256-GCM, client-side only

- **Key generation**: Each user generates an X25519 key pair on first use; the public key is uploaded to the `User` document (`publicKey` field). Private key never leaves the device.
- **Key storage**: Private key persisted in `expo-secure-store` under `e2e_private_key_{clerkId}`.
- **Encryption flow (send)**: Fetch receiver's public key from server → ECDH derive shared secret → AES-256-GCM encrypt plaintext → send `{ iv, ciphertext, senderPublicKey }` JSON-stringified as the `message` field.
- **Decryption flow (receive)**: Read own private key from secure store + sender's embedded public key → re-derive shared secret → AES-256-GCM decrypt.
- **Backend changes needed**:
  - Add `publicKey: String` to `User` model (`backend/models/User.js`)
  - Add `POST /api/users/public-key` — save own public key (auth required)
  - Add `GET /api/users/public-key/:clerkId` — fetch any user's public key (public, no auth)
- **Frontend changes needed**:
  - New `frontend/utils/e2eCrypto.js` — `generateKeyPair()`, `encryptMessage()`, `decryptMessage()`, `storePrivateKey()`, `loadPrivateKey()`
  - Wire into `messages.jsx` — generate+upload keypair on mount if not present; encrypt on send; decrypt on render
  - Graceful fallback: messages that fail to decrypt (e.g. old plaintext messages) show `[Encrypted message — unable to decrypt]`
- **Library**: `@noble/curves` (x25519) + `@noble/ciphers` (AES-GCM) — pure JS, works in React Native without native modules. `expo-crypto` (already installed) provides `getRandomValues`.

### 3. Remove Leftover @ufl.edu Guards

`startConversation`, `sendMessage`, and `addPost` in `userController.js` still reject non-`@ufl.edu` emails. These must be replaced with CSA membership logic (or removed entirely for open access).

- Remove the `endsWith("@ufl.edu")` checks in `startConversation` (line 200), `sendMessage` (line 676), and `addPost` (line 258).
- Decide on replacement gate: open to all authenticated users, or add a `role: "member"` field to `User` and enforce that instead.

### 4. Re-enable Gemini Image Moderation

`isImageSafe()` is implemented but commented out in `addPost` (lines 305–324 of `userController.js`). Uncomment once Gemini API key is confirmed working.

### 5. Real-time Messaging (WebSocket)

Currently the chat polls on open; there is no push. Add a WebSocket layer (Socket.io or raw `ws`) so new messages appear without manual refresh.

### 6. User Reviews / Ratings

`User.reviews` exists as an empty array and `User.rating` defaults to 5, but no endpoint or UI writes to it. Add a `POST /api/users/:clerkId/review` endpoint and a review form on the public profile screen.

### 7. ⬜ Chinese (Simplified) Localization (i18n)

Add a full Chinese (简体中文) translation of the app so CSA members can use their native language. The app should default to Chinese if the device locale is `zh`, otherwise English, with a manual toggle in the profile screen.

#### Planned Approach — i18n with `i18next` + `react-i18next`

- **Library**: `i18next` + `react-i18next` + `expo-localization` — standard React Native i18n stack; `expo-localization` reads the device locale to auto-select language on first launch.
- **Translation files**: Create `frontend/locales/en.json` and `frontend/locales/zh.json` — flat key-value maps covering all user-visible strings across every screen.
- **Language preference**: Persist the user's chosen language in `expo-secure-store` under `app_language`. Falls back to device locale, then `en`.
- **Screens to translate** (all user-visible strings):
  - `(tabs)/index.jsx` — hero text, tagline, step descriptions, category labels, footer
  - `(tabs)/market.jsx` — search placeholder, category filter labels, empty state
  - `(tabs)/post.jsx` — form labels, category/condition/location/meeting dropdowns, validation messages
  - `(tabs)/messages.jsx` — empty state, placeholder, error alerts
  - `(tabs)/profile.jsx` — section headers, button labels
  - `(auth)/sign-in.jsx`, `sign-up.jsx` — all labels and placeholders
  - `item.jsx`, `profile-edit.jsx`, `about.jsx`, `privacy.jsx`, `terms.jsx`, `report.jsx`
  - `edit-item/[itemId].jsx`, `mark-sold/[itemId].jsx`, `profile/[clerkId].jsx`
- **Language toggle**: Add a language switcher (EN / 中文) to the profile settings section — immediately re-renders all screens via React context.
- **Legal pages**: `privacy.jsx` and `terms.jsx` need full Chinese translations of the policy text, not just the UI chrome.
- **Files to create/modify**:
  - `frontend/locales/en.json` — English strings (extracted from all screens)
  - `frontend/locales/zh.json` — Chinese translations
  - `frontend/utils/i18n.js` — i18next init, locale detection, language persistence
  - All screen files above — replace hardcoded strings with `t('key')` calls
  - `frontend/app/(tabs)/profile.jsx` — add language toggle UI

### 8. Pagination for Marketplace Feed

`GET /api/posts` returns all documents with no limit. Add `?page=` + `?limit=` query params and infinite-scroll in `market.jsx`.

### 9. ✅ App-wide Color Theme Refresh (Blue / Orange / Black / White) — DONE

Standardize the visual identity across every screen to a consistent palette:

- **Primary color**: Blue (main actions, active states, links, tab bar active icon)
- **Secondary / accent color**: Orange (highlights, badges, CTAs like "Contact Seller", "Post Item")
- **Text**: Black on light surfaces
- **Background**: White

#### Scope

- Audit every screen and component for hardcoded colors that conflict with the new palette.
- Update `frontend/tailwind.config.js` — add `primary` (blue) and `secondary` (orange) to the `theme.extend.colors` map so every screen can use `bg-primary`, `text-secondary`, etc. instead of arbitrary hex values.
- Buttons: filled primary buttons use `bg-primary` + white text; secondary/outline buttons use `border-primary text-primary`; destructive actions use `bg-secondary` (orange) + white text.
- Tab bar: active icon/label in `primary` blue, inactive in gray.
- Input focus rings, selection highlights, and loading spinners: `primary` blue.

#### Files most likely to change

| File | What to update |
| --- | --- |
| `frontend/tailwind.config.js` | Add `primary` and `secondary` color tokens |
| `frontend/app/(tabs)/_layout.jsx` | Tab bar `activeTintColor` |
| `frontend/app/(tabs)/index.jsx` | Hero CTA button, category chips |
| `frontend/app/(tabs)/market.jsx` | Search bar focus, filter chips |
| `frontend/app/(tabs)/post.jsx` | Submit button, form accents |
| `frontend/app/(tabs)/messages.jsx` | Send button, unread badge |
| `frontend/app/(tabs)/profile.jsx` | Edit / logout buttons |
| `frontend/app/(auth)/sign-in.jsx` | Sign-in button |
| `frontend/app/(auth)/sign-up.jsx` | Register / verify buttons |
| `frontend/app/item.jsx` | "Contact Seller" CTA |
| `frontend/app/profile-edit.jsx` | Save button |
| `frontend/components/MarketPlace/ItemCard.jsx` | Price tag, favorite icon active state |

### 10. ✅ End-to-End Encrypted Messaging (moved from item 2) — DONE

See item **2** above. Implemented with X25519 ECDH + AES-256-GCM via `@noble/curves` + `@noble/ciphers`.

---

## Testing

### Backend Tests — Jest + Supertest

```bash
cd backend
npm test            # run all tests once
npm run test:watch  # watch mode
```

Tests live in `backend/tests/`. Each controller/route gets its own file:

```text
backend/tests/
  auth.test.js        POST /api/auth/register, /login, /verify-email
  user.test.js        Profile CRUD, favorites, post ownership ops
  post.test.js        Listing CRUD, category filter
  messaging.test.js   Conversation start, message send/receive
```

**Setup** (`backend/tests/setup.js`): spins up an in-memory MongoDB (`mongodb-memory-server`) so tests never touch Atlas. Each test file connects before tests and drops the DB after.

**Auth in tests**: import the custom `requireAuth` middleware directly; sign a short-lived test JWT with `JWT_SECRET=test_secret` set in `jest.config.js` environment.

### Frontend Tests — Jest + React Native Testing Library

```bash
cd frontend
npm test            # run all tests once
npm run test:watch  # watch mode
```

Tests live in `frontend/tests/`. Component + screen snapshots and interaction tests:

```text
frontend/tests/
  components/
    ItemCard.test.jsx
    LoadingPage.test.jsx
  screens/
    SignIn.test.jsx
    SignUp.test.jsx
    Market.test.jsx
  utils/
    auth.test.js      saveToken / getToken / getMe unit tests
```

**Mocks**: `expo-secure-store`, `expo-router`, and `@expo/vector-icons` are auto-mocked in `frontend/jest.setup.js`.

---

## Known Issues / Tech Debt

- **[LOW] Pre-E2E plaintext messages** — any messages sent before E2E was enabled are stored as plaintext in MongoDB. The UI handles them gracefully (renders as-is), but they were never encrypted. No action needed unless data is sensitive.
- **[MEDIUM] No pagination on `/api/posts`** — fetches all posts in one query. Will become a problem at scale.
- **[MEDIUM] Gemini moderation is commented out** — uploaded images are not safety-checked. Uncomment once `GEMINI_API_KEY` is confirmed.
- **[MEDIUM] Email delivery not implemented** — `authController.register` logs the verification code to console in dev (`process.env.NODE_ENV !== "production"`). A nodemailer/resend integration is needed before going to production.
- **[LOW] `review.js` model is empty** — the file exists but exports nothing. Either implement reviews or delete the file.
- **[LOW] `Profile` model vs `User` model overlap** — there are two separate collections (`profiles` and `users`) that partially duplicate fields. The `profiles` route is barely used. Consider consolidating.
- **[LOW] Old MongoDB data incompatible with new schema** — any existing documents in Atlas still use `clerkId` on `User` and `Post`. A one-time migration script is needed if preserving existing data.
