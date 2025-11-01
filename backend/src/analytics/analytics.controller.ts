import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecordViewDto } from './dto/record-view.dto';

@ApiTags('analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('view')
  @ApiOperation({ summary: 'Record video view and watch duration' })
  async recordView(@Body() recordViewDto: RecordViewDto, @Request() req) {
    const userId = req.user?.userId || null;
    return this.analyticsService.recordView(
      recordViewDto.videoId,
      userId,
      recordViewDto.secondsWatched,
    );
  }

  @Get('video/:videoId')
  @ApiOperation({ summary: 'Get analytics for a specific video' })
  async getVideoAnalytics(@Param('videoId') videoId: string) {
    return this.analyticsService.getVideoAnalytics(videoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('creator/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator analytics dashboard' })
  async getCreatorDashboard(@Request() req) {
    return this.analyticsService.getCreatorAnalytics(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('creator/revenue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator revenue analytics' })
  async getCreatorRevenue(@Request() req) {
    return this.analyticsService.getSubscriptionRevenue(req.user.userId);
  }
}
