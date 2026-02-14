# HomeScreen — AI-Powered Housing Marketplace

A housing marketplace where sellers list properties, buyers get instantly screened via CRS Credit API, and an AI voice assistant answers questions about any listing.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Auth**: Firebase Authentication (email/password)
- **Image Storage**: Vultr Object Storage (S3-compatible)
- **Credit Screening**: CRS Credit API (sandbox)
- **AI Chatbot**: Google Gemini 2.0 Flash + ElevenLabs TTS
- **Deployment**: Vercel (frontend) + Vultr VPS (backend)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git
cd Hackthaon-Project-2026

# Install frontend
cd frontend && npm install && cd ..

# Install backend
cd backend && npm install && cd ..
```

### 2. Configure environment variables

Copy `.env.example` and fill in your API keys:

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
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
CRS_API_KEY=your_crs_key
CRS_API_URL=https://sandbox.crscreditapi.com
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
VULTR_ACCESS_KEY=your_vultr_key
VULTR_SECRET_KEY=your_vultr_secret
VULTR_BUCKET_NAME=homescreen
VULTR_ENDPOINT=https://ewr1.vultrobjects.com
```

### 3. Seed sample data (optional)

```bash
cd backend && node src/seed.js
```

### 4. Run development servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

## Features

1. **Property Listings** — Sellers create listings with photos, pricing, and screening criteria
2. **Smart Buyer Screening** — CRS Credit API integration with match scoring (0-100%)
3. **AI Property Assistant** — Voice/text chatbot powered by Gemini + ElevenLabs TTS

## Project Structure

```
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/   # Navbar, ListingCard, PropertyChat, ScreeningBadge
│   │   ├── pages/        # Home, ListingDetail, CreateListing, Dashboard, Login, Register
│   │   ├── context/      # AuthContext (Firebase)
│   │   └── lib/          # Firebase config, API helpers, utilities
│   └── ...
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── routes/       # listings, applications, chat, upload, users
│   │   ├── models/       # User, Listing, Application (Mongoose)
│   │   ├── services/     # CRS, Gemini, ElevenLabs, Vultr
│   │   ├── middleware/   # Firebase auth
│   │   └── server.js
│   └── ...
└── docs/              # Project plan
```

## Team

Built for Hackathon 2026.
