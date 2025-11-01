import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { 
    email: string; 
    name: string; 
    passwordHash: string; 
    role?: string;
    emailVerificationToken?: string;
    emailVerificationExpiry?: Date;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role as any || 'VIEWER',
        emailVerificationToken: data.emailVerificationToken,
        emailVerificationExpiry: data.emailVerificationExpiry,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });
  }

  async verifyEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });
  }

  async updateVerificationToken(userId: string, token: string, expiry: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
      },
    });
  }

  async updateProfile(userId: string, data: { name?: string; bio?: string; profileImage?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
