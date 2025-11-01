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
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('videos')
@Controller('api/videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new video' })
  async create(@Request() req, @Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(req.user.userId, createVideoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all videos' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.videosService.findOne(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update video' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    return this.videosService.update(id, req.user.userId, updateVideoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish video' })
  async publish(@Param('id') id: string, @Request() req) {
    return this.videosService.publish(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete video' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.videosService.delete(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/unlike video' })
  async like(@Param('id') id: string, @Request() req) {
    return this.videosService.likeVideo(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save/unsave video' })
  async save(@Param('id') id: string, @Request() req) {
    return this.videosService.saveVideo(id, req.user.userId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get video comments' })
  async getComments(@Param('id') id: string) {
    return this.videosService.getComments(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to video' })
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
