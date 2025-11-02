import { IsString, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({ example: 'My First Vlog' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'This is my first dev vlog...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['coding', 'vlog', 'developer'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'PUBLIC', enum: ['PUBLIC', 'PRIVATE', 'PAID'], required: false })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE', 'PAID'])
  visibility?: string;

  @ApiProperty({ example: 9.99, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  // 🔽 Local file paths for self-hosted videos
  @IsOptional()
  @IsString()
  @ApiProperty({ example: '/uploads/videos/myvideo.mp4', required: false })
  originalPath?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '/uploads/processed/myvideo_720p.mp4', required: false })
  processedPath?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '/uploads/thumbnails/myvideo_thumb.jpg', required: false })
  thumbnailPath?: string;

  @ApiProperty({ example: 300, required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transcript?: string;
}
