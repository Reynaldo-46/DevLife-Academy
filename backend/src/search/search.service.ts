import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface SearchResults {
  videos: any[];
  playlists: any[];
  creators: any[];
  totalCount: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Global search across videos, playlists, and creators
   */
  async globalSearch(
    query: string,
    limit: number = 20,
  ): Promise<SearchResults> {
    if (!query || query.trim().length === 0) {
      return {
        videos: [],
        playlists: [],
        creators: [],
        totalCount: 0,
      };
    }

    const searchTerm = query.trim().toLowerCase();

    // Search videos
    const videos = await this.prisma.video.findMany({
      where: {
        AND: [
          { publishedAt: { not: null } }, // Only published videos
          {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              { tags: { hasSome: [searchTerm] } },
            ],
          },
        ],
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
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Search playlists
    const playlists = await this.prisma.playlist.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
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
            videos: true,
          },
        },
      },
      take: Math.floor(limit / 2),
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Search creators
    const creators = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { bio: { contains: searchTerm, mode: 'insensitive' } },
        ],
        role: 'ADMIN', // Only show admin (creator) in search
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        _count: {
          select: {
            videos: true,
          },
        },
      },
      take: 5,
    });

    return {
      videos,
      playlists: playlists.map((p) => ({
        ...p,
        videoCount: p._count.videos,
      })),
      creators,
      totalCount: videos.length + playlists.length + creators.length,
    };
  }

  /**
   * Search only videos with filters
   */
  async searchVideos(
    query: string,
    filters?: {
      visibility?: 'PUBLIC' | 'PRIVATE' | 'PAID';
      creatorId?: string;
      tags?: string[];
    },
    skip: number = 0,
    take: number = 20,
  ) {
    const searchTerm = query.trim().toLowerCase();

    const where: any = {
      AND: [
        { publishedAt: { not: null } },
        searchTerm
          ? {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { hasSome: [searchTerm] } },
              ],
            }
          : {},
      ],
    };

    if (filters?.visibility) {
      where.AND.push({ visibility: filters.visibility });
    }

    if (filters?.creatorId) {
      where.AND.push({ creatorId: filters.creatorId });
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.AND.push({ tags: { hasEvery: filters.tags } });
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      videos,
      total,
      hasMore: skip + take < total,
    };
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    // Get unique video titles and tags that match
    const videos = await this.prisma.video.findMany({
      where: {
        AND: [
          { publishedAt: { not: null } },
          {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { tags: { hasSome: [searchTerm] } },
            ],
          },
        ],
      },
      select: {
        title: true,
        tags: true,
      },
      take: limit * 2,
    });

    const suggestions = new Set<string>();

    // Add matching titles
    videos.forEach((video) => {
      if (video.title.toLowerCase().includes(searchTerm)) {
        suggestions.add(video.title);
      }
    });

    // Add matching tags
    videos.forEach((video) => {
      video.tags?.forEach((tag) => {
        if (tag.toLowerCase().includes(searchTerm)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get popular search terms (from tags)
   */
  async getPopularSearchTerms(limit: number = 10): Promise<{ term: string; count: number }[]> {
    // Get all published videos
    const videos = await this.prisma.video.findMany({
      where: {
        publishedAt: { not: null },
        tags: { isEmpty: false },
      },
      select: {
        tags: true,
      },
    });

    // Count tag occurrences
    const tagCounts = new Map<string, number>();
    videos.forEach((video) => {
      video.tags?.forEach((tag) => {
        const lowerTag = tag.toLowerCase();
        tagCounts.set(lowerTag, (tagCounts.get(lowerTag) || 0) + 1);
      });
    });

    // Sort by count and return top terms
    return Array.from(tagCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
