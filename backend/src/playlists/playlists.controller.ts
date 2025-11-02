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
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoDto } from './dto/add-video.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  create(
    @CurrentUser() user: any,
    @Body() createPlaylistDto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.userId, createPlaylistDto);
  }

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.playlistsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playlistsService.findOne(id);
  }

  @Get('creator/:creatorId')
  findByCreator(
    @Param('creatorId') creatorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.playlistsService.findByCreator(
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
    @Body() updatePlaylistDto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, user.userId, updatePlaylistDto);
  }

  @Post(':id/videos')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  addVideo(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() addVideoDto: AddVideoDto,
  ) {
    return this.playlistsService.addVideo(id, user.userId, addVideoDto);
  }

  @Delete(':id/videos/:videoId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  removeVideo(
    @Param('id') id: string,
    @Param('videoId') videoId: string,
    @CurrentUser() user: any,
  ) {
    return this.playlistsService.removeVideo(id, user.userId, videoId);
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.playlistsService.remove(id, user.userId);
  }
}
