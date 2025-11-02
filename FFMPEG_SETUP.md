# FFmpeg Video Transcoding Setup Guide

This guide explains how to set up and use the FFmpeg-based video transcoding system in DevLife Academy.

## Overview

The platform uses **FFmpeg** (free, self-hosted) for automatic video transcoding. When an admin uploads a video, it automatically:

1. Processes the video into multiple resolutions (360p, 720p, 1080p)
2. Generates HLS (.m3u8) playlists for adaptive streaming
3. Uploads transcoded files to AWS S3
4. Updates the database with transcoding status and quality variants
5. Notifies the admin when transcoding is complete

## Architecture

```
Video Upload → Queue Job → FFmpeg Processing → S3 Upload → Database Update → Notification
```

### Components

- **TranscodingService**: Handles FFmpeg operations and S3 interactions
- **TranscodingProcessor**: Bull queue processor for async jobs
- **BullMQ**: Job queue system (uses Redis)
- **FFmpeg**: Video transcoding engine
- **Redis**: Queue backend
- **AWS S3**: Storage for transcoded videos

## Installation

### 1. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [ffmpeg.org/download.html](https://ffmpeg.org/download.html)

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

### 2. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Use [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 3. Install Node.js Dependencies

Already included in `package.json`:
- `@nestjs/bull` - Bull queue integration
- `bull` and `bullmq` - Job queue library
- `fluent-ffmpeg` - FFmpeg Node.js wrapper
- `ioredis` - Redis client

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# FFmpeg Paths
FFMPEG_PATH="/usr/bin/ffmpeg"
FFPROBE_PATH="/usr/bin/ffprobe"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""  # Leave empty if no password

# AWS S3 (for storing transcoded videos)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="devlife-academy-videos"
```

### Custom FFmpeg Paths

If FFmpeg is installed in a custom location:

```bash
# Find FFmpeg path
which ffmpeg
which ffprobe

# Update .env with actual paths
FFMPEG_PATH="/usr/local/bin/ffmpeg"
FFPROBE_PATH="/usr/local/bin/ffprobe"
```

## Database Schema

The system adds these fields to the Video model:

```prisma
model Video {
  // ... existing fields
  transcodingStatus   TranscodingStatus @default(PENDING)
  transcodingProgress Int               @default(0)
  transcodingError    String?
  qualityVariants     QualityVariant[]
}

enum TranscodingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model QualityVariant {
  id      String @id @default(uuid())
  videoId String
  quality String  // "360p", "720p", "1080p"
  url     String
  size    Int?
  bitrate Int?
  
  video   Video @relation(fields: [videoId], references: [id])
}
```

Run migration:
```bash
cd backend
npx prisma migrate dev --name add_ffmpeg_transcoding
npx prisma generate
```

## How It Works

### 1. Video Upload Flow

```typescript
// User uploads video
POST /api/videos
{
  "title": "My Video",
  "s3Key": "videos/user-id/original.mp4",
  // ... other metadata
}

// Automatically triggers transcoding job
Queue.add('transcode-video', {
  videoId: 'video-uuid',
  originalS3Key: 's3-key',
  userId: 'user-id'
})
```

### 2. Transcoding Process

The `TranscodingService` performs these steps:

1. **Download** original video from S3
2. **Extract metadata** (duration, resolution, bitrate)
3. **Determine qualities** based on original resolution
4. **Transcode** to each quality:
   - 360p: 640x360, 800kbps
   - 720p: 1280x720, 2500kbps
   - 1080p: 1920x1080, 5000kbps
5. **Upload** each quality to S3
6. **Generate** HLS master playlist
7. **Update** database with results
8. **Send** notification to user

### 3. Progress Tracking

The admin dashboard shows real-time transcoding progress:

- **Pending**: Job queued, not started
- **Processing**: Transcoding in progress (0-100%)
- **Completed**: Ready for viewing
- **Failed**: Error occurred (with error message)

## Quality Selection Logic

```typescript
// Original video is 1080p → generates 360p, 720p, 1080p
// Original video is 720p  → generates 360p, 720p
// Original video is 480p  → generates 360p only
```

Only generates qualities up to the original resolution.

## HLS Playlist Example

Master playlist (`master.m3u8`):
```
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.mp4

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p.mp4

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.mp4
```

## API Endpoints

### Get Transcoding Status

```http
GET /api/transcoding/status/:videoId
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "video-uuid",
  "title": "My Video",
  "transcodingStatus": "PROCESSING",
  "transcodingProgress": 65,
  "transcodingError": null,
  "hlsUrl": null,
  "qualityVariants": []
}
```

### Get Video with Qualities

```http
GET /api/videos/:id
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "video-uuid",
  "title": "My Video",
  "hlsUrl": "https://bucket.s3.region.amazonaws.com/.../master.m3u8",
  "qualityVariants": [
    {
      "quality": "360p",
      "url": "https://..../360p.mp4",
      "size": 5242880,
      "bitrate": 800
    },
    {
      "quality": "720p",
      "url": "https://..../720p.mp4",
      "size": 15728640,
      "bitrate": 2500
    }
  ]
}
```

## Monitoring & Troubleshooting

### Check Queue Status

```bash
# Redis CLI
redis-cli

# List all keys
KEYS *

# Check queue length
LLEN bull:transcoding:wait

# View job data
GET bull:transcoding:job-id
```

### View Logs

```bash
# Backend logs show transcoding progress
npm run start:dev

# Look for:
# [TranscodingService] Starting transcoding for video xxx
# [TranscodingService] Transcoding to 720p...
# [TranscodingService] Transcoding completed successfully
```

### Common Issues

**Issue: FFmpeg not found**
```
Error: spawn ffmpeg ENOENT
```
Solution: Install FFmpeg and set correct path in `.env`

**Issue: Redis connection failed**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
Solution: Start Redis server

**Issue: Out of disk space**
```
Error: ENOSPC: no space left on device
```
Solution: Free up disk space or configure different temp directory

**Issue: Transcoding failed**
- Check video format is supported (MP4, MOV, AVI, WebM)
- Ensure original video is not corrupted
- Check FFmpeg logs in backend console
- Verify S3 credentials and permissions

### Manual Retry

If a transcoding job fails, you can manually trigger it:

```bash
# In backend/src/transcoding/transcoding.service.ts
# Call transcodeVideo() with videoId and s3Key
```

Or delete and re-upload the video.

## Performance Optimization

### Parallel Processing

Configure Bull queue concurrency in `transcoding.module.ts`:

```typescript
BullModule.registerQueue({
  name: 'transcoding',
  processors: [{
    concurrency: 2,  // Process 2 videos simultaneously
    name: 'transcode-video'
  }]
})
```

### Resource Limits

FFmpeg can be CPU-intensive. Limit resources:

```typescript
// In transcoding.service.ts
ffmpeg(inputPath)
  .outputOptions([
    '-threads 2',  // Limit CPU threads
    '-preset fast', // Faster encoding (vs 'medium')
  ])
```

### Cleanup

Temporary files are automatically cleaned up after transcoding. To manually clean:

```bash
# Remove temp files
rm -rf /tmp/transcode-*
```

## Production Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# ... rest of Dockerfile
```

### Scaling

For high-volume platforms:

1. **Separate worker server**: Run transcoding on dedicated machines
2. **Use AWS MediaConvert**: For enterprise-grade transcoding
3. **Redis cluster**: For distributed queue
4. **Multiple workers**: Scale horizontally

### Monitoring

Set up monitoring for:
- Queue length (alert if > 100 jobs)
- Failed jobs (alert on any failures)
- Disk space (transcoding uses temp storage)
- Processing time (track average time per video)

## Cost Comparison

### FFmpeg (This Implementation)
- **Cost**: FREE (self-hosted)
- **Infrastructure**: Server + Redis
- **Scalability**: Manual (add workers)
- **Best for**: Small to medium platforms

### AWS MediaConvert
- **Cost**: ~$0.015/minute of transcoded video
- **Infrastructure**: Fully managed
- **Scalability**: Automatic
- **Best for**: Large platforms, enterprise

## Next Steps

1. Upload a test video through the admin dashboard
2. Monitor transcoding progress in dashboard
3. Verify transcoded videos in S3
4. Test HLS playback in video player
5. Set up monitoring and alerts
6. Configure auto-scaling if needed

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure FFmpeg, Redis, and S3 are properly configured
- Review the queue status in Redis
- Contact support if persistent issues occur

---

**Note**: This is a production-ready solution that can handle moderate traffic. For high-volume platforms processing hundreds of videos per day, consider AWS MediaConvert or other managed services for better scalability and reliability.
