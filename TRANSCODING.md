# Video Transcoding Setup Guide

This guide provides instructions for setting up video transcoding on DevLife Academy platform to convert uploaded videos into multiple resolutions for adaptive streaming.

## Overview

Video transcoding converts uploaded video files into multiple formats and resolutions, enabling adaptive bitrate streaming (HLS) for optimal playback across different devices and network conditions.

## Supported Solutions

### Option 1: AWS MediaConvert (Recommended for Production)

AWS MediaConvert is a fully managed video transcoding service that's scalable and reliable.

**Prerequisites:**
- AWS account
- S3 bucket configured for video storage
- IAM role with MediaConvert permissions

**Setup Steps:**

1. **Create MediaConvert IAM Role:**
```bash
# Create role with MediaConvert permissions
aws iam create-role --role-name MediaConvertRole --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy --role-name MediaConvertRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name MediaConvertRole --policy-arn arn:aws:iam::aws:policy/AWSElementalMediaConvertFullAccess
```

2. **Configure Environment Variables:**
```env
AWS_MEDIACONVERT_ENDPOINT=https://[your-account-id].mediaconvert.[region].amazonaws.com
AWS_MEDIACONVERT_ROLE_ARN=arn:aws:iam::[account-id]:role/MediaConvertRole
AWS_MEDIACONVERT_QUEUE=Default
```

3. **Backend Implementation:**

```typescript
// src/transcoding/transcoding.service.ts
import { Injectable } from '@nestjs/common';
import { MediaConvert } from '@aws-sdk/client-mediaconvert';

@Injectable()
export class TranscodingService {
  private mediaConvert: MediaConvert;

  constructor() {
    this.mediaConvert = new MediaConvert({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT,
    });
  }

  async transcodeVideo(s3Key: string, videoId: string) {
    const params = {
      Role: process.env.AWS_MEDIACONVERT_ROLE_ARN,
      Settings: {
        Inputs: [
          {
            FileInput: `s3://${process.env.AWS_S3_BUCKET}/${s3Key}`,
          },
        ],
        OutputGroups: [
          {
            Name: 'HLS',
            OutputGroupSettings: {
              Type: 'HLS_GROUP_SETTINGS',
              HlsGroupSettings: {
                Destination: `s3://${process.env.AWS_S3_BUCKET}/transcoded/${videoId}/`,
                SegmentLength: 10,
                MinSegmentLength: 0,
              },
            },
            Outputs: [
              // 1080p
              { VideoDescription: { Height: 1080, Width: 1920, Codec: 'H_264', Bitrate: 5000000 } },
              // 720p
              { VideoDescription: { Height: 720, Width: 1280, Codec: 'H_264', Bitrate: 2500000 } },
              // 480p
              { VideoDescription: { Height: 480, Width: 854, Codec: 'H_264', Bitrate: 1000000 } },
              // 360p
              { VideoDescription: { Height: 360, Width: 640, Codec: 'H_264', Bitrate: 600000 } },
            ],
          },
        ],
      },
    };

    const result = await this.mediaConvert.createJob(params);
    return result.Job.Id;
  }
}
```

### Option 2: FFmpeg (Self-Hosted)

FFmpeg is a free, open-source solution for self-hosted environments.

**Prerequisites:**
- FFmpeg installed on server
- Sufficient storage and CPU resources
- Background job queue (BullMQ recommended)

**Installation:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

**Implementation:**

1. **Install BullMQ for Background Jobs:**
```bash
npm install bull bullmq ioredis
```

2. **Create Transcoding Queue:**

```typescript
// src/queues/transcoding.queue.ts
import { Queue } from 'bullmq';

export const transcodingQueue = new Queue('transcoding', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
});
```

3. **Create Transcoding Worker:**

```typescript
// src/workers/transcoding.worker.ts
import { Worker } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const worker = new Worker('transcoding', async (job) => {
  const { inputPath, outputDir, videoId } = job.data;

  const resolutions = [
    { name: '1080p', height: 1080, bitrate: '5000k' },
    { name: '720p', height: 720, bitrate: '2500k' },
    { name: '480p', height: 480, bitrate: '1000k' },
    { name: '360p', height: 360, bitrate: '600k' },
  ];

  for (const res of resolutions) {
    const outputPath = `${outputDir}/${videoId}_${res.name}.m3u8`;
    
    const command = `ffmpeg -i ${inputPath} \\
      -vf scale=-2:${res.height} \\
      -c:v libx264 -b:v ${res.bitrate} \\
      -c:a aac -b:a 128k \\
      -f hls -hls_time 10 -hls_list_size 0 \\
      ${outputPath}`;

    await execAsync(command);
    await job.updateProgress((resolutions.indexOf(res) + 1) / resolutions.length * 100);
  }

  return { videoId, status: 'completed' };
});
```

## Database Schema Updates

Add transcoding status to Video model:

```prisma
enum TranscodingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model Video {
  // ... existing fields
  transcodingStatus   TranscodingStatus @default(PENDING)
  transcodingJobId    String?
  hlsManifestUrl      String?
}
```

## Frontend Integration

Update video player to support HLS:

```bash
npm install hls.js
```

```typescript
import Hls from 'hls.js';

const VideoPlayer = ({ hlsUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (Hls.isSupported() && videoRef.current) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = hlsUrl;
    }
  }, [hlsUrl]);

  return <video ref={videoRef} controls className="w-full" />;
};
```

## Monitoring & Progress Updates

Track transcoding progress in real-time:

```typescript
// Send progress updates via WebSocket
@Injectable()
export class TranscodingService {
  constructor(private notificationGateway: NotificationGateway) {}

  async monitorTranscodingJob(jobId: string, userId: string) {
    // Poll for job status
    const status = await this.checkJobStatus(jobId);
    
    this.notificationGateway.sendNotificationToUser(userId, {
      type: 'transcoding_progress',
      title: 'Video Processing',
      message: `Your video is ${status}% complete`,
    });
  }
}
```

## Cost Optimization

**AWS MediaConvert:**
- ~$0.015 per minute of video transcoded
- Use spot pricing when available
- Delete source files after transcoding

**FFmpeg:**
- Server costs only
- Scale horizontally with worker nodes
- Use spot instances for workers

## Best Practices

1. **Queue Management:**
   - Limit concurrent transcoding jobs
   - Prioritize based on upload time
   - Retry failed jobs with exponential backoff

2. **Storage:**
   - Use lifecycle policies to archive old videos
   - Compress thumbnails
   - Clean up failed transcoding artifacts

3. **Monitoring:**
   - Track transcoding success rate
   - Monitor queue depth
   - Alert on failed jobs

4. **User Experience:**
   - Allow playback of original while transcoding
   - Show transcoding progress
   - Email notification on completion

## Troubleshooting

**Common Issues:**

1. **Transcoding Fails:**
   - Check input file format compatibility
   - Verify IAM permissions
   - Check disk space

2. **Slow Processing:**
   - Increase worker instances
   - Use faster instance types
   - Optimize FFmpeg parameters

3. **HLS Playback Issues:**
   - Check CORS settings on S3
   - Verify HLS manifest structure
   - Test with different players

## Additional Resources

- [AWS MediaConvert Documentation](https://docs.aws.amazon.com/mediaconvert/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS.js Documentation](https://github.com/video-dev/hls.js/)
- [BullMQ Documentation](https://docs.bullmq.io/)
