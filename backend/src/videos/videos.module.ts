import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { PrismaService } from '../common/prisma.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    BullModule.registerQueue({
      name: 'transcoding',
    }),
  ],
  providers: [VideosService, PrismaService],
  controllers: [VideosController],
  exports: [VideosService],
})
export class VideosModule {}
