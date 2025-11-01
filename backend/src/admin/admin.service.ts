import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as any } },
            { name: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
          _count: {
            select: {
              videos: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async suspendUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: true },
    });
  }

  async activateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: false },
    });
  }

  async getInsights() {
    const [
      totalUsers,
      totalVideos,
      totalViews,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.video.count(),
      this.prisma.analytics.aggregate({
        _sum: { secondsWatched: true },
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const topVideos = await this.prisma.video.findMany({
      take: 10,
      orderBy: {
        analytics: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            analytics: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      totalUsers,
      totalVideos,
      totalViews: totalViews._sum.secondsWatched || 0,
      estimatedRevenue: totalRevenue * 9.99, // Assuming $9.99 per subscription
      topVideos,
    };
  }
}
