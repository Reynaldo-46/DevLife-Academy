import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddVideoDto } from './dto/add-video.dto';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPlaylistDto: CreatePlaylistDto) {
    return await this.prisma.playlist.create({
      data: {
        creatorId: userId,
        title: createPlaylistDto.title,
        description: createPlaylistDto.description,
        coverImage: createPlaylistDto.coverImage,
        isPublic: createPlaylistDto.isPublic ?? true,
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

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where: {
          isPublic: true,
        },
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
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.playlist.count({
        where: {
          isPublic: true,
        },
      }),
    ]);

    return {
      playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
            video: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return playlist;
  }

  async findByCreator(creatorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where: { creatorId },
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
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.playlist.count({
        where: { creatorId },
      }),
    ]);

    return {
      playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    userId: string,
    updatePlaylistDto: UpdatePlaylistDto,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own playlists');
    }

    return await this.prisma.playlist.update({
      where: { id },
      data: {
        title: updatePlaylistDto.title,
        description: updatePlaylistDto.description,
        coverImage: updatePlaylistDto.coverImage,
        isPublic: updatePlaylistDto.isPublic,
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

  async addVideo(id: string, userId: string, addVideoDto: AddVideoDto) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
      include: {
        videos: true,
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException(
        'You can only add videos to your own playlists',
      );
    }

    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: addVideoDto.videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Determine the order
    const order = addVideoDto.order ?? playlist.videos.length;

    return await this.prisma.playlistVideo.create({
      data: {
        playlistId: id,
        videoId: addVideoDto.videoId,
        order,
      },
      include: {
        video: true,
      },
    });
  }

  async removeVideo(id: string, userId: string, videoId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException(
        'You can only remove videos from your own playlists',
      );
    }

    const playlistVideo = await this.prisma.playlistVideo.findFirst({
      where: {
        playlistId: id,
        videoId,
      },
    });

    if (!playlistVideo) {
      throw new NotFoundException('Video not in playlist');
    }

    await this.prisma.playlistVideo.delete({
      where: { id: playlistVideo.id },
    });

    return { message: 'Video removed from playlist' };
  }

  async remove(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.prisma.playlist.delete({
      where: { id },
    });

    return { message: 'Playlist deleted successfully' };
  }
}
