# DevLife Academy - Deployment Guide

## Overview

This guide covers deploying the DevLife Academy platform to production.

## Architecture

- **Frontend**: React SPA → Vercel/Netlify
- **Backend**: NestJS API → Railway/Render/Fly.io
- **Database**: PostgreSQL → Neon.tech/Supabase/AWS RDS
- **Storage**: AWS S3 (for videos)
- **CDN**: CloudFront (for video delivery)

## Prerequisites

- GitHub account
- Stripe account with API keys
- AWS account (for S3)
- Domain name (optional)

## 1. Database Deployment (Neon.tech)

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)
4. Save it as `DATABASE_URL` for backend deployment

## 2. Backend Deployment (Railway)

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service (or use external Neon database)
4. Deploy from GitHub:
   - Connect your repository
   - Set root directory: `backend`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm run start:prod`

5. Add environment variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-random-string
JWT_REFRESH_SECRET=your-secure-refresh-string
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=devlife-academy-videos
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

6. Run migrations:
   - Railway terminal: `npx prisma migrate deploy`

7. Note your backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render

Similar process, use `render.yaml` configuration.

## 3. Frontend Deployment (Vercel)

1. Go to https://vercel.com
2. Import your repository
3. Configure:
   - Root directory: `frontend`
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

4. Add environment variable:
```
VITE_API_URL=https://your-backend.railway.app
```

5. Deploy!

## 4. AWS S3 Setup

1. Create S3 bucket:
```bash
aws s3 mb s3://devlife-academy-videos
```

2. Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. Create IAM user with S3 access:
   - Create user in AWS IAM
   - Attach policy: `AmazonS3FullAccess`
   - Generate access keys
   - Add keys to backend environment variables

## 5. Stripe Setup

1. Go to Stripe Dashboard
2. Create products:
   - Monthly subscription ($9.99/month)
   - Annual subscription ($99/year)

3. Copy price IDs to environment variables

4. Set up webhook:
   - URL: `https://your-backend.railway.app/api/pay/webhook`
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook secret

## 6. CloudFront CDN (Optional)

1. Create CloudFront distribution
2. Origin: Your S3 bucket
3. Configure signed URLs for private content
4. Update `hlsUrl` to use CloudFront domain

## 7. Domain Setup

### Frontend (Vercel)
1. Add custom domain in Vercel dashboard
2. Update DNS records as instructed

### Backend (Railway)
1. Add custom domain in Railway
2. Update DNS with CNAME record

## 8. SSL Certificates

Both Vercel and Railway provide automatic SSL certificates.

## 9. Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test video upload
- [ ] Test video playback
- [ ] Test commenting
- [ ] Test Stripe checkout flow
- [ ] Test webhook handling
- [ ] Verify analytics tracking
- [ ] Test mobile responsiveness
- [ ] Check API documentation access
- [ ] Set up monitoring (Sentry, LogRocket)

## 10. Monitoring & Logging

### Backend
- Railway provides logs
- Add Sentry for error tracking
- Monitor database performance

### Frontend
- Vercel Analytics
- Google Analytics
- LogRocket for session replay

## 11. Backup Strategy

### Database
- Enable automated backups on Neon/Supabase
- Weekly manual backups

### S3
- Enable versioning
- Set up lifecycle policies

## 12. Scaling Considerations

### Database
- Connection pooling (PgBouncer)
- Read replicas for analytics
- Index optimization

### Backend
- Horizontal scaling (Railway auto-scales)
- Redis for caching
- CDN for static assets

### Frontend
- Already on CDN (Vercel)
- Code splitting (already configured)
- Image optimization

## 13. Security Best Practices

- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Rate limiting on API
- [ ] Input validation
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] Keep dependencies updated

## 14. Environment-Specific Configs

### Development
```
VITE_API_URL=http://localhost:3001
```

### Staging
```
VITE_API_URL=https://staging-api.devlife-academy.com
```

### Production
```
VITE_API_URL=https://api.devlife-academy.com
```

## 15. CI/CD Pipeline (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Railway CLI commands
          
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          # Vercel CLI commands
```

## Costs Estimate (Monthly)

- **Database (Neon)**: $0-19 (free tier available)
- **Backend (Railway)**: $5-20 (based on usage)
- **Frontend (Vercel)**: $0 (free for personal projects)
- **S3 Storage**: ~$0.023/GB + transfer costs
- **Stripe**: 2.9% + $0.30 per transaction

**Total**: ~$10-50/month initially

## Support

For issues during deployment:
1. Check deployment logs
2. Verify environment variables
3. Test database connectivity
4. Check Stripe webhook logs

---

Happy deploying! 🚀
