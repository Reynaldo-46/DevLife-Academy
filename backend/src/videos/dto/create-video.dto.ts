import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDecimal,
} from 'class-validator';
import { VideoVisibility } from '@prisma/client';

export class CreateVideoDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(VideoVisibility)
  visibility?: VideoVisibility;

  @IsOptional()
  @IsDecimal()
  price?: number;

  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  thumbnailFilename?: string;

  @IsNumber()
  duration: number;
}
