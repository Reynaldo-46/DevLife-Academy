import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, ActivityLogsService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
