# 5. Vultr Object Storage Setup

We use Vultr Object Storage to store property listing photos. It's S3-compatible, so we use the AWS SDK to interact with it.

## Step 1: Create a Vultr Account

1. Go to https://www.vultr.com/
2. Sign up and add a payment method (they have free credits for new users)

## Step 2: Create Object Storage

1. In Vultr dashboard, click **Products** > **Object Storage**
2. Click **Add Object Storage**
3. Choose a location close to you (e.g., New Jersey `ewr`)
4. Click **Add Object Storage**
5. Wait for it to be ready (takes ~1 minute)

## Step 3: Get Your Credentials

1. Click on your Object Storage instance
2. You'll see:
   - **Hostname**: e.g., `ewr1.vultrobjects.com`
   - **Access Key**: e.g., `ABCDEF123456`
   - **Secret Key**: e.g., `xyz789...`
3. Copy these values

## Step 4: Create a Bucket

1. In the Object Storage dashboard, click **"Buckets"** tab
2. Click **"Create Bucket"**
3. Bucket name: `homescreen`
4. Click **Create**

## Step 5: Set Bucket Permissions

For the hackathon, make the bucket publicly readable so images can be displayed:

1. Click on the `homescreen` bucket
2. Go to **Settings** or **Permissions**
3. Set to **Public Read** (so browsers can load the images)

## Step 6: Update `.env`

Add these to `backend/.env`:

```
VULTR_ACCESS_KEY=your_access_key_here
VULTR_SECRET_KEY=your_secret_key_here
VULTR_BUCKET_NAME=homescreen
VULTR_ENDPOINT=https://ewr1.vultrobjects.com
```

Replace `ewr1` with your actual region if different.

## How It Works

1. Seller clicks "Add Photo" on the create listing form
2. Frontend asks backend for a **presigned upload URL**
3. Backend generates a temporary URL using AWS SDK + Vultr credentials
4. Frontend uploads the image **directly to Vultr** (not through our server)
5. The image URL is saved in the listing document in MongoDB
6. When buyers view the listing, images load directly from Vultr

This approach is fast and doesn't use our server bandwidth for file uploads.

## Testing Upload

Once everything is set up, try creating a listing with a photo. If it works, you'll see the image appear. If not, check:

1. Vultr credentials are correct in `.env`
2. Bucket name matches
3. Bucket is set to public read
4. Endpoint URL includes `https://`

## Troubleshooting

**"Access Denied" when uploading:**
- Check Access Key and Secret Key are correct
- Make sure `forcePathStyle: true` is set in the S3 client config (already done in code)

**Images not loading on the website:**
- Bucket needs to be public read
- Check the image URL in browser dev tools — it should be like `https://ewr1.vultrobjects.com/homescreen/listings/abc123.jpg`

**"Bucket not found":**
- Make sure `VULTR_BUCKET_NAME` matches exactly (case-sensitive)
