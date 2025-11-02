import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoVisibility } from '@prisma/client';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async getUploadUrl(userId: string, filename: string, contentType: string) {
    const key = this.storageService.generateVideoKey(userId, filename);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      key,
      contentType,
      3600, // 1 hour expiration
    );

    return {
      uploadUrl,
      key,
      publicUrl: this.storageService.getPublicUrl(key),
    };
  }

  async getThumbnailUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
  ) {
    const key = this.storageService.generateThumbnailKey(userId, filename);
    const uploadUrl = await this.storageService.getPresignedUploadUrl(
      key,
      contentType,
      3600,
    );

    return {
      uploadUrl,
      key,
      publicUrl: this.storageService.getPublicUrl(key),
    };
  }

  async create(userId: string, createVideoDto: CreateVideoDto) {
    const videoKey = this.storageService.generateVideoKey(
      userId,
      createVideoDto.filename,
    );
    const thumbnailKey = createVideoDto.thumbnailFilename
      ? this.storageService.generateThumbnailKey(
          userId,
          createVideoDto.thumbnailFilename,
        )
      : null;

    const video = await this.prisma.video.create({
      data: {
        creatorId: userId,
        title: createVideoDto.title,
        description: createVideoDto.description,
        tags: createVideoDto.tags || [],
        visibility: createVideoDto.visibility || VideoVisibility.PUBLIC,
        price: createVideoDto.price,
        s3Key: videoKey,
        hlsUrl: this.storageService.getPublicUrl(videoKey),
        thumbnailUrl: thumbnailKey
          ? this.storageService.getPublicUrl(thumbnailKey)
          : 'https://via.placeholder.com/640x360',
        duration: createVideoDto.duration,
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

    return video;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          visibility: VideoVisibility.PUBLIC,
          publishedAt: {
            not: null,
          },
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
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.video.count({
        where: {
          visibility: VideoVisibility.PUBLIC,
          publishedAt: {
            not: null,
          },
        },
      }),
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
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
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async findByCreator(creatorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { creatorId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.video.count({
        where: { creatorId },
      }),
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, userId: string, updateVideoDto: UpdateVideoDto) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own videos');
    }

    return await this.prisma.video.update({
      where: { id },
      data: {
        title: updateVideoDto.title,
        description: updateVideoDto.description,
        tags: updateVideoDto.tags,
        visibility: updateVideoDto.visibility,
        price: updateVideoDto.price,
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

  async publish(id: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only publish your own videos');
    }

    return await this.prisma.video.update({
      where: { id },
      data: {
        publishedAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own videos');
    }

    await this.prisma.video.delete({
      where: { id },
    });

    return { message: 'Video deleted successfully' };
  }
}
