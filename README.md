# CSA Market

A mobile marketplace for Chinese Student Association members to buy and sell second-hand items locally. Users list items with photos, message sellers in-app, and arrange meetups to exchange goods.

## Features

- **Browse & Search** — Marketplace feed with category filters and full-text search
- **Create Listings** — Up to 5 images per listing, uploaded to AWS S3
- **Secure Messaging** — End-to-end encrypted chat using X25519 ECDH + AES-256-GCM (keys never leave the device)
- **Custom Auth** — Email/password with bcrypt, JWT sessions, and 6-digit email verification codes
- **Profile Pages** — Public profiles with active/sold listings and favorites
- **Image Moderation** — Google Gemini safety check (currently disabled; re-enable once API key is confirmed)

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React Native (Expo SDK 54) + NativeWind (Tailwind CSS) + Expo Router |
| Backend | Express.js 5 + MongoDB Atlas (Mongoose 8) |
| Auth | Custom JWT + bcrypt — token in `expo-secure-store` |
| Images | AWS S3 — up to 5 images per listing |
| Crypto | `@noble/curves` (X25519) + `@noble/ciphers` (AES-256-GCM) |
| AI Moderation | Google Gemini (`@google/generative-ai`) |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go app on your phone (or iOS/Android simulator)
- MongoDB Atlas cluster
- AWS S3 bucket

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your values
```

`backend/.env.example`:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-2
GEMINI_API_KEY=AIzaSyEXAMPLE
```

```bash
node server.js        # or: nodemon server.js for hot-reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # then fill in your values
```

`frontend/.env.example`:

```env
# Use http://localhost:3000 for simulator, or your machine's LAN IP for a physical device.
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

> **Physical device:** Replace `localhost` with your machine's LAN IP (e.g. `http://192.168.x.x:3000`).

```bash
npx expo start        # scan QR with Expo Go, or press i/a for simulator
```

## Project Structure

```text
backend/
  server.js                 Express entry — CORS, JSON, route mounting
  routes/                   API route definitions
  controllers/              Business logic handlers
  models/                   Mongoose schemas (User, Post, Conversation, Message)
  middleware/
    auth.js                 JWT requireAuth middleware
    upload.js               Multer in-memory storage for S3 uploads
  utils/
    s3Upload.js             uploadToS3 / deleteFromS3
    geminiModeration.js     Gemini vision safety check
  db/mongo.js               Mongoose connection

frontend/
  app/
    (tabs)/                 Main tab screens (Home, Market, Post, Messages, Profile)
    (auth)/                 Sign-in and Sign-up screens
    item.jsx                Listing detail
    profile-edit.jsx        Edit own profile
    profile/[userId].jsx    Public profile view
    edit-item/[itemId].jsx  Edit listing
    mark-sold/[itemId].jsx  Toggle listing status
  components/
    MarketPlace/ItemCard.jsx  Grid card for listings
    Loading/LoadingPage.jsx   Full-screen spinner
  context/AuthContext.jsx   Global auth state (login, logout, register, verifyEmail)
  service/api.js            Centralised fetch wrapper
  utils/
    auth.js                 saveToken / getToken / removeToken / getMe
    e2eCrypto.js            E2E encryption helpers
```

## API Overview

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Register — hash password, send verification code |
| POST | `/api/auth/verify-email` | — | Verify 6-digit code → return JWT |
| POST | `/api/auth/login` | — | Login → return JWT |
| GET | `/api/posts` | — | All active listings |
| GET | `/api/posts/:id` | — | Single listing detail |
| PUT | `/api/posts/:id` | ✓ | Update listing |
| POST | `/api/users/post/add` | ✓ | Create listing (multipart, up to 5 images) |
| DELETE | `/api/users/post/:id` | ✓ | Delete listing + S3 images |
| GET | `/api/users/conversation` | ✓ | All conversations |
| POST | `/api/users/conversation/start` | ✓ | Start or resume conversation |
| GET | `/api/users/conversation/:id/messages` | ✓ | Fetch messages |
| POST | `/api/users/conversation/:id/messages` | ✓ | Send message |

Full endpoint list in [CLAUDE.md](CLAUDE.md#api-endpoints).

## End-to-End Encryption

Messages are encrypted client-side before being stored in MongoDB. The server never sees plaintext.

- Each user generates an **X25519 key pair** on first use. The public key is stored in MongoDB; the private key stays on-device in `expo-secure-store`.
- On send: fetch receiver's public key → ECDH derive shared secret → AES-256-GCM encrypt → store `{ iv, ciphertext, senderPublicKey }`.
- On receive: load own private key + sender's embedded public key → re-derive shared secret → decrypt.
- Old plaintext messages render as-is with a graceful fallback.

## Testing

```bash
# Backend (Jest + Supertest + mongodb-memory-server)
cd backend && npm test

# Frontend (Jest + React Native Testing Library)
cd frontend && npm test
```

## License

MIT — see [LICENSE](LICENSE).
