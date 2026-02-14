const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.VULTR_ENDPOINT || 'https://ewr1.vultrobjects.com',
  credentials: {
    accessKeyId: process.env.VULTR_ACCESS_KEY || '',
    secretAccessKey: process.env.VULTR_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for Vultr Object Storage
});

/**
 * Generate a presigned URL for direct upload to Vultr Object Storage.
 * Returns { uploadUrl, fileUrl, key }
 */
async function getPresignedUploadUrl(fileName, fileType) {
  const bucket = process.env.VULTR_BUCKET_NAME || 'homescreen';
  const ext = fileName.split('.').pop();
  const key = `listings/${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  const endpoint = process.env.VULTR_ENDPOINT || 'https://ewr1.vultrobjects.com';
  const fileUrl = `${endpoint}/${bucket}/${key}`;

  return { uploadUrl, fileUrl, key };
}

module.exports = { getPresignedUploadUrl };
