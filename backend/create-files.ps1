import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.`$connect();
  }

  async onModuleDestroy() {
    await this.`$disconnect();
  }
}
"@ | Out-File -FilePath "src\prisma\prisma.service.ts" -Encoding utf8

# Prisma Module  
@"
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
"@ | Out-File -FilePath "src\prisma\prisma.module.ts" -Encoding utf8

Write-Host "✅ Created Prisma files"