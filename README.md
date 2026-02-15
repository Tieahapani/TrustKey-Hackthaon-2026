# TrustKey — Comprehensive Risk Screening Platform

TrustKey is a comprehensive risk screening platform that auto-scores tenant applicants using real-time credit, criminal, eviction, fraud, and FBI data via the **CRS Sandbox API** — with a **Tambo AI** generative UI that lets buyers conversationally explore listings and navigate their rental journey.

---

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
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB Atlas + Mongoose | Cloud database + ODM |
| Firebase Admin SDK | JWT token verification |
| CRS Sandbox API | Tenant screening (5 products) |
| FBI Most Wanted API | Real-time public safety check |
| Vultr Object Storage | S3-compatible image storage + presigned URLs |

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
- Makes the rental search feel like talking to a knowledgeable assistant

### 5. Property Marketplace
- **Sellers**: Create listings with photos, pricing, amenities, and screening criteria
- **Buyers**: Browse, filter, and apply to listings with instant screening
- **Dashboard**: Sellers view all applicants ranked by match score
- **Image Upload**: Direct-to-cloud via Vultr presigned URLs

### 6. Firebase Authentication
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
│   │   ├── pages/               # Home, ListingDetail, CreateListing,
│   │   │                        # SellerDashboard, Login, Register
│   │   ├── components/          # Navbar, ListingCard, PropertyChat,
│   │   │                        # ScreeningBadge
│   │   ├── context/             # AuthContext (Firebase provider)
│   │   └── lib/                 # firebase.ts, api.ts, utils.ts
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/              # listings, applications, chat, upload, users
│   │   ├── models/              # User, Listing, Application (Mongoose)
│   │   ├── services/            # crs.js, vultr.js
│   │   ├── middleware/          # auth.js (Firebase token verification)
│   │   └── server.js            # Express entry point + MongoDB connection
│   ├── test-e2e.js              # End-to-end CRS API test suite
│   └── package.json
│
└── docs/                        # Project documentation
```

---

## API Endpoints

### Listings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/listings` | Browse all listings | Public |
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

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register` | Create user profile | Authenticated |
| GET | `/api/users/me` | Get current profile | Authenticated |

### Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/presigned` | Get presigned upload URL | Authenticated |

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
MONGODB_URI=mongodb+srv://...
FIREBASE_SERVICE_ACCOUNT=./secrets/your-firebase-adminsdk.json
CRS_API_URL=https://api-sandbox.stitchcredit.com:443/api
CRS_API_USERNAME=your_crs_username
CRS_API_PASSWORD=your_crs_password
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
{ firebaseUid, email, name, role: 'buyer' | 'seller', phone }
```

### Listing
```javascript
{
  sellerId, title, description, address, city, state, price,
  listingType: 'rent' | 'sale', photos: [urls],
  bedrooms, bathrooms, sqft, amenities: [],
  screeningCriteria: { minCreditScore, noEvictions, noBankruptcy, noCriminal }
}
```

### Application
```javascript
{
  listingId, buyerId, buyerInfo, status, consentGiven,
  crsData: {
    creditScore, evictions, bankruptcies, criminalOffenses,
    fraudRiskScore, identityVerified,
    fbiMostWanted: { matchFound, matchCount, searchedName, crimes: [] },
    requestIds: {}
  },
  matchScore, matchBreakdown, matchColor, totalPoints, earnedPoints
}
```

---

## Team

Built for SF Hacks 2026.
