import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { NotificationsService } from '../notifications/notifications.service';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const writeFile = promisify(fs.writeFile);

interface TranscodingResult {
  quality: string;
  s3Key: string;
  url: string;
  size: number;
  bitrate: number;
}

@Injectable()
export class TranscodingService {
  private readonly logger = new Logger(TranscodingService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'devlife-academy-videos';
    
    // FFmpeg paths (install ffmpeg on your server first)
    this.ffmpegPath = this.configService.get<string>('FFMPEG_PATH') || '/usr/bin/ffmpeg';
    this.ffprobePath = this.configService.get<string>('FFPROBE_PATH') || '/usr/bin/ffprobe';

    // Set FFmpeg paths
    ffmpeg.setFfmpegPath(this.ffmpegPath);
    ffmpeg.setFfprobePath(this.ffprobePath);

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Transcode video to multiple resolutions and generate HLS playlist
   */
  async transcodeVideo(videoId: string, originalS3Key: string): Promise<void> {
    this.logger.log(`Starting transcoding for video ${videoId}`);
    
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    try {
      // Update status to PROCESSING
      await this.updateTranscodingStatus(videoId, 'PROCESSING', 0);

      // Create temporary directory for processing
      const tempDir = path.join(os.tmpdir(), `transcode-${videoId}`);
      await mkdir(tempDir, { recursive: true });

      // Download original video from S3
      this.logger.log(`Downloading original video from S3: ${originalS3Key}`);
      const originalVideoPath = path.join(tempDir, 'original.mp4');
      await this.downloadFromS3(originalS3Key, originalVideoPath);

      // Get video metadata
      const metadata = await this.getVideoMetadata(originalVideoPath);
      this.logger.log(`Video metadata: ${JSON.stringify(metadata)}`);

      // Update video duration
      if (metadata.duration) {
        await this.prisma.video.update({
          where: { id: videoId },
          data: { duration: Math.round(metadata.duration) },
        });
      }

      // Define quality variants to generate
      const qualities = this.getQualitiesForVideo(metadata.height);
      this.logger.log(`Generating qualities: ${qualities.map(q => q.name).join(', ')}`);

      const transcodedFiles: TranscodingResult[] = [];
      let completedCount = 0;

      // Transcode to each quality
      for (const quality of qualities) {
        this.logger.log(`Transcoding to ${quality.name}...`);
        
        const outputPath = path.join(tempDir, `${quality.name}.mp4`);
        await this.transcodeToQuality(originalVideoPath, outputPath, quality);

        // Upload to S3
        const s3Key = `videos/${video.creatorId}/${videoId}/hls/${quality.name}.mp4`;
        await this.uploadToS3(outputPath, s3Key, 'video/mp4');

        const fileStats = fs.statSync(outputPath);
        const url = this.getS3Url(s3Key);

        transcodedFiles.push({
          quality: quality.name,
          s3Key,
          url,
          size: fileStats.size,
          bitrate: quality.bitrate,
        });

        // Update progress
        completedCount++;
        const progress = Math.round((completedCount / qualities.length) * 80); // Reserve 20% for HLS generation
        await this.updateTranscodingStatus(videoId, 'PROCESSING', progress);
      }

      // Generate HLS playlist
      this.logger.log('Generating HLS master playlist...');
      const hlsManifestPath = await this.generateHLSPlaylist(tempDir, transcodedFiles, videoId);
      
      // Upload HLS manifest to S3
      const hlsS3Key = `videos/${video.creatorId}/${videoId}/hls/master.m3u8`;
      await this.uploadToS3(hlsManifestPath, hlsS3Key, 'application/vnd.apple.mpegurl');
      const hlsUrl = this.getS3Url(hlsS3Key);

      // Save quality variants to database
      for (const file of transcodedFiles) {
        await this.prisma.qualityVariant.create({
          data: {
            videoId,
            quality: file.quality,
            url: file.url,
            size: file.size,
            bitrate: file.bitrate,
          },
        });
      }

      // Update video with HLS URL and status
      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          hlsUrl,
          transcodingStatus: 'COMPLETED',
          transcodingProgress: 100,
        },
      });

      // Send notification to creator
      await this.notificationsService.create({
        userId: video.creatorId,
        type: 'video_transcoding',
        title: 'Video transcoding completed',
        message: `Your video "${video.title}" has been successfully transcoded and is ready for viewing.`,
        link: `/videos/${videoId}`,
      });

      // Cleanup temp files
      await this.cleanupTempDir(tempDir);

      this.logger.log(`Transcoding completed successfully for video ${videoId}`);
    } catch (error) {
      this.logger.error(`Transcoding failed for video ${videoId}:`, error);
      
      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          transcodingStatus: 'FAILED',
          transcodingError: error.message,
        },
      });

      // Send error notification
      await this.notificationsService.create({
        userId: video.creatorId,
        type: 'video_transcoding',
        title: 'Video transcoding failed',
        message: `Transcoding failed for "${video.title}". Please try uploading again or contact support.`,
        link: `/videos/${videoId}`,
      });

      throw error;
    }
  }

  /**
   * Transcode video to specific quality
   */
  private async transcodeToQuality(
    inputPath: string,
    outputPath: string,
    quality: { name: string; width: number; height: number; bitrate: number },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=${quality.width}:${quality.height}`,
          `-b:v ${quality.bitrate}k`,
          '-c:v libx264',
          '-preset medium',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart', // Enable streaming
        ])
        .output(outputPath)
        .on('end', () => {
          this.logger.log(`Transcoding to ${quality.name} completed`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`Transcoding to ${quality.name} failed:`, err);
          reject(err);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            this.logger.debug(`${quality.name} progress: ${progress.percent.toFixed(2)}%`);
          }
        })
        .run();
    });
  }

  /**
   * Get video metadata using ffprobe
   */
  private async getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
          resolve({
            duration: metadata.format.duration,
            width: videoStream?.width,
            height: videoStream?.height,
            bitrate: metadata.format.bit_rate,
          });
        }
      });
    });
  }

  /**
   * Determine which quality variants to generate based on original video height
   */
  private getQualitiesForVideo(originalHeight: number): Array<{ name: string; width: number; height: number; bitrate: number }> {
    const allQualities = [
      { name: '360p', width: 640, height: 360, bitrate: 800 },
      { name: '720p', width: 1280, height: 720, bitrate: 2500 },
      { name: '1080p', width: 1920, height: 1080, bitrate: 5000 },
    ];

    // Only generate qualities up to the original video resolution
    return allQualities.filter((q) => q.height <= originalHeight);
  }

  /**
   * Generate HLS master playlist
   */
  private async generateHLSPlaylist(
    tempDir: string,
    transcodedFiles: TranscodingResult[],
    videoId: string,
  ): Promise<string> {
    const playlistPath = path.join(tempDir, 'master.m3u8');
    
    let playlistContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    for (const file of transcodedFiles) {
      const filename = path.basename(file.s3Key);
      playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${file.bitrate * 1000},RESOLUTION=${this.getResolution(file.quality)}\n`;
      playlistContent += `${filename}\n\n`;
    }

    await writeFile(playlistPath, playlistContent);
    return playlistPath;
  }

  /**
   * Get resolution string from quality name
   */
  private getResolution(quality: string): string {
    const resolutions = {
      '360p': '640x360',
      '720p': '1280x720',
      '1080p': '1920x1080',
    };
    return resolutions[quality] || '1280x720';
  }

  /**
   * Download file from S3
   */
  private async downloadFromS3(s3Key: string, localPath: string): Promise<void> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as any;
    const fileStream = fs.createWriteStream(localPath);

    return new Promise((resolve, reject) => {
      stream.pipe(fileStream);
      stream.on('error', reject);
      fileStream.on('finish', resolve);
    });
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(localPath: string, s3Key: string, contentType: string): Promise<void> {
    const fileBuffer = fs.readFileSync(localPath);
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    this.logger.log(`Uploaded to S3: ${s3Key}`);
  }

  /**
   * Get public S3 URL
   */
  private getS3Url(s3Key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  /**
   * Update transcoding status and progress
   */
  private async updateTranscodingStatus(
    videoId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    progress: number,
  ): Promise<void> {
    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        transcodingStatus: status,
        transcodingProgress: progress,
      },
    });
  }

  /**
   * Cleanup temporary directory
   */
  private async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        await unlink(path.join(tempDir, file));
      }
      await rmdir(tempDir);
      this.logger.log(`Cleaned up temporary directory: ${tempDir}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup temp directory:`, error);
    }
  }

  /**
   * Get transcoding status for a video
   */
  async getTranscodingStatus(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        transcodingStatus: true,
        transcodingProgress: true,
        transcodingError: true,
        hlsUrl: true,
        qualityVariants: true,
      },
    });

    return video;
  }
}
