import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async recordView(videoId: string, userId: string | null, secondsWatched: number) {
    return this.prisma.analytics.create({
      data: {
        videoId,
        userId,
        secondsWatched,
      },
    });
  }

  async getVideoAnalytics(videoId: string) {
    const analytics = await this.prisma.analytics.findMany({
      where: { videoId },
    });

    const totalViews = analytics.length;
    const totalWatchTime = analytics.reduce((sum, a) => sum + a.secondsWatched, 0);
    const avgWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;

    return {
      videoId,
      totalViews,
      totalWatchTime,
      avgWatchTime,
    };
  }

  async getCreatorAnalytics(creatorId: string) {
    // Get all videos by creator
    const videos = await this.prisma.video.findMany({
      where: { creatorId },
      include: {
        analytics: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + v.analytics.length, 0);
    const totalWatchTime = videos.reduce(
      (sum, v) => sum + v.analytics.reduce((s, a) => s + a.secondsWatched, 0),
      0,
    );
    const totalLikes = videos.reduce((sum, v) => sum + v._count.likes, 0);
    const totalComments = videos.reduce((sum, v) => sum + v._count.comments, 0);

    // Top videos by views
    const topVideos = videos
      .map((v) => ({
        id: v.id,
        title: v.title,
        views: v.analytics.length,
        likes: v._count.likes,
        comments: v._count.comments,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Views by day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnalytics = await this.prisma.analytics.findMany({
      where: {
        video: { creatorId },
        watchedAt: { gte: thirtyDaysAgo },
      },
      select: {
        watchedAt: true,
      },
    });

    const viewsByDay = {};
    recentAnalytics.forEach((a) => {
      const date = a.watchedAt.toISOString().split('T')[0];
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    return {
      totalVideos,
      totalViews,
      totalWatchTime,
      totalLikes,
      totalComments,
      avgViewsPerVideo: totalVideos > 0 ? totalViews / totalVideos : 0,
      topVideos,
      viewsByDay,
    };
  }

  async getSubscriptionRevenue(creatorId: string) {
    // This would integrate with Stripe to get actual revenue data
    // For now, return subscription counts
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
    });

    const monthlySubscriptions = subscriptions.filter((s) => s.planType === 'monthly').length;
    const annualSubscriptions = subscriptions.filter((s) => s.planType === 'annual').length;

    // Estimated revenue (placeholder - actual revenue would come from Stripe)
    const monthlyRevenue = monthlySubscriptions * 9.99;
    const annualRevenue = annualSubscriptions * 99.99;
    const totalRevenue = monthlyRevenue + annualRevenue;

    return {
      monthlySubscriptions,
      annualSubscriptions,
      totalSubscriptions: subscriptions.length,
      estimatedMonthlyRevenue: monthlyRevenue,
      estimatedAnnualRevenue: annualRevenue,
      estimatedTotalRevenue: totalRevenue,
    };
  }
}
