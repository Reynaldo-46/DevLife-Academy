import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { UploadRequestDto } from './dto/upload-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('upload-url')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  async getUploadUrl(
    @CurrentUser() user: any,
    @Body() uploadRequestDto: UploadRequestDto,
  ) {
    return this.videosService.getUploadUrl(
      user.userId,
      uploadRequestDto.filename,
      uploadRequestDto.contentType,
    );
  }

  @Post('thumbnail-upload-url')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  async getThumbnailUploadUrl(
    @CurrentUser() user: any,
    @Body() uploadRequestDto: UploadRequestDto,
  ) {
    return this.videosService.getThumbnailUploadUrl(
      user.userId,
      uploadRequestDto.filename,
      uploadRequestDto.contentType,
    );
  }

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  create(@CurrentUser() user: any, @Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(user.userId, createVideoDto);
  }

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.videosService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Get('creator/:creatorId')
  findByCreator(
    @Param('creatorId') creatorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.videosService.findByCreator(
      creatorId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateVideoDto: UpdateVideoDto,
  ) {
    return this.videosService.update(id, user.userId, updateVideoDto);
  }

  @Post(':id/publish')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.videosService.publish(id, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.videosService.remove(id, user.userId);
  }
}
