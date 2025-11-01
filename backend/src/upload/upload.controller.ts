import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

@ApiTags('upload')
@Controller('api/upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('presigned-url/video')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned URL for video upload (Admin only)' })
  async getPresignedVideoUrl(@Request() req, @Body() dto: GetPresignedUrlDto) {
    return this.uploadService.getPresignedUploadUrl(
      dto.fileName,
      dto.fileType,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('presigned-url/thumbnail')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned URL for thumbnail upload (Admin only)',
  })
  async getPresignedThumbnailUrl(@Request() req, @Body() dto: GetPresignedUrlDto) {
    return this.uploadService.getPresignedThumbnailUploadUrl(
      dto.fileName,
      req.user.userId,
    );
  }
}
