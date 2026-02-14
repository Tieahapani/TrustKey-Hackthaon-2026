# 10. Environment Variables — Complete Reference

> Last updated: Feb 14, 2026

## Frontend (`frontend/.env`)

```bash
# Firebase Auth (from Firebase Console > Project Settings > Web App)
VITE_FIREBASE_API_KEY=           # Firebase API key
VITE_FIREBASE_AUTH_DOMAIN=       # e.g., homescreen-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=        # e.g., homescreen-xxxxx

# Tambo AI (from tambo.co dashboard)
VITE_TAMBO_API_KEY=              # Tambo API key

# Backend URL
VITE_API_URL=http://localhost:5001   # Local dev
# VITE_API_URL=http://45.63.87.155:5001   # Production (set in Vercel)
```

## Backend (`backend/.env`)

```bash
# Server
PORT=5001

# MongoDB Atlas (ask a team member for the password)
MONGODB_URI=mongodb+srv://trustkey:<password>@trustkey.ccv6cx4.mongodb.net/homescreen?retryWrites=true&w=majority&appName=TrustKey

# Firebase Admin (from Firebase Console > Project Settings > Service Accounts > Generate Key)
# Paste the ENTIRE JSON service account key as a single line
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# CRS Credit API (hackathon sandbox key)
CRS_API_KEY=                     # CRS sandbox API key
CRS_API_URL=                     # CRS sandbox URL

# Google Gemini (from https://aistudio.google.com/apikey)
GEMINI_API_KEY=                  # Gemini API key

# ElevenLabs (from https://elevenlabs.io/app/settings/api-keys)
ELEVENLABS_API_KEY=              # ElevenLabs API key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL   # Voice ID (Sarah is default)

# Vultr Object Storage (shared team credentials — ask a team member)
VULTR_ACCESS_KEY=                # Vultr access key
VULTR_SECRET_KEY=                # Vultr secret key
VULTR_BUCKET_NAME=trustkey       # Bucket name
VULTR_ENDPOINT=https://hsjc1.vultrobjects.com  # Endpoint

# CORS (production only — set on VPS)
# CLIENT_URL=*
```

## Important Notes

1. **NEVER commit `.env` files to Git** — they're in `.gitignore`
2. **Port is 5001** (not 5000) — macOS AirPlay uses 5000
3. **Share secrets securely** — DM or shared doc, not in the repo
4. **Ask a team member** for MongoDB password and Vultr credentials

## Which Keys Can the Team Share?

| Key | Share one? | Why |
|-----|-----------|-----|
| Firebase config (frontend) | Yes | Same Firebase project |
| Firebase service account | Yes | Same project |
| MongoDB URI | Yes | Same database |
| CRS API Key | Yes | One sandbox key |
| Gemini API Key | One per person is better | Free tier per Google account |
| ElevenLabs API Key | One per person is better | Free tier per account |
| Tambo API Key | Yes | Same project |
| Vultr credentials | Yes | Same storage bucket |

## Quick Checklist

Before running the project, make sure you have:

- [ ] `backend/.env` created with at least `MONGODB_URI` filled in
- [ ] `frontend/.env` created (optional for local dev — Vite proxies to backend)
- [ ] MongoDB password (ask team member)
- [ ] Vultr credentials (ask team member)
