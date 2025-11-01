import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TranscodingService } from './transcoding.service';
import { TranscodingProcessor } from './transcoding.processor';
import { TranscodingController } from './transcoding.controller';
import { PrismaService } from '../common/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transcoding',
    }),
    NotificationsModule,
  ],
  controllers: [TranscodingController],
  providers: [TranscodingService, TranscodingProcessor, PrismaService],
  exports: [TranscodingService, BullModule],
})
export class TranscodingModule {}
