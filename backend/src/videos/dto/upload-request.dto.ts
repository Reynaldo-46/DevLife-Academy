import { IsString } from 'class-validator';

export class UploadRequestDto {
  @IsString()
  filename: string;

  @IsString()
  contentType: string;
}
