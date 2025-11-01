import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'devlife-academy-videos';

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Generate a presigned URL for direct upload from frontend
   */
  async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    userId: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    // Validate file type
    const allowedTypes = [
      'video/mp4',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/webm',
    ];

    if (!allowedTypes.includes(fileType)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: MP4, MOV, AVI, WebM',
      );
    }

    // Generate unique S3 key
    const fileExtension = this.getFileExtension(fileName);
    const s3Key = `videos/${userId}/${uuidv4()}.${fileExtension}`;

    // Create presigned URL (valid for 15 minutes)
    // ACL: 'public-read' allows the video to be publicly viewable after upload
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: fileType,
      ACL: 'public-read', // Allow public read access for viewing videos
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    return { uploadUrl, s3Key };
  }

  /**
   * Generate a presigned URL for thumbnail upload
   */
  async getPresignedThumbnailUploadUrl(
    fileName: string,
    userId: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    const fileExtension = this.getFileExtension(fileName);
    const s3Key = `thumbnails/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: `image/${fileExtension}`,
      ACL: 'public-read', // Allow public read access for thumbnails
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    return { uploadUrl, s3Key };
  }

  /**
   * Generate a presigned URL for profile image upload
   */
  async getPresignedProfileImageUploadUrl(
    fileName: string,
    userId: string,
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    const fileExtension = this.getFileExtension(fileName);
    const s3Key = `profile-images/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: `image/${fileExtension}`,
      ACL: 'public-read', // Allow public read access for profile images
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    return { uploadUrl, s3Key };
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get the public URL for an S3 object
   */
  getPublicUrl(s3Key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts[parts.length - 1].toLowerCase();
  }
}
