# TrustKey — Comprehensive Risk Screening Platform

TrustKey is a real estate marketplace with AI-powered tenant screening. It auto-scores applicants using real-time credit, criminal, eviction, fraud, and FBI data via the **CRS Sandbox API** — with a **Tambo AI** generative UI that lets buyers conversationally explore listings and navigate their rental journey, and a **Google Gemini**-powered property chatbot with **ElevenLabs** text-to-speech.

---

_Last updated: Feb 2026_

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 7 | Build tool & dev server |
| Tailwind CSS 4 | Utility-first styling |
| React Router 7 | Client-side routing |
| TanStack React Query | Server state management |
| Tambo AI | Generative UI — context-aware conversational interface for buyers |
| Firebase SDK | Authentication (email/password) |
| Axios | HTTP client with token interceptors |
| shadcn/ui (Radix UI) | Accessible component library |
| Framer Motion | Animations and transitions |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB Atlas + Mongoose | Cloud database + ODM |
| Firebase Admin SDK | JWT token verification |
| CRS Sandbox API | Tenant screening (5 products) |
| FBI Most Wanted API | Real-time public safety check |
| Google Gemini 2.0 Flash | AI property chatbot |
| ElevenLabs | Text-to-speech for chat responses |
| Vultr Object Storage | S3-compatible image storage + presigned URLs |
| AWS SDK v3 | Vultr S3-compatible client |

### Deployment
| Service | Layer |
|---------|-------|
| Vercel | Frontend hosting |
| Vercel Serverless | Backend API |
| MongoDB Atlas | Database |
| Vultr Object Storage | Image CDN |

---

## Features

### 1. Comprehensive Tenant Screening (6 Products)
TrustKey integrates with the **CRS Sandbox API** to run a full background screening pipeline on every applicant:

| # | Product | Source | What It Checks |
|---|---------|--------|----------------|
| 1 | Fraud Finder | CRS Sandbox | Email, phone, IP, address fraud risk |
| 2 | FlexID | CRS Sandbox | LexisNexis identity verification |
| 3 | TransUnion Credit | CRS Sandbox | Credit score, bankruptcies |
| 4 | Criminal Background | CRS Sandbox | Convictions and offenses |
| 5 | Eviction History | CRS Sandbox | Prior eviction records |
| 6 | FBI Most Wanted | FBI Public API | Real-time FBI wanted list check |

**Scoring Algorithm (0-100 points):**
- Credit Score: 25 pts
- No Evictions: 20 pts
- No Bankruptcy: 20 pts
- No Criminal Record: 20 pts
- Low Fraud Risk: 15 pts
- FBI Check: **Hard fail — instant 0/100 if matched**

**Match Color Coding:**
- Green (80-100%) — Strong applicant
- Yellow (60-79%) — Moderate risk
- Red (0-59%) — High risk / FBI match

### 2. FBI Most Wanted Integration
- Searches the real **FBI API** using the buyer's actual name
- Instant **0/100 hard fail** if matched
- Crime details stored in MongoDB — sellers see exactly what the person is wanted for

### 3. Smart CRS Data Reuse
When the same buyer applies to multiple listings, CRS data is pulled from MongoDB instead of re-fetching from the API. Only the match score is recalculated per listing's criteria — saving API calls and providing instant results.

### 4. Tambo AI — Generative UI for Buyers
Tambo AI powers a **context-aware conversational interface** for buyers:
- Knows which page the buyer is on and what listing they're viewing
- Buyers can ask natural questions about pricing, amenities, neighborhood, and more
- Dynamically generates UI responses based on the conversation context
- Can render custom components (e.g., inline ApplicationForm)
- Makes the rental search feel like talking to a knowledgeable assistant

### 5. Google Gemini Property Chat
- **AI-powered Q&A** per listing — buyers can ask questions about any property
- Powered by **Google Gemini 2.0 Flash** with property-specific prompts
- **ElevenLabs TTS** converts AI answers to speech for an audio experience

### 6. Property Marketplace
- **Sellers**: Create listings with photos, pricing, amenities, and screening criteria
- **Buyers**: Browse, filter, and apply to listings with instant screening
- **Dashboard**: Sellers view all applicants ranked by animated TrustKey score meter
- **Image Upload**: Direct-to-cloud via Vultr presigned URLs
- **Search**: Full-text search with city aliases, filters by type/price/bedrooms

### 7. Firebase Authentication
- Email/password registration with role selection (buyer/seller)
- Firebase ID tokens verified on every API request
- Secure middleware protects all authenticated endpoints

---

## CRS Screening Flow

```
Buyer clicks "Apply Now"
        │
        ▼
   Enter buyer info (name, DOB, email)
        │
        ▼
   Consent to screening
        │
        ▼
┌───────────────────────────────────┐
│  pullComprehensiveReport()        │
│                                   │
│  1. Fraud Finder    ──► CRS API   │
│  2. FlexID          ──► CRS API   │
│  3. TransUnion      ──► CRS API   │
│  4. Criminal        ──► CRS API   │
│  5. Eviction        ──► CRS API   │
│  6. FBI Check       ──► FBI API   │
└───────────────────────────────────┘
        │
        ▼
   calculateMatchScore()
        │
        ├── FBI match? → 0/100 (hard fail)
        │
        └── No FBI → Score based on
            listing's screening criteria
        │
        ▼
   Application saved to MongoDB
   with full breakdown + crime details
```

---

## Project Structure

```
TrustKey/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/               # Index, Login, Register, ListingDetail,
│   │   │                        # CreateListing, Dashboard, MyListings,
│   │   │                        # MyApplications, About, NotFound
│   │   ├── components/          # Navbar, Footer, ListingCard, PropertyChat,
│   │   │   │                    # ScreeningBadge, TamboChatWidget,
│   │   │   │                    # ListingSkeleton
│   │   │   └── ui/              # shadcn/ui components (50+ files)
│   │   ├── contexts/            # AuthContext (Firebase + backend sync)
│   │   ├── hooks/               # use-mobile, use-toast
│   │   ├── lib/                 # firebase.ts, api.ts, utils.ts,
│   │   │                        # city-aliases.ts, tambo.ts, thread-hooks.ts
│   │   ├── assets/              # Static assets
│   │   ├── App.tsx              # Routes + global providers
│   │   └── main.tsx             # Entry point with TamboProvider
│   ├── public/                  # Public assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vercel.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/              # listings, applications, chat, upload, users
│   │   ├── models/              # User, Listing, Application (Mongoose)
│   │   ├── services/            # crs.js, gemini.js, elevenlabs.js, vultr.js
│   │   ├── middleware/          # auth.js (Firebase token verification)
│   │   ├── server.js            # Express entry point + MongoDB connection
│   │   ├── seed.js              # Database seeding script
│   │   └── __tests__/           # Jest test suite
│   ├── test-e2e.js              # End-to-end CRS API tests
│   ├── jest.config.js
│   ├── package.json
│   └── vercel.json
│
├── api/                         # Vercel serverless entry point
│   └── index.js                 # Exports backend Express app
│
├── docs/                        # Project documentation
│   ├── PROJECT_PLAN.md
│   ├── DEPLOYMENT.md
│   ├── STEP_BY_STEP_IMPLEMENTATION.md
│   └── setup/                   # Setup guides (Firebase, MongoDB, etc.)
│
├── .env.example                 # Environment variable template
├── package.json                 # Root package.json
├── vercel.json                  # Root Vercel config
└── README.md
```

---

## API Endpoints

### Listings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/listings` | Browse all listings (supports search & filters) | Public |
| GET | `/api/listings/:id` | Listing detail | Public |
| GET | `/api/listings/seller/mine` | Seller's listings | Seller |
| POST | `/api/listings` | Create listing | Seller |
| PUT | `/api/listings/:id` | Update listing | Owner |
| DELETE | `/api/listings/:id` | Delete listing | Owner |

### Applications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/applications` | Apply + run screening | Buyer |
| GET | `/api/applications/listing/:id` | View applicants | Seller |
| GET | `/api/applications/mine` | My applications | Buyer |
| PATCH | `/api/applications/:id/status` | Approve/reject | Seller |
| DELETE | `/api/applications/:id` | Withdraw application | Buyer |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register` | Create user profile | Authenticated |
| GET | `/api/users/me` | Get current profile | Authenticated |

### Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat` | Ask AI about a property (Gemini) | Public |
| POST | `/api/chat/tts` | Convert text to speech (ElevenLabs) | Public |

### Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/images` | Upload images to Vultr | Authenticated |
| POST | `/api/upload/presigned` | Get presigned upload URL | Authenticated |

### Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | Public |

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git
cd Hackthaon-Project-2026

# Install frontend
cd frontend && npm install && cd ..

# Install backend
cd backend && npm install && cd ..
```

### 2. Configure Environment Variables

**Frontend** (`frontend/.env`):
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_TAMBO_API_KEY=your_tambo_key
VITE_API_URL=http://localhost:5000
```

**Backend** (`backend/.env`):
```
PORT=5000

# Database
MONGODB_URI=mongodb+srv://...

# Firebase Auth (choose one method)
FIREBASE_SERVICE_ACCOUNT=./secrets/your-firebase-adminsdk.json
# OR individual env vars:
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_CLIENT_EMAIL=your_client_email
# FIREBASE_PRIVATE_KEY=your_private_key
# OR base64-encoded:
# FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_json

# Credit Screening
CRS_API_URL=https://api-sandbox.stitchcredit.com:443/api
CRS_API_USERNAME=your_crs_username
CRS_API_PASSWORD=your_crs_password

# AI Chatbot
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id

# Image Storage
VULTR_ACCESS_KEY=your_vultr_key
VULTR_SECRET_KEY=your_vultr_secret
VULTR_BUCKET_NAME=trustkey
VULTR_ENDPOINT=https://your-region.vultrobjects.com
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:5000`

---

## Demo: FBI Wanted Test Names

These real FBI wanted persons trigger a hard fail during demo:

| Name | Crime |
|------|-------|
| Byshere Smith | Murder |
| Cindy Singh | Capital Murder (Ten Most Wanted) |
| Terry Matthews | Fentanyl Distribution |

Any other name (e.g., "Tiea Hapani") passes the FBI check and scores normally.

---

## Testing

### Jest Unit & Integration Tests

```bash
cd backend && npm test
```

Covers routes, models, services, and middleware.

### End-to-End CRS API Tests

```bash
cd backend && node test-e2e.js
```

Runs 3 end-to-end tests:
1. **FBI Most Wanted Check** — Wanted persons get 0%, clean names score normally
2. **Round-Robin Variety** — Different CRS test identities produce varied scores
3. **Same Buyer Reuse** — CRS data is reused across multiple applications

---

## Database Schemas

### User
```javascript
{ firebaseUid, email, name, phone, createdAt, updatedAt }
```

### Listing
```javascript
{
  sellerId, title, description, address, city, state, price,
  listingType: 'rent' | 'sale', photos: [urls],
  bedrooms, bathrooms, sqft, amenities: [],
  propertyDetails,
  screeningCriteria: { minCreditScore, noEvictions, noBankruptcy, noCriminal },
  status: 'active' | 'closed',
  createdAt, updatedAt
}
```

### Application
```javascript
{
  listingId, buyerId, buyerInfo: { firstName, lastName, dob, email },
  status: 'pending' | 'screened' | 'approved' | 'rejected',
  consentGiven,
  crsData: {
    creditScore, evictions, bankruptcies, criminalOffenses,
    fraudRiskScore, identityVerified,
    fbiMostWanted: { matchFound, matchCount, searchedName, crimes: [] },
    requestIds: {}
  },
  matchScore, matchBreakdown, matchColor,
  totalPoints, earnedPoints, screenedAt,
  createdAt, updatedAt
}
```

---

## Architecture Highlights

- **Smart CRS Data Reuse** — Checks MongoDB for existing CRS data before calling APIs; only recalculates the match score per listing
- **FBI Hard Fail** — FBI matches result in instant 0/100 regardless of other factors
- **Deterministic Test Data** — Uses name-based hashing to select consistent test identities from the CRS sandbox
- **Serverless-Optimized** — MongoDB connection caching for Vercel serverless cold starts
- **Context-Aware AI** — Tambo chat widget adapts its context based on the current page and listing
- **Optimistic UI Updates** — Dashboard uses optimistic updates for approve/reject actions
- **Type Safety** — Full TypeScript coverage on the frontend with types matching backend schemas

---

## Live Demo

TrustKey is deployed and live on Vercel:

> **[trustkey-two.vercel.app](https://trustkey-two.vercel.app)**

---

## Powered By

| Service | Role |
|---------|------|
| [Tambo AI](https://tambo.co) | Generative UI — context-aware conversational interface that dynamically renders components based on buyer interactions |
| [CRS / StitchCredit](https://www.stitchcredit.com) | Tenant screening API (credit, criminal, eviction, fraud, identity) |
| [Google Gemini](https://ai.google.dev) | AI property chatbot (Gemini 2.0 Flash) |
| [ElevenLabs](https://elevenlabs.io) | Text-to-speech for AI chat responses |
| [Firebase](https://firebase.google.com) | Authentication (email/password + JWT verification) |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Cloud database |
| [Vultr](https://www.vultr.com) | S3-compatible object storage for listing images |
| [Vercel](https://vercel.com) | Frontend hosting + serverless backend |

---

## Team

Built for **SF Hacks 2026** by:

| Name | GitHub | LinkedIn |
|------|--------|----------|
| Abhishek Rangani | [@abhie2005](https://github.com/abhie2005) | [LinkedIn](https://www.linkedin.com/in/abhishek-rangani/) |
| Ayush Rangrej | [@0xAysh](https://github.com/0xAysh) | [LinkedIn](https://www.linkedin.com/in/ayush-rangrej/) |
| Tiea Hapani | [@Tieahapani](https://github.com/Tieahapani) | [LinkedIn](https://www.linkedin.com/in/tiea-hapani-1849ba283/) |
| Princy Ramani | [@Princy-code](https://github.com/Princy-code) | [LinkedIn](https://www.linkedin.com/in/princy-ramani/) |
