# Step-by-Step Implementation Guide

**Team:** Abhie, Ayush, Tiea, Princy
**Status:** Code scaffold is built. Services need setup. Hackathon is live.

> **Overview:** A chronological, step-by-step implementation guide — tells each person exactly what to do, when, and what to wait for. Written for beginners with exact commands.

---

## PHASE 1: Everyone Gets Set Up (First 1 hour — all 4 people do this together)

### Step 1 — EVERYONE: Clone and install

Each person opens their terminal and runs:

```bash
git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git
cd Hackthaon-Project-2026

cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

Read `docs/setup/README.md` — it has links to all the setup guides.

### Step 2 — EVERYONE: Create your own branch

```bash
git checkout -b feature/your-name
```

So Abhie does `feature/abhie`, Ayush does `feature/ayush`, etc.

---

## PHASE 2: Service Setup (Hours 1-3 — split between Tiea and Princy)

While Tiea and Princy set up services, Abhie and Ayush will read the codebase and get familiar.

### Step 3 — TIEA: Set up Firebase Authentication

Follow [docs/setup/03-firebase-setup.md](setup/03-firebase-setup.md) exactly:

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click "Create a project" — name it `homescreen`
3. Disable Google Analytics, click Create
4. Go to **Authentication** > **Get Started** > enable **Email/Password**
5. Click the web icon `</>` to register a web app named `homescreen-web`
6. Copy these 3 values and **paste them in the Discord/Zoom chat** for everyone:
  - `apiKey`
  - `authDomain`
  - `projectId`
7. Go to **Project Settings** > **Service Accounts** > **Generate new private key**
8. Open the downloaded JSON file, copy ALL of its contents
9. Share this JSON with the team (it goes in the backend `.env`)

**When done, tell the team: "Firebase is ready, keys are in the chat"**

### Step 4 — PRINCY: Set up MongoDB Atlas

Follow [docs/setup/04-mongodb-setup.md](setup/04-mongodb-setup.md) exactly:

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up
2. Create a **FREE M0 cluster** (pick AWS, any region)
3. Create a database user: username `homescreen`, click **Auto-generate password**, COPY the password
4. In Network Access, click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
5. Click **Connect** > **Drivers** > copy the connection string
6. Replace `<password>` with the password you copied
7. Add `/homescreen` before the `?` in the URL:
  ```
   mongodb+srv://homescreen:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/homescreen?retryWrites=true&w=majority
  ```
8. **Paste the full connection string in the Discord/Zoom chat** for everyone

**When done, tell the team: "MongoDB is ready, connection string is in the chat"**

### Step 5 — ABHIE: Get Gemini + ElevenLabs + Tambo API keys

Do these 3 things:

**Gemini:**

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click "Create API key", pick/create a project
3. Copy the key

**ElevenLabs:**

1. Go to [https://elevenlabs.io](https://elevenlabs.io) and sign up
2. Go to profile > API key (or [https://elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys))
3. Copy the API key
4. For voice ID, use this default: `EXAVITQu4vr4xnSDxMaL` (Sarah voice)

**Tambo AI:**

1. Go to [https://tambo.co](https://tambo.co) and sign up
2. Go to dashboard, find API key
3. Copy it

**Paste all 3 keys in the Discord/Zoom chat:**

```
GEMINI_API_KEY=xxxx
ELEVENLABS_API_KEY=xxxx
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
TAMBO_API_KEY=xxxx
```

### Step 6 — AYUSH: Set up Vultr Object Storage + get CRS key

**Vultr:**

1. Go to [https://www.vultr.com](https://www.vultr.com) and sign up
2. Go to **Products** > **Object Storage** > **Add Object Storage** (pick New Jersey / `ewr`)
3. Wait 1 min for it to be ready, then click on it
4. Copy: **Hostname**, **Access Key**, **Secret Key**
5. Click **Buckets** tab > **Create Bucket** > name it `homescreen` > set to **Public Read**

**CRS Credit API:**

- You already have the hackathon sandbox key — find it and share it

**Paste in chat:**

```
VULTR_ACCESS_KEY=xxxx
VULTR_SECRET_KEY=xxxx
VULTR_BUCKET_NAME=homescreen
VULTR_ENDPOINT=https://ewr1.vultrobjects.com
CRS_API_KEY=xxxx
CRS_API_URL=xxxx
```

---

## PHASE 3: Everyone Fills In .env Files (Hour 3 — all 4 people, 10 minutes)

### Step 7 — EVERYONE: Fill in your .env files

By now, all keys should be in the Discord/Zoom chat. Each person fills in their local files:

**Edit `frontend/.env`:**

```
VITE_FIREBASE_API_KEY=paste_from_tiea
VITE_FIREBASE_AUTH_DOMAIN=paste_from_tiea
VITE_FIREBASE_PROJECT_ID=paste_from_tiea
VITE_TAMBO_API_KEY=paste_from_abhie
VITE_API_URL=http://localhost:5000
```

**Edit `backend/.env`:**

```
PORT=5000
MONGODB_URI=paste_from_princy
FIREBASE_SERVICE_ACCOUNT=paste_the_whole_json_from_tiea_as_one_line
CRS_API_KEY=paste_from_ayush
CRS_API_URL=paste_from_ayush
GEMINI_API_KEY=paste_from_abhie
ELEVENLABS_API_KEY=paste_from_abhie
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
VULTR_ACCESS_KEY=paste_from_ayush
VULTR_SECRET_KEY=paste_from_ayush
VULTR_BUCKET_NAME=homescreen
VULTR_ENDPOINT=https://ewr1.vultrobjects.com
```

### Step 8 — EVERYONE: Test that it works

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

Backend should say: `Connected to MongoDB Atlas` and `HomeScreen API running on http://localhost:5000`

Frontend opens at: [http://localhost:5173](http://localhost:5173)

### Step 9 — PRINCY: Seed the database

```bash
cd backend && node src/seed.js
```

Refresh [http://localhost:5173](http://localhost:5173) — you should see 5 sample listings on the home page. Tell the team: **"Seed data is in. Everyone refresh your browser."**

---

## PHASE 4: Feature Work — Round 1 (Hours 3-10)

Now each person starts working on their own files. **Nobody touches anyone else's files.**

### Step 10 — ABHIE: Test and improve all backend API routes

**Your files:** `backend/src/routes/*.js`, `backend/src/models/*.js`, `backend/src/server.js`, `backend/src/seed.js`

Tasks in order:

1. Open Postman (download from [https://www.postman.com](https://www.postman.com)) or use `curl`
2. Test `GET http://localhost:5000/api/listings` — should return the seeded listings
3. Test `GET http://localhost:5000/api/listings/LISTING_ID` — pick an ID from step 2
4. Test `GET http://localhost:5000/api/health` — should return `{"status":"ok"}`
5. Add input validation to `backend/src/routes/listings.js` POST route — check that `title`, `price`, `city` are not empty
6. Add pagination to the GET `/api/listings` route — support `?page=1&limit=12`
7. Add more seed data in `backend/src/seed.js` — add 5 more realistic listings (different cities, prices, types)
8. Add request logging in `backend/src/server.js`:
  ```javascript
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });
  ```

**When done, commit and push:**

```bash
git add . && git commit -m "improve backend routes, add validation and pagination" && git push origin feature/abhie
```

### Step 11 — AYUSH: Polish all frontend pages

**Your files:** `frontend/src/pages/*.tsx`, `frontend/src/index.css`

Tasks in order:

1. Open [http://localhost:5173](http://localhost:5173) and click through every page
2. In `frontend/src/pages/Home.tsx`:
  - Remove the `DEMO_LISTINGS` array (we have real data now from the seed)
  - Remove the `usingDemo` state and the yellow demo banner
  - Add a subtle gradient background to the hero section
  - Make the search bar bigger and more prominent
3. In `frontend/src/pages/ListingDetail.tsx`:
  - Make the photo gallery larger
  - Add a "Back to listings" button that looks nicer
  - Make sure the Apply button stands out more
4. In `frontend/src/pages/CreateListing.tsx`:
  - Add form validation — show red text under empty required fields
  - Make the amenity buttons look nicer
5. In `frontend/src/pages/SellerDashboard.tsx`:
  - Add summary stats at the top (total applicants count)
6. In `frontend/src/pages/Login.tsx` and `Register.tsx`:
  - Add a background pattern or subtle decoration

**When done, commit and push:**

```bash
git add . && git commit -m "polish all frontend pages" && git push origin feature/ayush
```

### Step 12 — TIEA: Fix auth flow and improve components

**Your files:** `frontend/src/components/*.tsx`, `frontend/src/context/*.tsx`, `frontend/src/lib/*.ts`, `frontend/src/App.tsx`, `frontend/src/main.tsx`

Tasks in order:

1. Test the auth flow: Sign up as a seller, sign up as a buyer (use two browsers/incognito)
2. In `frontend/src/components/Navbar.tsx`:
  - Add a mobile hamburger menu (for small screens)
  - Highlight the current active page link
3. In `frontend/src/components/ListingCard.tsx`:
  - Add a subtle shadow on hover
  - Add a loading skeleton while images load
4. In `frontend/src/App.tsx`:
  - Add a protected route check: if someone goes to `/create-listing` or `/dashboard` without being logged in, redirect to `/login`
5. In `frontend/src/context/AuthContext.tsx`:
  - Add better error messages: "Wrong password", "Email already in use", etc. (parse Firebase error codes)

**When done, commit and push:**

```bash
git add . && git commit -m "fix auth, improve navbar and components" && git push origin feature/tiea
```

### Step 13 — PRINCY: Work on AI chat and services

**Your files:** `backend/src/services/*.js`, `backend/src/middleware/*.js`

Tasks in order:

1. Test the AI chatbot: Go to a listing detail page, click "Ask AI About This Property", type a question
2. If it works, try different questions: "Is this pet-friendly?", "How far is BART?", "What's the parking situation?"
3. In `backend/src/services/gemini.js`:
  - Improve the prompt — make the AI sound more friendly and natural
  - Add a system instruction to keep answers short (2-3 sentences max)
4. Test TTS: after the AI answers, does the voice play? If not, check the backend logs
5. In `backend/src/services/elevenlabs.js`:
  - Try different voice IDs (browse [https://elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library))
  - If the default voice is too slow, switch to `eleven_flash_v2_5` model
6. In `backend/src/services/crs.js`:
  - Test the real CRS sandbox API if the key works
  - If it does not work, improve the mock data to be more realistic
  - Make sure `calculateMatchScore` gives sensible scores

**When done, commit and push:**

```bash
git add . && git commit -m "improve AI chatbot prompts, test services" && git push origin feature/princy
```

---

## PHASE 5: Merge Round 1 (Hour 10 — everyone together, 15 minutes)

### Step 14 — EVERYONE: Merge all work into dev branch

One person (Abhie) does this on the call with everyone watching:

```bash
git checkout main
git pull origin main
git checkout -b dev

# Merge each person's branch
git merge feature/abhie
git merge feature/ayush
git merge feature/tiea
git merge feature/princy

# Push dev branch
git push origin dev
```

Since everyone worked on DIFFERENT files, there should be **zero conflicts**.

If there IS a conflict, the person who owns that file resolves it.

### Step 15 — EVERYONE: Pull the merged code

```bash
git checkout dev
git pull origin dev
```

Now restart both servers and test everything together.

---

## PHASE 6: Feature Work — Round 2 (Hours 10-20)

### Step 16 — ABHIE: End-to-end testing + edge cases

Test the FULL flow and fix backend bugs:

1. Create a seller account > create a listing with photos > see it on homepage
2. Create a buyer account (different browser) > browse listings > apply > see match score
3. Go back to seller account > check dashboard > approve the buyer
4. Test: What happens if buyer applies twice? (should show "already applied")
5. Test: What happens if fields are missing when creating a listing?
6. Fix any bugs you find in the routes

### Step 17 — AYUSH: Make the UI look amazing for the demo

Focus on the pages that judges will see first:

1. Home page — this is the first impression. Make it look like a real product.
2. Listing detail page — this is where the AI chat demo happens. Make it shine.
3. Add smooth page transitions (fade in on load)
4. Make sure everything looks good on a projector/big screen (larger fonts, more contrast)

### Step 18 — TIEA: Fix the AI voice chat (PropertyChat)

This is the most impressive demo feature. Focus all effort here:

1. In `frontend/src/components/PropertyChat.tsx`:
  - The voice recording is buggy — the `transcribeAudio` function starts a NEW Web Speech session instead of transcribing the recorded blob
  - Fix it: Start the `SpeechRecognition` when the user clicks the mic, not after recording stops
  - Test: Click mic > speak "Is there parking?" > should transcribe > should send to Gemini > should speak the answer
2. Make the chat look polished — smooth animations, message bubbles, typing indicator
3. Test the TTS: when AI responds, does the voice play? The speaker icon should let you mute/unmute

### Step 19 — PRINCY: Prepare for deployment

1. Test every service one more time with the real keys
2. Create a Vultr Cloud Compute instance (cheapest plan) for the backend
3. SSH into it and follow [docs/DEPLOYMENT.md](DEPLOYMENT.md):
  - Install Node.js
  - Clone the repo
  - Run `npm install` in backend
  - Create `.env` with all the keys
  - Start with `node src/server.js` (test it works)
4. Go to [https://vercel.com](https://vercel.com), import the GitHub repo
  - Set root directory to `frontend`
  - Add all `VITE_*` env vars
  - Set `VITE_API_URL` to the Vultr server URL: `http://YOUR_VULTR_IP:5000`
5. Test: does the live Vercel frontend talk to the Vultr backend?

---

## PHASE 7: Merge Round 2 + Final Polish (Hours 20-30)

### Step 20 — EVERYONE: Merge Round 2

Same process as Step 14:

```bash
git checkout dev && git pull origin dev
git merge feature/abhie
git merge feature/ayush
git merge feature/tiea
git merge feature/princy
git push origin dev
```

### Step 21 — EVERYONE: Full team testing

Everyone tests the deployed version (Vercel URL):

- Abhie: Test the full seller flow (create listing, check dashboard)
- Ayush: Test the full buyer flow (browse, apply, see score)
- Tiea: Test the AI chatbot (text + voice)
- Princy: Test on mobile phone + check all services are stable

Write down every bug in a shared doc.

---

## PHASE 8: Bug Fixes + Demo Prep (Hours 30-48)

### Step 22 — Fix bugs from testing (split based on file ownership)

- If the bug is in a `pages/` file — Ayush fixes it
- If the bug is in a `components/` or `lib/` file — Tiea fixes it
- If the bug is in a `routes/` or `models/` file — Abhie fixes it
- If the bug is in a `services/` file or deployment — Princy fixes it

### Step 23 — ABHIE: Prepare the demo script

Write a 3-minute demo script:

1. Open the homepage — "This is HomeScreen, an AI-powered housing marketplace"
2. Show browsing listings with filters
3. Show creating a listing as a seller (already have one ready)
4. Show a buyer applying and getting instantly screened
5. Show the seller dashboard with match scores (green/yellow/red)
6. Show the AI chatbot — ask it a question by voice
7. The AI answers and SPEAKS the answer back

### Step 24 — PRINCY: Final deployment

```bash
# Merge dev into main
git checkout main
git merge dev
git push origin main
```

Vercel will auto-deploy from main. Make sure the Vultr backend is running with PM2:

```bash
pm2 start src/server.js --name homescreen-api
pm2 save
```

### Step 25 — EVERYONE: Practice the demo

Run through the demo script 2-3 times. Make sure:

- Sample data is loaded (seed script ran on production DB)
- A seller account exists with listings
- A buyer account exists
- The AI chat works with voice
- Nobody needs to type passwords on screen during demo (pre-login)

---

## Quick Reference: Who Owns What Files

| Person     | Files they can edit                                                                 | NEVER touch                      |
| ---------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| **Abhie**  | `backend/src/routes/*`, `backend/src/models/*`, `backend/src/server.js`, `backend/src/seed.js` | frontend files, services/        |
| **Ayush**  | `frontend/src/pages/*`, `frontend/src/index.css`, `frontend/index.html`             | components/, lib/, backend/      |
| **Tiea**   | `frontend/src/components/*`, `frontend/src/context/*`, `frontend/src/lib/*`, `frontend/src/App.tsx`, `frontend/src/main.tsx` | pages/, backend/                 |
| **Princy** | `backend/src/services/*`, `backend/src/middleware/*`, all `.env` files, `docs/*`, deployment configs | routes/, models/, frontend pages |
