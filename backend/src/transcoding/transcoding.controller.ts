import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TranscodingService } from './transcoding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('transcoding')
@Controller('transcoding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TranscodingController {
  constructor(private transcodingService: TranscodingService) {}

  @Get('status/:videoId')
  @ApiOperation({ summary: 'Get transcoding status for a video' })
  async getTranscodingStatus(@Param('videoId') videoId: string) {
    return this.transcodingService.getTranscodingStatus(videoId);
  }
}
