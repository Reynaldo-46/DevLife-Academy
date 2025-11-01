import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { TranscodingJobData } from '../transcoding/transcoding.processor';

@ApiTags('videos')
@Controller('api/videos')
export class VideosController {
  constructor(
    private videosService: VideosService,
    @InjectQueue('transcoding') private transcodingQueue: Queue<TranscodingJobData>,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new video (Admin only)' })
  async create(@Request() req, @Body() createVideoDto: CreateVideoDto) {
    const video = await this.videosService.create(req.user.userId, createVideoDto);
    
    // Add transcoding job to queue if S3 key is provided
    if (video.s3Key) {
      await this.transcodingQueue.add('transcode-video', {
        videoId: video.id,
        originalS3Key: video.s3Key,
        userId: req.user.userId,
      });
    }
    
    return video;
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all videos (Requires verified email)' })
  @ApiQuery({ name: 'visibility', required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async findAll(
    @Query('visibility') visibility?: string,
    @Query('creatorId') creatorId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.videosService.findAll({
      visibility,
      creatorId,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video by ID (Requires verified email)' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.videosService.findOne(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update video (Admin only)' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    return this.videosService.update(id, req.user.userId, updateVideoDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish video (Admin only)' })
  async publish(@Param('id') id: string, @Request() req) {
    return this.videosService.publish(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete video (Admin only)' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.videosService.delete(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/unlike video (Requires verified email)' })
  async like(@Param('id') id: string, @Request() req) {
    return this.videosService.likeVideo(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post(':id/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save/unsave video (Requires verified email)' })
  async save(@Param('id') id: string, @Request() req) {
    return this.videosService.saveVideo(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video comments (Requires verified email)' })
  async getComments(@Param('id') id: string) {
    return this.videosService.getComments(id);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to video (Requires verified email)' })
  async createComment(
    @Param('id') id: string,
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.videosService.createComment(
      id,
      req.user.userId,
      createCommentDto.content,
      createCommentDto.parentId,
    );
  }
}
