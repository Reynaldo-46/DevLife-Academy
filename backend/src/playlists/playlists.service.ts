import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoToPlaylistDto } from './dto/add-video-to-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPlaylistDto: CreatePlaylistDto) {
    return this.prisma.playlist.create({
      data: {
        ...createPlaylistDto,
        creatorId: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async findAll(creatorId?: string) {
    const where: any = {};
    if (creatorId) {
      where.creatorId = creatorId;
    }

    return this.prisma.playlist.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        videos: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                duration: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
          },
        },
        videos: {
          include: {
            video: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return playlist;
  }

  async update(id: string, userId: string, updatePlaylistDto: UpdatePlaylistDto) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id } });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own playlists');
    }

    return this.prisma.playlist.update({
      where: { id },
      data: updatePlaylistDto,
    });
  }

  async delete(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id } });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.prisma.playlist.delete({ where: { id } });
    return { message: 'Playlist deleted successfully' };
  }

  async addVideo(playlistId: string, userId: string, addVideoDto: AddVideoToPlaylistDto) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: { videos: true },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    // Check if video already exists in playlist
    const existingVideo = await this.prisma.playlistVideo.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId: addVideoDto.videoId,
        },
      },
    });

    if (existingVideo) {
      throw new ForbiddenException('Video already exists in this playlist');
    }

    // Get the next order number
    const maxOrder = playlist.videos.length > 0
      ? Math.max(...playlist.videos.map((v) => v.order))
      : 0;

    return this.prisma.playlistVideo.create({
      data: {
        playlistId,
        videoId: addVideoDto.videoId,
        order: addVideoDto.order ?? maxOrder + 1,
      },
    });
  }

  async removeVideo(playlistId: string, videoId: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own playlists');
    }

    await this.prisma.playlistVideo.deleteMany({
      where: {
        playlistId,
        videoId,
      },
    });

    return { message: 'Video removed from playlist successfully' };
  }
}
