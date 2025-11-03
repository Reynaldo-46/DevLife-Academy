import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoVisibility } from '@prisma/client';

@Injectable()
export class VideosService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createVideoDto: CreateVideoDto) {
    return this.prisma.video.create({
      data: {
        ...createVideoDto,
        creatorId: userId,
        tags: createVideoDto.tags || [],
        visibility: (createVideoDto.visibility as VideoVisibility) || 'PUBLIC',
        publishedAt: new Date(), // Auto-publish videos on creation
        transcodingStatus: 'COMPLETED', // Set as completed so videos are playable immediately
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });
  }

  async findAll(params?: { visibility?: string; creatorId?: string; skip?: number; take?: number }) {
    const where: any = {};
    
    if (params?.visibility) {
      where.visibility = params.visibility;
    }
    
    if (params?.creatorId) {
      where.creatorId = params.creatorId;
    }

    // Only show published videos
    where.publishedAt = { not: null };

    return this.prisma.video.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip: params?.skip || 0,
      take: params?.take || 20,
    });
  }

  async findOne(id: string, userId?: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check if user has access to this video
    if (video.visibility === 'PRIVATE' && video.creatorId !== userId) {
      throw new ForbiddenException('You do not have access to this video');
    }

    if (video.visibility === 'PAID' && video.creatorId !== userId) {
      // TODO: Check if user has purchased this video or has active subscription
      // For now, we'll just return the video metadata
    }

    return video;
  }

  async update(id: string, userId: string, updateVideoDto: UpdateVideoDto) {
    const video = await this.prisma.video.findUnique({ where: { id } });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own videos');
    }

    const updateData: any = { ...updateVideoDto };
    if (updateVideoDto.visibility) {
      updateData.visibility = updateVideoDto.visibility as VideoVisibility;
    }

    return this.prisma.video.update({
      where: { id },
      data: updateData,
    });
  }

  async publish(id: string, userId: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only publish your own videos');
    }

    return this.prisma.video.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }

  async delete(id: string, userId: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own videos');
    }

    await this.prisma.video.delete({ where: { id } });
    return { message: 'Video deleted successfully' };
  }

  async likeVideo(videoId: string, userId: string) {
    const existingLike = await this.prisma.videoLike.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.videoLike.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    }

    await this.prisma.videoLike.create({
      data: {
        videoId,
        userId,
      },
    });

    return { liked: true };
  }

  async saveVideo(videoId: string, userId: string) {
    const existingSave = await this.prisma.savedVideo.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
    });

    if (existingSave) {
      await this.prisma.savedVideo.delete({
        where: { id: existingSave.id },
      });
      return { saved: false };
    }

    await this.prisma.savedVideo.create({
      data: {
        videoId,
        userId,
      },
    });

    return { saved: true };
  }

  async getComments(videoId: string) {
    return this.prisma.comment.findMany({
      where: {
        videoId,
        parentId: null, // Only root comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createComment(videoId: string, userId: string, content: string, parentId?: string) {
    return this.prisma.comment.create({
      data: {
        videoId,
        userId,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }
}
