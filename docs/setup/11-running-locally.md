# 11. Running the Project Locally

You've done all the setup. Let's run it!

## Prerequisites Checklist

Before starting, make sure you have:
- [ ] Node.js installed (`node --version` shows 18+)
- [ ] Dependencies installed (`npm install` in both `frontend/` and `backend/`)
- [ ] `frontend/.env` filled in (at least Firebase keys)
- [ ] `backend/.env` filled in (at least `MONGODB_URI` — ask a team member for the password)

## Start the Backend

Open a terminal:

```bash
cd backend
npm run dev
```

You should see:
```
Connected to MongoDB Atlas
HomeScreen API running on http://localhost:5001
```

> If you see "MONGODB_URI not set", fill in your `.env` first.

## Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

## Seed Sample Data (Optional but Recommended)

Open a **third terminal**:

```bash
cd backend
node src/seed.js
```

This creates 5 sample listings so the homepage isn't empty. Refresh the browser after seeding.

## Test the Full Flow

### As a Seller:
1. Click **Sign Up** > choose **Seller** > fill in details
2. Click **New Listing** in the navbar
3. Fill in property details, add screening criteria
4. Click **Publish Listing**
5. Go to **Dashboard** to see your listing

### As a Buyer:
1. Open an incognito/private window (so you can use a different account)
2. Click **Sign Up** > choose **Buyer** > fill in details
3. Browse listings on the home page
4. Click a listing to see the detail page
5. Click **Apply Now** > confirm consent > see your match score
6. Click **Ask AI About This Property** > type or speak a question

### Check the Seller Dashboard:
1. Go back to the seller window
2. Click **Dashboard**
3. You should see the buyer's application with their match score
4. Click to expand and see the full screening breakdown
5. Click **Approve** or **Reject**

## Port Configuration

| Service | URL | Port |
|---------|-----|------|
| Frontend (Vite) | http://localhost:5173 | 5173 |
| Backend (Express) | http://localhost:5001 | 5001 |

> **Why port 5001?** macOS AirPlay Receiver uses port 5000. We use 5001 to avoid conflicts.

The frontend automatically proxies `/api/*` requests to the backend (configured in `vite.config.ts`).

## Common Issues

**"EADDRINUSE: address already in use :::5001":**
```bash
kill -9 $(lsof -ti:5001)
```
Then run `npm run dev` again.

**`npm install` fails with "No matching version found for @elevenlabs/elevenlabs-js":**
Fix the package name in `backend/package.json`:
```bash
# macOS:
sed -i '' 's/"@elevenlabs\/elevenlabs-js": "\^1.0.0"/"elevenlabs": "^1.0.0"/' package.json
# Linux:
sed -i 's/"@elevenlabs\/elevenlabs-js": "\^1.0.0"/"elevenlabs": "^1.0.0"/' package.json
npm install
```

**"Network Error" on API calls:**
- Make sure the backend is running on port 5001
- Check the terminal running the backend for error messages

**"CORS error":**
- Make sure `VITE_API_URL` in `frontend/.env` is `http://localhost:5001`
- The backend CORS config allows `http://localhost:5173`

**Blank page / white screen:**
- Open browser console (F12) and check for errors
- Usually a missing import or env variable

**Login/signup doesn't work:**
- Firebase keys not set. See [Firebase Setup](./03-firebase-setup.md)

**AI chat says "Failed to get AI response":**
- `GEMINI_API_KEY` not set in `backend/.env`
- Check backend terminal for specific error

**Photos don't upload:**
- Vultr credentials not set. You can still create listings without photos.

## Stopping the Servers

Press `Ctrl + C` in each terminal to stop the servers.

## Hot Reload

Both servers support hot reload:
- **Frontend**: Save a `.tsx` file and the browser refreshes automatically
- **Backend**: Save a `.js` file and nodemon restarts the server automatically

No need to restart manually during development!
