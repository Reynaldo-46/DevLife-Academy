import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({ example: 'monthly', enum: ['monthly', 'annual'] })
  @IsEnum(['monthly', 'annual'])
  planType: 'monthly' | 'annual';
}
