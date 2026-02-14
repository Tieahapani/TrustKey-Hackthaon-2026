# 4. MongoDB Atlas Setup

We use MongoDB Atlas (free tier) to store users, listings, and applications.

## Step 1: Create an Atlas Account

1. Go to https://cloud.mongodb.com/
2. Sign up (or log in with Google)
3. Choose the **FREE** plan (M0 Sandbox)

## Step 2: Create a Cluster

1. Click **"Build a Database"** (or "Create" if you already have an account)
2. Choose **M0 FREE** tier
3. Pick a cloud provider: **AWS** (any region close to you, e.g., `us-east-1`)
4. Cluster name: `homescreen-cluster` (or leave the default)
5. Click **Create Deployment**

## Step 3: Create a Database User

1. You'll be prompted to create a database user
2. Choose **Username and Password**
3. Set:
   - Username: `homescreen`
   - Password: click **Autogenerate Secure Password** and **copy it somewhere safe**
4. Click **Create User**

## Step 4: Whitelist Your IP

1. You'll be prompted to add your IP address
2. For the hackathon, click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - This is fine for development, not for production
3. Click **Add Entry**

## Step 5: Get the Connection String

1. Click **"Choose a connection method"**
2. Select **"Drivers"** (or "Connect your application")
3. Make sure Driver is **Node.js** and Version is **6.0 or later**
4. Copy the connection string. It looks like:

```
mongodb+srv://homescreen:<password>@homescreen-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. **Replace `<password>` with the password you created in Step 3**
6. **Add the database name** before the `?`:

```
mongodb+srv://homescreen:YOUR_PASSWORD@homescreen-cluster.xxxxx.mongodb.net/homescreen?retryWrites=true&w=majority
```

7. Put this in `backend/.env`:

```
MONGODB_URI=mongodb+srv://homescreen:YOUR_PASSWORD@homescreen-cluster.xxxxx.mongodb.net/homescreen?retryWrites=true&w=majority
```

## Step 6: Test the Connection

```bash
cd backend
npm run dev
```

You should see: `Connected to MongoDB Atlas`

If you see an error, check:
- Password is correct (no special characters that need URL encoding)
- IP whitelist includes your IP (or `0.0.0.0/0`)
- Connection string format is correct

## Viewing Your Data

1. In Atlas, click **"Browse Collections"**
2. You'll see collections appear once data is created:
   - `users`
   - `listings`
   - `applications`

## Seeding Sample Data

After connecting, run:
```bash
cd backend
node src/seed.js
```

This creates 5 sample listings so the marketplace isn't empty.

## Quick Setup for Team Members

If the team's shared Atlas cluster is already created, you just need to:

1. Create `backend/.env` (it's gitignored, so you won't find it in the repo)
2. Add the connection string:

```
MONGODB_URI=mongodb+srv://trustkey:<password>@trustkey.u5bhfhn.mongodb.net/homescreen?retryWrites=true&w=majority&appName=TrustKey
```

3. Replace `<password>` with the database password (ask a team member)
4. Install dependencies and test:

```bash
cd backend
npm install
npm run dev
```

5. You should see: `Connected to MongoDB Atlas`

6. Seed sample data (first time only):

```bash
node src/seed.js
```

This creates 5 sample listings + demo buyer/seller accounts.

7. Verify by visiting: `http://localhost:5001/api/listings` — you should see JSON with the sample listings.

> **Note:** The `.env` file contains secrets and is gitignored. Never commit it. Ask a team member for the password if you don't have it.

---

## Troubleshooting

**"MongoServerError: bad auth":**
- Wrong password. Go to Database Access > Edit user > Update password

**"MongoNetworkError: connection timed out":**
- Your IP isn't whitelisted. Go to Network Access > Add IP Address > Allow from Anywhere

**"MongooseError: Operation timed out":**
- Could be a network issue. Try a different wifi/VPN

**Special characters in password:**
- If your password has `@`, `#`, `%`, etc., URL-encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - Or just regenerate a password without special characters
