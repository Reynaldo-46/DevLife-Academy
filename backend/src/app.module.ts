import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { TranscodingModule } from './transcoding/transcoding.module';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    VideosModule,
    PlaylistsModule,
    PaymentsModule,
    AnalyticsModule,
    UploadModule,
    SearchModule,
    NotificationsModule,
    AdminModule,
    TranscodingModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
