import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway, PrismaService],
  exports: [NotificationsService, NotificationGateway],
})
export class NotificationsModule {}
