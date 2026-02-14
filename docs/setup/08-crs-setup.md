# 8. CRS Credit API Setup

CRS (Stitch Credit) API is used to pull credit reports and eviction data for buyer screening. The hackathon sandbox uses **username + password login** to get a JWT token.

## Credentials (from MWARE / CRS Sandbox Portal)

You should have received:
- **Username:** `sfhacks_dev25`
- **Password:** (from the portal — copy it)
- **Base URL:** `https://api-sandbox.stitchcredit.com`

## Update `.env`

Add to `backend/.env`:

```
CRS_API_URL=https://api-sandbox.stitchcredit.com
CRS_API_USERNAME=sfhacks_dev25
CRS_API_PASSWORD=your_password_from_portal
```

> Wrap the password in quotes if it contains special characters: `CRS_API_PASSWORD="&xcuREd!2pfyeHv*DcBbTiDY"`

## How Auth Works

1. **Login** — Backend calls `POST /api/users/login` with username + password
2. **JWT** — Response includes a `token` (JWT) valid for ~1 hour
3. **Reports** — All report endpoints use `Authorization: Bearer <token>`

The service caches the token and refreshes it when needed.

## How It Works in Our App

1. Buyer clicks "Apply" on a listing and gives consent for a credit check
2. Backend logs in to CRS (if not cached), then calls:
   - **TransUnion credit report** — credit score, income, bankruptcy
   - **Eviction report** — eviction history
3. Our **Match Score Calculator** compares the CRS data against the seller's criteria
4. Seller sees applicants ranked by match score (green / yellow / red)

## Sandbox Test Identities

The sandbox uses predefined test identities. Our service uses:
- **TransUnion:** BARBARA M DOTY (test identity from Postman)
- **Eviction:** Harold Chuang (test identity from Postman)

The frontend Apply flow does not collect SSN/DOB/address — we use these test identities so the demo works without real PII.

## Mock Mode (fallback)

If CRS credentials are missing or the API fails, the system **automatically falls back to mock data**:
- Credit scores: 580–800
- Incomes: $35k–$120k
- Evictions: mostly 0
- Bankruptcies: mostly 0

## Testing the Screening Flow

1. Ensure `CRS_API_URL`, `CRS_API_USERNAME`, and `CRS_API_PASSWORD` are set in `backend/.env`
2. Start backend: `cd backend && npm run dev`
3. Create a seller account and publish a listing with screening criteria
4. Create a buyer account
5. Go to the listing and click "Apply" → "I Consent — Apply"
6. You should see your match score (real CRS data in sandbox)
7. Switch to seller account and check the dashboard

## Postman Collection

Import `sfhacks2026-20260214-CRS-Sandbox.json` into Postman to explore the API:
1. Run **User Login** first to get a token
2. Run **TransUnion** or **Eviction** requests (they use the token automatically)

## Troubleshooting

**"CRS API not configured — returning mock data":**
- Set `CRS_API_URL`, `CRS_API_USERNAME`, and `CRS_API_PASSWORD` in `backend/.env`

**"CRS login failed":**
- Check username and password (copy from portal again)
- Ensure password is quoted in `.env` if it has `&`, `!`, `*`, etc.

**Application returns mock data instead of real:**
- Check backend logs for CRS errors
- Verify credentials and base URL
- Sandbox may have rate limits — wait and retry
