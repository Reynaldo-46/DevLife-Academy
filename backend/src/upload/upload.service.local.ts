import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    this.initializeDirectories();
  }

  /**
   * Initialize upload directories
   */
  private async initializeDirectories() {
    const dirs = [
      path.join(this.uploadDir, 'originals'),
      path.join(this.uploadDir, 'hls'),
      path.join(this.uploadDir, 'thumbnails'),
      path.join(this.uploadDir, 'profile-images'),
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  /**
   * Upload video file to local storage
   */
  async uploadVideo(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ localPath: string; filename: string; url: string }> {
    // Validate file type
    const allowedMimeTypes = [
      'video/mp4',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/webm',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: MP4, MOV, AVI, WebM',
      );
    }

    // Validate file size (2GB max)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size exceeds maximum allowed size of 2GB',
      );
    }

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const filename = `${uuidv4()}.${fileExtension}`;

    // Create user directory if it doesn't exist
    const userDir = path.join(this.uploadDir, 'originals', userId);
    await fs.mkdir(userDir, { recursive: true });

    // Save file
    const localPath = path.join('uploads', 'originals', userId, filename);
    const fullPath = path.join(process.cwd(), localPath);
    await fs.writeFile(fullPath, file.buffer);

    // Generate public URL
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/${localPath.replace(/\\/g, '/')}`;

    return { localPath, filename, url };
  }

  /**
   * Upload thumbnail to local storage
   */
  async uploadThumbnail(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ localPath: string; filename: string; url: string }> {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPG, PNG, WebP',
      );
    }

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const filename = `${uuidv4()}.${fileExtension}`;

    // Create user directory
    const userDir = path.join(this.uploadDir, 'thumbnails', userId);
    await fs.mkdir(userDir, { recursive: true });

    // Save file
    const localPath = path.join('uploads', 'thumbnails', userId, filename);
    const fullPath = path.join(process.cwd(), localPath);
    await fs.writeFile(fullPath, file.buffer);

    // Generate public URL
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/${localPath.replace(/\\/g, '/')}`;

    return { localPath, filename, url };
  }

  /**
   * Upload profile image to local storage
   */
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ localPath: string; filename: string; url: string }> {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPG, PNG, WebP',
      );
    }

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const filename = `${uuidv4()}.${fileExtension}`;

    // Create user directory
    const userDir = path.join(this.uploadDir, 'profile-images', userId);
    await fs.mkdir(userDir, { recursive: true });

    // Save file
    const localPath = path.join('uploads', 'profile-images', userId, filename);
    const fullPath = path.join(process.cwd(), localPath);
    await fs.writeFile(fullPath, file.buffer);

    // Generate public URL
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/${localPath.replace(/\\/g, '/')}`;

    return { localPath, filename, url };
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(localPath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), localPath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`Failed to delete file ${localPath}:`, error);
      // Don't throw error if file doesn't exist
    }
  }

  /**
   * Get public URL for a local file
   */
  getPublicUrl(localPath: string): string {
    const baseUrl = this.configService.get<string>('API_URL') || 'http://localhost:3001';
    return `${baseUrl}/${localPath.replace(/\\/g, '/')}`;
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts[parts.length - 1].toLowerCase();
  }
}
