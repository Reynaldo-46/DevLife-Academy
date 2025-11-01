# AWS S3 CORS Configuration Guide

This guide explains how to configure AWS S3 bucket CORS settings to allow video uploads from your DevLife Academy application.

## Overview

The CORS (Cross-Origin Resource Sharing) error occurs when your React frontend (running on `http://localhost:5173` in development or your production domain) tries to upload files directly to AWS S3. S3 needs to explicitly allow these cross-origin requests.

## Error Message

```
Access to XMLHttpRequest at 'https://devlife-academy-videos.s3.us-east-1.amazonaws.com/...'
from origin 'http://localhost:5173' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution: Configure S3 Bucket CORS

### Step 1: Access AWS S3 Console

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Select your bucket (e.g., `devlife-academy-videos`)
3. Navigate to the **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit**

### Step 2: Add CORS Configuration

Replace the existing CORS configuration with the following:

#### For Development (Localhost):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

#### For Production:

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

#### For Both Development and Production:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Important:** Replace `https://yourdomain.com` with your actual production domain.

### Step 3: Save Changes

Click **Save changes** in the AWS console.

---

## Understanding the CORS Configuration

### AllowedOrigins
- Lists the domains that can access your S3 bucket
- Use specific domains for security (avoid `*` in production)
- Include all environments (localhost for dev, domain for production)

### AllowedMethods
- `PUT` - Required for uploading files via presigned URLs
- `GET` - Required for downloading/viewing files
- `POST` - Alternative upload method
- `DELETE` - For file deletion
- `HEAD` - For metadata checks

### AllowedHeaders
- `*` allows all headers (simplifies development)
- In production, you can restrict to specific headers:
  - `Content-Type`
  - `Content-Length`
  - `Authorization`
  - `x-amz-*`

### ExposeHeaders
- Headers that the browser can access from the response
- `ETag` - Important for multipart uploads
- `x-amz-*` - AWS-specific response headers

### MaxAgeSeconds
- How long browsers cache the CORS preflight response (in seconds)
- 3000 seconds = 50 minutes

---

## Alternative: Wildcard for Development (NOT RECOMMENDED FOR PRODUCTION)

If you need quick testing and are okay with reduced security in development:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

⚠️ **Security Warning:** Using `*` for AllowedOrigins allows ANY website to upload to your bucket. Only use this temporarily for testing and NEVER in production.

---

## Verifying the Configuration

### Method 1: Test Upload

1. Start your backend: `cd backend && npm run start:dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Login as admin
4. Try uploading a video
5. Check browser console for any CORS errors

### Method 2: Browser DevTools

1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Upload a video
4. Find the S3 PUT request
5. Check the **Response Headers** for:
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD
   ```

---

## Common Issues and Troubleshooting

### Issue 1: CORS Error Still Appears After Configuration

**Solution:**
- Clear browser cache (Ctrl + Shift + Delete)
- Restart your development server
- Wait 1-2 minutes for AWS to propagate changes
- Try in incognito/private mode

### Issue 2: Presigned URL Works in Postman but Not Browser

**Cause:** Postman doesn't enforce CORS, but browsers do.

**Solution:** Ensure S3 CORS is properly configured (see above).

### Issue 3: Different Error After CORS Fix

If you get:
```
SignatureDoesNotMatch: The request signature we calculated does not match
```

**Solution:** Check that your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct in `backend/.env`.

### Issue 4: 403 Forbidden Error

**Causes:**
1. Incorrect AWS credentials
2. IAM user doesn't have S3 permissions
3. Bucket policy restricts access

**Solution:**

#### Check IAM Permissions

Your IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::devlife-academy-videos",
        "arn:aws:s3:::devlife-academy-videos/*"
      ]
    }
  ]
}
```

#### Check Bucket Policy

Go to S3 Bucket → Permissions → Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::devlife-academy-videos/*"
    }
  ]
}
```

This allows public read access for videos (so users can view them).

---

## Backend Configuration Updates

The backend code has been updated to include proper CORS headers in presigned URL generation.

### Updated `upload.service.ts`

The `getPresignedUploadUrl` method now includes:

```typescript
const command = new PutObjectCommand({
  Bucket: this.bucketName,
  Key: s3Key,
  ContentType: fileType,
  ACL: 'public-read', // Allow public access for viewing
});
```

### Environment Variables

Make sure your `backend/.env` has:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=devlife-academy-videos
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

---

## Production Deployment Checklist

When deploying to production:

- [ ] Update CORS configuration with production domain only
- [ ] Remove localhost origins from CORS
- [ ] Verify bucket policy allows public read for videos
- [ ] Ensure IAM user has minimum required permissions
- [ ] Enable S3 bucket versioning (optional, for backup)
- [ ] Enable S3 server-side encryption (optional, for security)
- [ ] Set up CloudFront CDN for faster video delivery (optional)
- [ ] Configure bucket lifecycle policies to delete temporary files (optional)

---

## Testing CORS Configuration

### Quick Test Script

Run this in your browser console on `http://localhost:5173`:

```javascript
fetch('https://devlife-academy-videos.s3.us-east-1.amazonaws.com/', {
  method: 'GET',
})
  .then(response => console.log('CORS working!', response))
  .catch(error => console.error('CORS error:', error));
```

If it succeeds, CORS is configured correctly.

---

## Additional Resources

- [AWS S3 CORS Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

## Summary

**Quick Fix:**
1. Go to AWS S3 Console → Your Bucket → Permissions → CORS
2. Paste the CORS configuration from this guide
3. Replace `https://yourdomain.com` with your domain
4. Save changes
5. Clear browser cache and test upload

The CORS error should now be resolved, and video uploads will work seamlessly! 🎉
