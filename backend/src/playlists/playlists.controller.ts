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
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoToPlaylistDto } from './dto/add-video-to-playlist.dto';

@ApiTags('playlists')
@Controller('api/playlists')
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new playlist' })
  async create(@Request() req, @Body() createPlaylistDto: CreatePlaylistDto) {
    return this.playlistsService.create(req.user.userId, createPlaylistDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all playlists' })
  @ApiQuery({ name: 'creatorId', required: false })
  async findAll(@Query('creatorId') creatorId?: string) {
    return this.playlistsService.findAll(creatorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID' })
  async findOne(@Param('id') id: string) {
    return this.playlistsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update playlist' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updatePlaylistDto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, req.user.userId, updatePlaylistDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete playlist' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.playlistsService.delete(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/videos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add video to playlist' })
  async addVideo(
    @Param('id') id: string,
    @Request() req,
    @Body() addVideoDto: AddVideoToPlaylistDto,
  ) {
    return this.playlistsService.addVideo(id, req.user.userId, addVideoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/videos/:videoId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove video from playlist' })
  async removeVideo(
    @Param('id') id: string,
    @Param('videoId') videoId: string,
    @Request() req,
  ) {
    return this.playlistsService.removeVideo(id, videoId, req.user.userId);
  }
}
