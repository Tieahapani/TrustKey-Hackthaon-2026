# Deployment Guide

> Last updated: Feb 14, 2026

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://trustkey-two.vercel.app/ | Deployed |
| **Backend API** | http://45.63.87.155:5001 | Deployed |
| **Health Check** | http://45.63.87.155:5001/api/health | Deployed |
| **Listings API** | http://45.63.87.155:5001/api/listings | Deployed |

---

## Frontend — Vercel

The frontend is deployed on Vercel and auto-deploys on every push to `main`.

1. Signed into [vercel.com](https://vercel.com) with GitHub
2. Imported the `Tieahapani/Hackthaon-Project-2026` repository
3. Set **Root Directory** to `frontend`
4. Added environment variable:
   - `VITE_API_URL` = `http://45.63.87.155:5001`
5. Deployed

### To redeploy

Push to `main` — Vercel auto-deploys. Or: Vercel dashboard > Deployments > Redeploy.

### To update env vars

Vercel dashboard > Settings > Environment Variables > edit > **Redeploy** (env changes require a redeploy).

---

## Backend — Vultr VPS

| Field | Value |
|-------|-------|
| IP | `45.63.87.155` |
| OS | Ubuntu 22.04 |
| Node.js | v20.20.0 |
| PM2 | v6.0.14 |
| Port | 5001 |
| App path | `/root/Hackthaon-Project-2026/backend` |

### SSH in

```bash
ssh root@45.63.87.155
# Password: ask a team member
```

### PM2 commands

```bash
pm2 status                      # Check status
pm2 logs homescreen-api         # View logs
pm2 restart homescreen-api      # Restart
pm2 stop homescreen-api         # Stop
```

### Deploy code changes to VPS

```bash
ssh root@45.63.87.155
cd /root/Hackthaon-Project-2026/backend
git pull
npm install
pm2 restart homescreen-api
```

### How the VPS was set up (for reference)

1. Created Vultr Cloud Compute (Shared CPU, Ubuntu 22.04, cheapest plan)
2. Installed Node.js 20: `curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs`
3. Installed PM2: `npm install -g pm2`
4. Cloned repo: `git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git`
5. Fixed ElevenLabs package name in `package.json`: `"elevenlabs"` instead of `"@elevenlabs/elevenlabs-js"`
6. Ran `npm install`
7. Created `.env` with all credentials
8. Opened firewall: `ufw allow 5001`
9. Whitelisted VPS IP in MongoDB Atlas (Network Access > `0.0.0.0/0`)
10. Seeded data: `node src/seed.js`
11. Started: `pm2 start src/server.js --name homescreen-api && pm2 save && pm2 startup`

---

## MongoDB Atlas

- **Cluster:** `trustkey.ccv6cx4.mongodb.net`
- **Database:** `homescreen`
- **Network Access:** `0.0.0.0/0` (allow all — hackathon only)

Connection string is in `backend/.env` (ask a team member for the password).

---

## Vultr Object Storage (Photos)

- **Endpoint:** `https://hsjc1.vultrobjects.com`
- **Bucket:** `trustkey`
- **Permissions:** Public read

Credentials are in `backend/.env`.

---

## Still TODO

- [ ] Firebase Auth setup (login/signup won't work until configured)
- [ ] Gemini API key (AI chat won't work)
- [ ] ElevenLabs API key (voice TTS won't work)
- [ ] CRS Credit API key (screening uses mock data until configured)
- [ ] Tambo API key (voice input uses browser fallback until configured)

See the individual setup guides in `docs/setup/` for each of these.

---

## Seed Data

```bash
cd backend
node src/seed.js
```

Creates 5 sample listings + demo seller/buyer accounts.

## Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable Email/Password authentication
4. Get the web app config (API key, auth domain, project ID)
5. Generate a service account JSON key (Project Settings > Service Accounts)
6. Stringify the JSON and put it in `FIREBASE_SERVICE_ACCOUNT`
