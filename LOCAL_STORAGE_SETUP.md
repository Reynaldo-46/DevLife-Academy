# Local File Storage Setup Guide

Complete guide for setting up local file storage for DevLife Academy platform (no AWS S3 required).

---

## Overview

DevLife Academy uses a local file storage system instead of cloud storage (AWS S3). All videos, thumbnails, and profile images are stored directly on your server's disk.

### Benefits
- ✅ **FREE** - No cloud storage costs
- ✅ **Fast** - No network latency, direct disk I/O
- ✅ **Simple** - No AWS account or configuration needed
- ✅ **Full Control** - Complete ownership of your files
- ✅ **Privacy** - Files stay on your server

### Directory Structure

```
backend/
├── uploads/
│   ├── originals/          # Raw uploaded videos
│   │   └── {userId}/
│   │       └── {uuid}.mp4
│   ├── hls/                # Transcoded HLS files
│   │   └── {videoId}/
│   │       ├── master.m3u8
│   │       ├── 360p.mp4
│   │       ├── 720p.mp4
│   │       └── 1080p.mp4
│   ├── thumbnails/         # Video thumbnails
│   │   └── {userId}/
│   │       └── {uuid}.jpg
│   └── profile-images/     # User profile pictures
│       └── {userId}/
│           └── {uuid}.jpg
```

---

## Setup Instructions

### 1. Create Upload Directories

The application will create these automatically, but you can create them manually for proper permissions:

```bash
cd backend
mkdir -p uploads/originals
mkdir -p uploads/hls
mkdir -p uploads/thumbnails
mkdir -p uploads/profile-images
```

### 2. Set Directory Permissions

**Linux/macOS:**
```bash
chmod 755 uploads
chmod 755 uploads/originals
chmod 755 uploads/hls
chmod 755 uploads/thumbnails
chmod 755 uploads/profile-images
```

**Windows:**
- Right-click on `uploads` folder
- Properties → Security
- Ensure your user account has Read & Write permissions

### 3. Configure Environment Variables

Edit `backend/.env`:

```env
# Upload configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2147483648  # 2GB in bytes
API_URL=http://localhost:3001

# FFmpeg paths (for transcoding)
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Redis (for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Install FFmpeg

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
- Download from https://ffmpeg.org/download.html
- Add to PATH
- Set FFMPEG_PATH in .env

### 5. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

The uploads directory will be served at: `http://localhost:3001/uploads/`

---

## How It Works

### Upload Flow

1. **User uploads video:**
   - Frontend sends multipart FormData to `/api/upload/video`
   - File is validated (type, size)
   - Saved to `uploads/originals/{userId}/{uuid}.mp4`
   - Returns local path and public URL

2. **Video record created:**
   - Database stores `originalPath` (local file path)
   - `transcodingStatus` set to `PENDING`
   - Transcoding job added to Redis queue

3. **Transcoding process:**
   - Worker reads video from `uploads/originals/`
   - FFmpeg transcodes to 360p, 720p, 1080p
   - Saves to `uploads/hls/{videoId}/`
   - Generates HLS master playlist
   - Updates database with `hlsPath`

4. **Video playback:**
   - Frontend requests HLS URL
   - Gets `/uploads/hls/{videoId}/master.m3u8`
   - Video player loads adaptive stream
   - Backend serves files statically

---

## File Serving

### Static File Middleware

The backend serves files using Express static middleware:

```typescript
// In main.ts
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

### Public URLs

- **Videos:** `http://localhost:3001/uploads/hls/{videoId}/master.m3u8`
- **Thumbnails:** `http://localhost:3001/uploads/thumbnails/{userId}/{uuid}.jpg`
- **Profile Images:** `http://localhost:3001/uploads/profile-images/{userId}/{uuid}.jpg`
- **Original:** `http://localhost:3001/uploads/originals/{userId}/{uuid}.mp4`

---

## Storage Management

### Disk Space Requirements

Estimate storage needs:

```
Original video: ~500MB (10 min 1080p)
Transcoded files:
  - 360p: ~50MB
  - 720p: ~150MB
  - 1080p: ~350MB
Total per video: ~1GB

For 100 videos: ~100GB
For 1000 videos: ~1TB
```

**Recommendation:** Start with 500GB disk space

### Monitoring Disk Space

**Linux:**
```bash
df -h | grep uploads
du -sh backend/uploads/*
```

**Monitor script:**
```bash
#!/bin/bash
THRESHOLD=80
USAGE=$(df -h /path/to/uploads | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt $THRESHOLD ]; then
  echo "Warning: Disk usage is at ${USAGE}%"
fi
```

### Cleanup Strategy

**Delete old original files:**
```bash
# Keep originals for 30 days after transcoding
find uploads/originals -type f -mtime +30 -delete
```

**Archive to external storage:**
```bash
# Rsync to external drive
rsync -av --remove-source-files uploads/ /mnt/backup/uploads/
```

---

## Backup Strategy

### Option 1: Local Backup

**Daily backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/mnt/backup/devlife-academy"
DATE=$(date +%Y-%m-%d)

# Create backup
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" uploads/

# Keep only last 7 days
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +7 -delete
```

**Cron job:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### Option 2: Cloud Sync

**Sync to cloud storage (optional):**
```bash
# Sync to AWS S3 for backup
aws s3 sync uploads/ s3://your-backup-bucket/uploads/

# Or use rclone for other providers
rclone sync uploads/ remote:backup/uploads
```

### Option 3: External Drive

```bash
# Mount external drive
sudo mount /dev/sdb1 /mnt/backup

# Sync files
rsync -av uploads/ /mnt/backup/uploads/
```

---

## Production Deployment

### Nginx Configuration

For production, use Nginx to serve static files:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploads directory
    location /uploads {
        alias /path/to/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Enable gzip compression
        gzip on;
        gzip_types video/mp4 application/vnd.apple.mpegurl;
    }

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri /index.html;
    }
}
```

### File Permissions

```bash
# Nginx user (usually www-data)
sudo chown -R www-data:www-data uploads
sudo chmod -R 755 uploads
```

### Security

**1. Prevent directory listing:**
```nginx
location /uploads {
    autoindex off;
}
```

**2. Limit file types:**
```nginx
location ~* /uploads/.*\.(php|sh|bash)$ {
    deny all;
}
```

**3. Rate limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=upload:10m rate=10r/s;

location /api/upload {
    limit_req zone=upload burst=20;
    proxy_pass http://localhost:3001;
}
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/originals uploads/hls uploads/thumbnails uploads/profile-images

# Build
RUN npm run build

# Set permissions
RUN chmod -R 755 uploads

EXPOSE 3001

# Volume for persistent storage
VOLUME ["/app/uploads"]

CMD ["npm", "run", "start:prod"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/uploads
    environment:
      - UPLOAD_DIR=/app/uploads
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=devlife_academy
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
  uploads:
```

---

## Troubleshooting

### Issue: "Permission denied" when uploading

**Solution:**
```bash
chmod -R 777 uploads  # Temporary for testing
chmod -R 755 uploads  # Production
chown -R yourusername:yourusername uploads
```

### Issue: "Disk full" error

**Solution:**
```bash
# Check disk space
df -h

# Clean up old files
find uploads/originals -mtime +30 -delete

# Compress old videos
find uploads/originals -name "*.mp4" -exec gzip {} \;
```

### Issue: Videos not playing

**Check:**
1. File exists: `ls -la uploads/hls/{videoId}/`
2. Permissions: `chmod 644 uploads/hls/{videoId}/*`
3. URL accessible: `curl http://localhost:3001/uploads/hls/{videoId}/master.m3u8`
4. HLS format: Check master.m3u8 content

### Issue: Slow upload speeds

**Optimize:**
1. Increase Nginx body size:
   ```nginx
   client_max_body_size 2G;
   ```
2. Use SSD for uploads directory
3. Enable compression in Multer
4. Check network bandwidth

---

## Performance Optimization

### 1. Use SSD for Storage

```bash
# Move uploads to SSD
mv uploads /mnt/ssd/uploads
ln -s /mnt/ssd/uploads uploads
```

### 2. Enable Compression

```typescript
// In upload.service.ts
import * as zlib from 'zlib';

async uploadVideo(file: Buffer) {
  const compressed = await zlib.gzip(file);
  await fs.writeFile(path, compressed);
}
```

### 3. Parallel Transcoding

```typescript
// Process multiple videos simultaneously
const queue = new Queue('transcoding', {
  concurrency: 4, // 4 videos at once
});
```

### 4. CDN Integration (Optional)

Use a CDN for faster delivery:

```bash
# Sync uploads to CDN
rsync -av uploads/ cdn:/var/www/cdn/uploads/
```

---

## Migration from S3

If you previously used AWS S3, migrate to local storage:

### 1. Download all files from S3

```bash
aws s3 sync s3://your-bucket/videos uploads/originals
aws s3 sync s3://your-bucket/hls uploads/hls
aws s3 sync s3://your-bucket/thumbnails uploads/thumbnails
```

### 2. Update database paths

```sql
UPDATE videos 
SET original_path = REPLACE(s3_key, 's3://bucket/', 'uploads/originals/');

UPDATE videos 
SET hls_path = REPLACE(hls_url, 'https://bucket.s3.amazonaws.com/', 'uploads/hls/');
```

### 3. Test and verify

```bash
# Check file count
find uploads -type f | wc -l

# Test a video
curl http://localhost:3001/uploads/hls/test-video/master.m3u8
```

---

## Summary

Local file storage provides a simple, cost-effective solution for DevLife Academy:

✅ No cloud dependencies
✅ Complete control over files
✅ Fast local processing
✅ Easy backup and migration
✅ Production-ready with Nginx

For questions, see README.md or create an issue.
