import { Module } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';
import { PrismaService } from '../common/prisma.service';
import { UsersModule } from '../users/users.module'; 
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@Module({
  imports: [UsersModule],
  providers: [PlaylistsService, PrismaService],
  controllers: [PlaylistsController],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
