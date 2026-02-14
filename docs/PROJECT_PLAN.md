# HomeScreen — AI-Powered Housing Marketplace

> **One-liner for the team:** "We're building a Zillow-like website where landlords post rentals, renters apply and instantly get credit-checked using a real credit API. Every listing also has an AI chatbot you can talk to with your voice — ask it anything about the property and it talks back."

---

## Final Tech Stack (and Why)

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
  - Vite = instant dev server, fast builds
  - shadcn/ui = beautiful, copy-paste components (no heavy library), works perfectly with Tailwind
- **Backend**: Node.js + Express.js
  - Same language (JavaScript) as frontend — less context-switching for the team
  - Huge npm ecosystem, fast to prototype
- **Database**: MongoDB Atlas (free tier)
  - Flexible schema — perfect for listings where sellers can add varying fields
  - Free M0 cluster, zero setup headache
  - Note: Even though we want Vultr for everything, self-hosting MongoDB adds ops work. Atlas free tier is the smart move for a 48-hour hackathon.
- **Auth**: Firebase Authentication (email + password)
  - Handles password hashing, sessions, tokens — we don't build any of that
  - Firebase Admin SDK on backend verifies tokens
- **Image Storage**: Vultr Object Storage (S3-compatible)
  - Upload property photos via presigned URLs
  - Serve images directly from Vultr CDN
- **Credit Screening**: CRS Credit API (sandbox key we already have)
- **AI Chatbot**: Tambo AI (chat UI + STT) + Google Gemini 2.0 Flash (intelligence) + ElevenLabs (TTS)
- **Deployment**: Vercel (frontend) + Vultr VPS (backend)

---

## Project Structure (Monorepo)

```
/Hackthaon-Project-2026
├── /frontend                    # React + Vite app
│   ├── /src
│   │   ├── /components          # Reusable UI components
│   │   │   ├── /ui              # shadcn/ui components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ListingCard.tsx
│   │   │   ├── PropertyChat.tsx  # Tambo chat widget
│   │   │   └── ScreeningBadge.tsx
│   │   ├── /pages
│   │   │   ├── Home.tsx          # Landing + listing grid
│   │   │   ├── ListingDetail.tsx # Single property + chat
│   │   │   ├── CreateListing.tsx # Seller creates listing
│   │   │   ├── SellerDashboard.tsx # Applicants + match scores
│   │   │   ├── BuyerApply.tsx    # Application + consent
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── /lib
│   │   │   ├── firebase.ts      # Firebase config
│   │   │   ├── api.ts           # Axios/fetch helpers
│   │   │   └── utils.ts
│   │   ├── /context
│   │   │   └── AuthContext.tsx   # Firebase auth context
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── .env
│
├── /backend                     # Node.js + Express
│   ├── /src
│   │   ├── /routes
│   │   │   ├── listings.js      # CRUD for properties
│   │   │   ├── applications.js  # Apply + screening
│   │   │   ├── screening.js     # CRS API integration
│   │   │   └── chat.js          # Gemini + ElevenLabs
│   │   ├── /models
│   │   │   ├── User.js          # Mongoose model
│   │   │   ├── Listing.js
│   │   │   └── Application.js
│   │   ├── /middleware
│   │   │   └── auth.js          # Firebase token verification
│   │   ├── /services
│   │   │   ├── crs.js           # CRS Credit API client
│   │   │   ├── gemini.js        # Gemini API client
│   │   │   ├── elevenlabs.js    # ElevenLabs TTS client
│   │   │   └── vultr.js         # Vultr Object Storage (S3)
│   │   └── server.js            # Express app entry
│   ├── package.json
│   └── .env
│
├── /docs
│   ├── PROJECT_PLAN.md          # This file — high-level architecture
│   ├── STEP_BY_STEP_IMPLEMENTATION.md  # Team task guide — who does what, when
│   ├── DEPLOYMENT.md            # Vercel + Vultr deployment
│   └── /setup                   # Setup guides (Firebase, MongoDB, etc.)
├── .env.example                 # Template for all keys
├── .gitignore
└── README.md
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND (Vercel)                        │
│  React + Vite + Tailwind + shadcn/ui                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Firebase Auth│  │ Tambo Chat   │  │ ElevenLabs TTS │  │
│  │ (login/reg) │  │ Widget + STT │  │ (play audio)   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
└─────────┼────────────────┼───────────────────┼───────────┘
          │                │                   │
          ▼                ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                  BACKEND (Vultr VPS)                      │
│  Node.js + Express.js                                    │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Auth     │ │ Listings │ │ CRS      │ │ Chat       │  │
│  │ Middleware│ │ CRUD     │ │ Screening│ │ (Gemini +  │  │
│  │ (Firebase│ │ Routes   │ │ Service  │ │ ElevenLabs)│  │
│  │  Admin)  │ │          │ │          │ │            │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
└───────┼────────────┼────────────┼──────────────┼─────────┘
        │            │            │              │
        ▼            ▼            ▼              ▼
┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  Firebase  │ │ MongoDB  │ │ CRS API  │ │ Gemini +     │
│  Auth      │ │ Atlas    │ │ Sandbox  │ │ ElevenLabs   │
│  Service   │ │          │ │          │ │ APIs         │
└────────────┘ └──────────┘ └──────────┘ └──────────────┘
                                          ┌──────────────┐
                                          │ Vultr Object │
                                          │ Storage      │
                                          │ (photos)     │
                                          └──────────────┘
```

---

## Database Models (MongoDB)

### User
```javascript
{
  firebaseUid: String,       // from Firebase Auth
  email: String,
  name: String,
  role: "buyer" | "seller",  // chosen at registration
  phone: String,
  createdAt: Date
}
```

### Listing
```javascript
{
  sellerId: ObjectId,         // ref to User
  title: String,
  description: String,        // detailed — fed to Gemini for chat
  address: String,
  city: String,
  state: String,
  price: Number,
  listingType: "rent" | "sale",
  photos: [String],           // Vultr Object Storage URLs
  bedrooms: Number,
  bathrooms: Number,
  sqft: Number,
  amenities: [String],        // ["parking", "laundry", "pet-friendly", ...]
  propertyDetails: String,    // free-text for extra info (fed to AI)
  screeningCriteria: {
    minCreditScore: Number,   // e.g., 680
    minIncomeMultiplier: Number, // e.g., 3 (3x rent)
    noEvictions: Boolean,
    noBankruptcy: Boolean
  },
  status: "active" | "closed",
  createdAt: Date
}
```

### Application
```javascript
{
  listingId: ObjectId,
  buyerId: ObjectId,
  status: "pending" | "screened" | "approved" | "rejected",
  crsData: {                  // raw CRS response (stored for reference)
    creditScore: Number,
    income: Number,
    evictions: Number,
    bankruptcies: Number,
    // ... other CRS fields
  },
  matchScore: Number,         // 0-100
  matchBreakdown: {
    creditScore: { passed: Boolean, detail: String },
    income: { passed: Boolean, detail: String },
    evictions: { passed: Boolean, detail: String },
    bankruptcy: { passed: Boolean, detail: String }
  },
  matchColor: "green" | "yellow" | "red",
  consentGiven: Boolean,
  screenedAt: Date,
  createdAt: Date
}
```

---

## The Three Core Features — How They Work

### Feature 1: Property Listings

**Seller Flow:**
1. Seller signs up (Firebase Auth, email/password) and picks role = "seller"
2. Seller clicks "Create Listing" and fills out a form: title, description, photos, price, address, bedrooms, bathrooms, amenities, screening criteria
3. Photos get uploaded to Vultr Object Storage via presigned URL (backend generates the URL, frontend uploads directly to Vultr)
4. Listing saved to MongoDB and appears on the marketplace

**Buyer Flow:**
1. Buyer browses the home page and sees a grid of listing cards (photo, price, bedrooms, location)
2. Buyer can search by city, filter by price range, bedrooms, type (rent/sale)
3. Buyer clicks a listing and sees the detail page with photo gallery, full description, amenities, and the AI chat widget

**API Endpoints:**
- `POST /api/listings` — create listing (seller, auth required)
- `GET /api/listings` — browse all listings (public, supports query filters)
- `GET /api/listings/:id` — single listing detail (public)
- `PUT /api/listings/:id` — update listing (seller, auth required)
- `DELETE /api/listings/:id` — remove listing (seller, auth required)
- `POST /api/upload/presigned` — get presigned URL for Vultr upload (auth required)

---

### Feature 2: Smart Buyer Screening (CRS Credit API)

**Flow:**
1. Buyer clicks "Apply" on a listing → consent modal explains the credit check
2. Buyer confirms consent → frontend sends `POST /api/applications`
3. Backend calls CRS Credit API sandbox with buyer info → gets credit report
4. **Match Score Calculator** compares CRS results against seller's criteria:
   - Each criterion is worth equal weight (e.g., 4 criteria = 25% each)
   - Credit score: pass/fail + partial credit (e.g., buyer has 650 vs required 680 = partial)
   - Income multiplier: pass/fail
   - Evictions: pass/fail
   - Bankruptcy: pass/fail
   - Total = weighted sum → gives a score from 0 to 100%
5. Color coding: **green** (80-100%), **yellow** (50-79%), **red** (0-49%)
6. Result saved to MongoDB
7. Seller sees all applicants on their dashboard, sorted by match score

**Example:**
```
Seller's criteria:          Buyer's CRS result:
─────────────────           ───────────────────
Min credit score: 680       Credit score: 720 ✅
Income >= 3x rent           Income: 4x rent   ✅
No prior evictions          Evictions: None    ✅
No bankruptcy               Bankruptcy: None   ✅

                            Match: 100% 🟢
```

**Seller Dashboard:**
- Table/cards showing each applicant: name, match score, color badge, breakdown
- Click to expand and see full screening details
- Approve/reject buttons

**API Endpoints:**
- `POST /api/applications` — buyer applies (auth required, triggers CRS)
- `GET /api/applications/listing/:listingId` — seller sees applicants (auth + owner check)
- `PATCH /api/applications/:id/status` — seller approves/rejects

---

### Feature 3: AI Property Assistant (Tambo + Gemini + ElevenLabs)

**How the three pieces fit together:**

```
BUYER ASKS A QUESTION (voice or text)
         │
         ▼
┌─────────────────────┐
│  Tambo Chat Widget   │  ← UI for the chat (text input + message display)
│  useTamboVoice()     │  ← Mic button: records audio, converts to text (STT)
└──────────┬──────────┘
           │ sends question text + listingId
           ▼
┌─────────────────────┐
│  Express Backend     │
│  POST /api/chat      │
│                      │
│  1. Fetch listing    │  ← Gets all property details from MongoDB
│     from MongoDB     │
│  2. Build prompt     │  ← Combines listing info + buyer's question
│  3. Send to Gemini   │  ← Gemini 2.0 Flash generates the answer
│  4. Send to          │  ← ElevenLabs converts answer text to audio
│     ElevenLabs TTS   │
└──────────┬──────────┘
           │ returns { answer: "...", audioUrl: "..." }
           ▼
┌─────────────────────┐
│  Tambo Chat Widget   │
│                      │
│  - Shows text answer │  ← Displayed in the chat bubble
│  - Plays audio       │  ← ElevenLabs voice reads the answer aloud
└─────────────────────┘
```

**Gemini Prompt Strategy:**
```
You are a helpful property assistant for the listing: "{title}" at {address}.

Here is everything you know about this property:
- Price: ${price}/month
- Bedrooms: {bedrooms}, Bathrooms: {bathrooms}
- Square footage: {sqft}
- Amenities: {amenities}
- Description: {description}
- Additional details: {propertyDetails}

Answer the buyer's question based ONLY on the information above.
If you don't have enough information, say "I don't have that specific
detail — I'd recommend contacting the seller directly."

Buyer's question: "{question}"
```

**API Endpoints:**
- `POST /api/chat` — send question, get text answer + audio URL
  - Request: `{ listingId, question }`
  - Response: `{ answer: "...", audioUrl: "..." }`

---

## Auth Flow (Firebase)

```
1. User enters email + password on Login/Register page
2. Frontend calls Firebase: createUserWithEmailAndPassword() or signInWithEmailAndPassword()
3. Firebase returns a User object + ID Token (JWT)
4. Frontend sends the ID Token to backend: POST /api/users/register (with role: buyer/seller)
5. Backend verifies token with Firebase Admin SDK
6. Backend creates/finds User in MongoDB
7. Every future API call includes the token in the Authorization header
8. Backend middleware verifies it on every request
```

---

## Environment Variables Needed

```bash
# ─── Frontend (.env) ───
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_TAMBO_API_KEY=
VITE_API_URL=http://localhost:5000    # Vultr URL in production

# ─── Backend (.env) ───
PORT=5000
MONGODB_URI=mongodb+srv://...@cluster.mongodb.net/homescreen
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
CRS_API_KEY=
CRS_API_URL=                          # CRS sandbox URL
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=                  # pick a voice from ElevenLabs dashboard
VULTR_ACCESS_KEY=
VULTR_SECRET_KEY=
VULTR_BUCKET_NAME=
VULTR_ENDPOINT=https://ewr1.vultrobjects.com   # or your Vultr region
```

---

## 48-Hour Timeline

> **📋 Team implementation guide:** See [STEP_BY_STEP_IMPLEMENTATION.md](./STEP_BY_STEP_IMPLEMENTATION.md) for a chronological, person-by-person task breakdown with exact commands. Use it during the hackathon to coordinate Abhie, Ayush, Tiea, and Princy.

### Phase 1: Setup (Hours 0-4) — Everyone Together
- Initialize monorepo: `npm create vite@latest frontend`, `npm init` for backend
- Install all dependencies (see list below)
- Set up MongoDB Atlas cluster + connection string
- Set up Firebase project + enable email/password auth
- Set up Vultr Object Storage bucket
- Create `.env` files with all API keys
- Set up basic Express server with CORS + route stubs
- Set up React Router + basic layout (Navbar, placeholder pages)
- Push initial scaffold to GitHub

### Phase 2: Core Build (Hours 4-20) — Split Work

**Person A — Listings Frontend:**
- `Home.tsx` — listing grid with search bar + filters
- `ListingDetail.tsx` — photo gallery, details, apply button
- `CreateListing.tsx` — multi-step form with photo upload
- `ListingCard.tsx` — card component for the grid

**Person B — Backend APIs:**
- Mongoose models (User, Listing, Application)
- Auth middleware (Firebase token verification)
- Listings CRUD routes
- Vultr presigned URL endpoint for photo upload
- Applications routes

**Person C — Auth + Seller Dashboard:**
- `Login.tsx`, `Register.tsx` with Firebase Auth
- `AuthContext.tsx` — auth state management
- Protected routes (seller pages need auth)
- `SellerDashboard.tsx` — list of applicant cards with match scores
- Screening badge component (green/yellow/red)

**Person D (or shared) — CRS + AI Chatbot:**
- CRS API integration service on backend
- Match score calculator logic
- Gemini service with prompt template
- ElevenLabs TTS service
- Chat API endpoint

### Phase 3: AI + Voice Integration (Hours 20-30)
- Install Tambo: `npx tambo full-send`
- Build `PropertyChat.tsx` with Tambo chat components
- Wire `useTamboVoice()` for mic input
- Connect chat to `/api/chat` backend endpoint
- Add ElevenLabs TTS playback on frontend (play audio from response)
- Test full voice flow: speak → transcribe → Gemini answers → speak back

### Phase 4: Integration + Polish (Hours 30-42)
- Connect all frontend pages to backend APIs
- End-to-end testing of all three features
- UI polish: loading states, error handling, empty states
- Mobile responsiveness check
- Deploy frontend to Vercel
- Deploy backend to Vultr VPS (Node.js + PM2)

### Phase 5: Demo Prep (Hours 42-48)
- Create seed data (3-5 sample listings with photos)
- Test the full buyer journey: browse → apply → screening → chat
- Test the full seller journey: create listing → view applicants
- Prepare demo script
- Fix last-minute bugs

---

## Key Dependencies

### Frontend (package.json)
```
react, react-dom, react-router-dom
@tanstack/react-query          → data fetching + caching
tailwindcss, @tailwindcss/vite → styling
shadcn/ui components           → button, card, input, dialog, table, badge, etc.
firebase                       → auth SDK
@tambo-ai/react                → chat UI + voice STT
axios                          → API calls
lucide-react                   → icons (used by shadcn)
```

### Backend (package.json)
```
express, cors, dotenv
mongoose                       → MongoDB ODM
firebase-admin                 → verify auth tokens
@google/generative-ai          → Gemini SDK
elevenlabs                     → TTS SDK (Node.js)
@aws-sdk/client-s3             → Vultr Object Storage (S3-compatible)
@aws-sdk/s3-request-presigner  → presigned URLs
multer                         → file upload handling (if needed)
axios                          → CRS API calls
```

---

## Recommended Team Assignments (Flexible)

- **You** → Backend APIs + CRS screening
  - Key files: `/backend/src/routes/*`, `/backend/src/services/crs.js`
- **Teammate 2** → Frontend listings UI
  - Key files: `/frontend/src/pages/*`, listing components
- **Teammate 3** → Auth + Seller Dashboard
  - Key files: Firebase setup, auth context, dashboard page
- **Teammate 4** → AI Chatbot (Tambo + Gemini + ElevenLabs)
  - Key files: `PropertyChat.tsx`, `/backend/src/services/gemini.js`, `elevenlabs.js`

---

## Quick Setup Commands (for Day 1)

> **Start here:** [STEP_BY_STEP_IMPLEMENTATION.md](./STEP_BY_STEP_IMPLEMENTATION.md) — step-by-step guide with person-specific tasks.

```bash
# Clone the repo
git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git
cd Hackthaon-Project-2026

# Frontend setup
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react-router-dom @tanstack/react-query firebase @tambo-ai/react axios lucide-react
npx shadcn@latest init
cd ..

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express cors dotenv mongoose firebase-admin @google/generative-ai elevenlabs @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer axios
cd ..
```

---

*Last updated: Feb 2026 — HomeScreen Hackathon Project*
