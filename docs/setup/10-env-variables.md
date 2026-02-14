# 10. Environment Variables — Complete Reference

Here's every environment variable you need, where it goes, and where to get it.

## Frontend (`frontend/.env`)

```bash
# Firebase Auth (from Firebase Console > Project Settings > Web App)
VITE_FIREBASE_API_KEY=           # Firebase API key
VITE_FIREBASE_AUTH_DOMAIN=       # e.g., homescreen-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=        # e.g., homescreen-xxxxx

# Tambo AI (from tambo.co dashboard)
VITE_TAMBO_API_KEY=              # Tambo API key

# Backend URL
VITE_API_URL=http://localhost:5000   # Change to Vultr URL for production
```

## Backend (`backend/.env`)

```bash
# Server
PORT=5000

# MongoDB Atlas (from Atlas dashboard > Connect > Drivers)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/homescreen?retryWrites=true&w=majority

# Firebase Admin (from Firebase Console > Project Settings > Service Accounts > Generate Key)
# Paste the ENTIRE JSON service account key as a single line
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# CRS Credit API (hackathon sandbox — login with username/password)
CRS_API_URL=https://api-sandbox.stitchcredit.com
CRS_API_USERNAME=sfhacks_dev25   # From CRS sandbox portal
CRS_API_PASSWORD=                # From CRS sandbox portal (quote if special chars)

# Google Gemini (from https://aistudio.google.com/apikey)
GEMINI_API_KEY=                  # Gemini API key

# ElevenLabs (from https://elevenlabs.io/app/settings/api-keys)
ELEVENLABS_API_KEY=              # ElevenLabs API key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL   # Voice ID (Sarah is default)

# Vultr Object Storage (from Vultr dashboard > Object Storage)
VULTR_ACCESS_KEY=                # Vultr access key
VULTR_SECRET_KEY=                # Vultr secret key
VULTR_BUCKET_NAME=homescreen     # Name of your bucket
VULTR_ENDPOINT=https://ewr1.vultrobjects.com  # Your region endpoint
```

## Important Security Notes

1. **NEVER commit `.env` files to Git** — they're in `.gitignore`
2. **Share API keys securely** — use a password manager, DM, or shared doc (not in the repo)
3. **`.env.example`** in the project root shows the template without actual values
4. Each teammate should create their own `.env` files locally after cloning

## Which Keys Can We Share?

| Key | Can team share one? | Why |
|-----|---------------------|-----|
| Firebase config (frontend) | Yes | Same Firebase project for everyone |
| Firebase service account | Yes | Same project, same backend |
| MongoDB URI | Yes | Same database for the team |
| CRS credentials (username/password) | Yes | One sandbox for the team |
| Gemini API Key | One per person is better | Free tier per Google account |
| ElevenLabs API Key | One per person is better | Free tier per account |
| Tambo API Key | Yes | Same project |
| Vultr credentials | Yes | Same storage bucket |

## Quick Checklist

Before running the project, make sure you have:

- [ ] `frontend/.env` — all 4 `VITE_` variables filled in
- [ ] `backend/.env` — all variables filled in
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Firebase project created with Email/Password auth enabled
- [ ] At least Gemini API key (chat won't work without it)
- [ ] ElevenLabs key (optional — text answers still work without voice)
- [ ] CRS key (optional — mock data used if not set)
- [ ] Vultr keys (optional — photo upload won't work without it, but listings still work)
