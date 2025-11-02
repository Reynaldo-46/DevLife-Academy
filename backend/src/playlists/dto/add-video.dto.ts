import { IsString, IsNumber, IsOptional } from 'class-validator';

export class AddVideoDto {
  @IsString()
  videoId: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
