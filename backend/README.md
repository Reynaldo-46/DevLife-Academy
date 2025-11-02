# DevLife Academy Backend

Backend API for DevLife Academy - a video content platform.

## Features

- User authentication with JWT and refresh tokens
- Video upload with AWS S3 presigned URLs
- Playlist management
- Role-based access control (CREATOR, SUBSCRIBER, ADMIN)
- Video visibility controls (PUBLIC, PRIVATE, PAID, SUBSCRIBER_ONLY)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- AWS S3 bucket for video storage
- npm or yarn

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name for video storage
- `AWS_REGION` - AWS region (default: us-east-1)

## Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Optional: Seed database
npm run seed
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

See [API.md](./API.md) for detailed API documentation.

## Video Upload Flow

The video upload feature uses AWS S3 presigned URLs to enable direct client-to-S3 uploads:

### How It Works

1. **Client requests upload URL**
   - Frontend calls `POST /api/videos/upload-url` with filename and content type
   - Backend generates a presigned S3 URL valid for 1 hour
   - Returns: `uploadUrl`, `key`, and `publicUrl`

2. **Client uploads to S3**
   - Frontend uploads video directly to S3 using the presigned URL
   - No data passes through the backend server (efficient for large files)

3. **Client creates video record**
   - After successful S3 upload, frontend calls `POST /api/videos`
   - Backend creates video record in database with S3 key and public URL

4. **Optional: Publish video**
   - Call `POST /api/videos/:id/publish` to set publishedAt timestamp
   - Only published videos appear in public listings

### Benefits of This Approach

- **Scalability**: Backend doesn't handle large file uploads
- **Performance**: Direct client-to-S3 upload is faster
- **Security**: Presigned URLs expire after 1 hour
- **Cost-effective**: Reduces backend server bandwidth costs

### Frontend Integration

The frontend should:
1. Request presigned URL from backend
2. Upload video file to S3 using the presigned URL via HTTP PUT
3. After successful upload, create video record via backend API
4. Redirect to playlists or video management page (NOT dashboard)

### Common Issues and Solutions

**Issue**: "No routes matched location /playlists"
- **Cause**: Frontend routing configuration missing /playlists route
- **Solution**: Ensure frontend router has a route defined for /playlists

**Issue**: Video upload redirects to dashboard prematurely
- **Cause**: Upload success handler redirects before video record is created
- **Solution**: Wait for video record creation API call to complete before redirecting

**Issue**: Video not showing after upload
- **Cause**: Video record created but not published
- **Solution**: Call publish endpoint or set publishedAt in create request

## Development

```bash
# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── auth/           # Authentication module
├── common/         # Shared filters, interceptors
├── config/         # Configuration
├── playlists/      # Playlist management
├── prisma/         # Prisma service
├── storage/        # S3 storage service
├── videos/         # Video management
├── app.module.ts   # Root module
└── main.ts         # Application entry point
```

## Security

- JWT tokens for authentication
- Refresh tokens stored as HTTP-only cookies
- Role-based access control (RBAC)
- Input validation using class-validator
- Prisma for SQL injection prevention
- CORS configuration

## License

MIT
