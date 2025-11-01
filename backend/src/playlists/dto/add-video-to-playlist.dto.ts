import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddVideoToPlaylistDto {
  @ApiProperty({ example: 'uuid-of-video' })
  @IsString()
  videoId: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}
