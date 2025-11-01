import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordViewDto {
  @ApiProperty({ example: 'uuid-of-video' })
  @IsString()
  videoId: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  secondsWatched: number;
}
