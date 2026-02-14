# 3. Firebase Authentication Setup

Firebase handles our user login/signup. We use **Email + Password** authentication.

## Step 1: Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Create a project"** (or "Add project")
3. Enter project name: `homescreen` (or anything you want)
4. Disable Google Analytics (not needed for hackathon) > click **Create Project**
5. Wait for it to finish, then click **Continue**

## Step 2: Enable Email/Password Auth

1. In the Firebase console, click **Authentication** in the left sidebar
2. Click **Get Started**
3. Click **Email/Password**
4. Toggle **"Enable"** to ON
5. Click **Save**

## Step 3: Get Frontend Config (Web App)

1. On the Firebase project overview page, click the **web icon** `</>` to add a web app
2. Enter app name: `homescreen-web`
3. Don't check "Firebase Hosting"
4. Click **Register app**
5. You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "homescreen-xxxxx.firebaseapp.com",
  projectId: "homescreen-xxxxx",
  // ... more fields
};
```

6. Copy these three values — you'll need them for `frontend/.env`:

```
VITE_FIREBASE_API_KEY=AIzaSyB...
VITE_FIREBASE_AUTH_DOMAIN=homescreen-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=homescreen-xxxxx
```

## Step 4: Get Backend Service Account Key

The backend needs a **service account** to verify user tokens.

1. In Firebase console, click the **gear icon** (top left) > **Project settings**
2. Go to the **Service accounts** tab
3. Click **"Generate new private key"**
4. A `.json` file will download. **Keep this safe — don't commit it to Git!**
5. Open the file and copy its entire contents
6. In `backend/.env`, set:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"homescreen-xxxxx",...}
```

> Paste the ENTIRE JSON as a single line. Make sure it's valid JSON (no line breaks).

### Quick way to convert JSON file to single line (Mac/Linux):

```bash
cat path/to/your-service-account.json | tr -d '\n'
```

Copy the output and paste it as the value of `FIREBASE_SERVICE_ACCOUNT`.

## What This Gives Us

- Users can sign up with email + password
- Frontend gets a Firebase ID Token (JWT) after login
- Backend verifies that token using Firebase Admin SDK
- No need to build our own password hashing, session management, etc.

## Troubleshooting

**"Firebase: Error (auth/api-key-not-valid)":**
- Check that `VITE_FIREBASE_API_KEY` in `frontend/.env` matches what Firebase gave you

**"Firebase: Error (auth/configuration-not-found)":**
- Make sure Email/Password sign-in is enabled in Firebase console

**Backend says "Invalid or expired token":**
- Make sure `FIREBASE_SERVICE_ACCOUNT` in `backend/.env` is valid JSON
- Make sure the service account is from the SAME Firebase project as the frontend config
