import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [VideosService, PrismaService],
  controllers: [VideosController],
  exports: [VideosService],
})
export class VideosModule {}
