import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

    const user = await this.usersService.create({
      ...registerDto,
      passwordHash: hashedPassword,
      role: 'VIEWER', // All new users are VIEWER by default
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    // TODO: Send verification email
    // For now, we'll return the token in response (in production, send via email)
    return {
      message: 'Registration successful. Please verify your email to access content.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      verificationToken, // In production, don't return this - send via email
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findByVerificationToken(verifyEmailDto.token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark email as verified
    await this.usersService.verifyEmail(user.id);

    // Generate tokens after successful verification
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    
    return {
      message: 'Email verified successfully. You can now access content.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: true,
      },
      ...tokens,
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    await this.usersService.updateVerificationToken(user.id, verificationToken, verificationExpiry);

    // TODO: Send verification email
    return {
      message: 'Verification email sent. Please check your inbox.',
      verificationToken, // In production, don't return this - send via email
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  async refreshTokens(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
