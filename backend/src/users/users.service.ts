import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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

  async getSettings(userId: string) {
    const user = await this.findById(userId);
    return {
      notificationPreferences: user.notificationPreferences 
        ? JSON.parse(user.notificationPreferences) 
        : { email: true, push: true, inApp: true },
    };
  }

  async updateSettings(userId: string, data: UpdateSettingsDto) {
    const prefs = {
      email: data.emailNotifications ?? true,
      push: data.pushNotifications ?? true,
      inApp: data.inAppNotifications ?? true,
    };

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: JSON.stringify(prefs),
      },
    });
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });
  }
}
