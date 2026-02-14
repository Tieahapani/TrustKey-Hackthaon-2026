# 8. CRS Credit API Setup

CRS Credit API is used to pull credit reports for buyer screening. We have a special hackathon sandbox key.

## We Already Have the Key

The CRS API sandbox key was provided specifically for this hackathon. Ask the team lead for:
- **CRS API Key**
- **CRS API Base URL** (sandbox endpoint)

## Update `.env`

Add to `backend/.env`:

```
CRS_API_KEY=your_crs_sandbox_key
CRS_API_URL=https://sandbox.crscreditapi.com
```

> Replace the URL with the actual sandbox endpoint provided.

## How It Works

1. Buyer clicks "Apply" on a listing and gives consent for a credit check
2. Backend sends buyer info to CRS API
3. CRS returns: credit score, income data, eviction history, bankruptcy records
4. Our **Match Score Calculator** compares the CRS data against the seller's criteria:
   - Each criterion (credit score, income, evictions, bankruptcy) is worth 25%
   - Total match score = 0% to 100%
   - Green (80-100%), Yellow (50-79%), Red (0-49%)
5. Seller sees applicants ranked by match score on their dashboard

## Mock Mode (if CRS is unavailable)

If the CRS API key isn't set or the API is down, the system **automatically falls back to mock data**. This generates realistic random credit data so you can still demo the screening feature.

The mock data generates:
- Credit scores: 580-800
- Incomes: $35k-$120k
- Evictions: mostly 0, occasionally 1
- Bankruptcies: mostly 0, rarely 1

This is handled in `backend/src/services/crs.js`.

## Testing the Screening Flow

1. Create a seller account and publish a listing with screening criteria
2. Create a buyer account
3. Go to the listing and click "Apply"
4. Confirm the consent dialog
5. You should see your match score immediately
6. Switch to the seller account and check the dashboard

## Troubleshooting

**"CRS API not configured — returning mock data":**
- This is fine for development! It means `CRS_API_KEY` or `CRS_API_URL` isn't set
- Set them in `backend/.env` when you have the real sandbox credentials

**Application fails with 500 error:**
- Check backend logs for the specific error
- Most likely a CRS API issue — the system should fall back to mock data automatically
