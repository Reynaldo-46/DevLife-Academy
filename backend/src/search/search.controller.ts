import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@ApiTags('search')
@Controller('api/search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Global search across videos, playlists, and creators' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'limit', description: 'Result limit', required: false })
  async globalSearch(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.globalSearch(
      query,
      limit ? parseInt(limit) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get('videos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search videos with filters' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'visibility', required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  @ApiQuery({ name: 'tags', required: false })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async searchVideos(
    @Query('q') query: string,
    @Query('visibility') visibility?: string,
    @Query('creatorId') creatorId?: string,
    @Query('tags') tags?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.searchService.searchVideos(
      query,
      {
        visibility: visibility as any,
        creatorId,
        tags: tags ? tags.split(',') : undefined,
      },
      skip ? parseInt(skip) : undefined,
      take ? parseInt(take) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get('suggestions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiQuery({ name: 'q', description: 'Partial search query', required: true })
  @ApiQuery({ name: 'limit', description: 'Number of suggestions', required: false })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.getSearchSuggestions(
      query,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular search terms' })
  @ApiQuery({ name: 'limit', description: 'Number of terms', required: false })
  async getPopularSearchTerms(@Query('limit') limit?: string) {
    return this.searchService.getPopularSearchTerms(
      limit ? parseInt(limit) : undefined,
    );
  }
}
