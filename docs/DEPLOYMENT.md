# Deployment Guide

## Frontend — Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set the root directory to `frontend`
4. Add environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_TAMBO_API_KEY`
   - `VITE_API_URL` = your Vultr backend URL (e.g., `https://api.homescreen.app`)
5. Deploy!

## Backend — Vultr VPS

1. Create a Vultr Cloud Compute instance (cheapest plan is fine)
2. SSH into the server:
   ```bash
   ssh root@your-vultr-ip
   ```
3. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Install PM2 (process manager):
   ```bash
   npm install -g pm2
   ```
5. Clone your repo:
   ```bash
   git clone https://github.com/Tieahapani/Hackthaon-Project-2026.git
   cd Hackthaon-Project-2026/backend
   npm install
   ```
6. Create `.env` file with all API keys
7. Start with PM2:
   ```bash
   pm2 start src/server.js --name homescreen-api
   pm2 save
   pm2 startup
   ```
8. Set up nginx reverse proxy (optional but recommended):
   ```bash
   sudo apt install nginx
   ```
   Add to `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your Vultr server IP (or allow all IPs: `0.0.0.0/0` for hackathon)
5. Get the connection string and put it in `MONGODB_URI`

## Vultr Object Storage

1. Go to Vultr Dashboard > Products > Object Storage
2. Create a new storage instance
3. Note down the Access Key, Secret Key, and Hostname
4. Create a bucket named `homescreen`
5. Set the bucket to public read (for serving images)

## Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable Email/Password authentication
4. Get the web app config (API key, auth domain, project ID)
5. Generate a service account JSON key (Project Settings > Service Accounts)
6. Stringify the JSON and put it in `FIREBASE_SERVICE_ACCOUNT`

## Seed Data

After setting up MongoDB, run:
```bash
cd backend
node src/seed.js
```
This creates 5 sample listings for the demo.
