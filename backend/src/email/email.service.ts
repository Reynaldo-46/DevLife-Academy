import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';

    if (this.isDevelopment) {
      // In development, log emails to console instead of sending
      this.logger.log('Email service running in DEVELOPMENT mode - emails will be logged to console');
    } else {
      // Production email configuration (SMTP)
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: this.configService.get<boolean>('SMTP_SECURE') || false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  /**
   * Send email verification token
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const subject = 'Verify Your Email - DevLife Academy';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">DevLife Academy</h1>
        </div>
        <div style="background-color: white; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome, ${name}!</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Thanks for signing up! Please verify your email address to access all the amazing content on DevLife Academy.
          </p>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 30px 0;">
            Your verification token:
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #3b82f6; letter-spacing: 2px; margin: 20px 0;">
            ${token}
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            This token will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>© 2025 DevLife Academy. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send new video notification
   */
  async sendNewVideoNotification(
    email: string,
    userName: string,
    videoTitle: string,
    videoId: string,
  ): Promise<void> {
    const subject = `New Video: ${videoTitle} - DevLife Academy`;
    const videoUrl = `${this.configService.get('FRONTEND_URL')}/videos/${videoId}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">DevLife Academy</h1>
        </div>
        <div style="background-color: white; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">🎥 New Video Published!</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Hi ${userName},
          </p>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            A new video has been published on DevLife Academy:
          </p>
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">${videoTitle}</h3>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Watch Now
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            Keep learning and growing with DevLife Academy!
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>© 2025 DevLife Academy. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send welcome email after signup
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to DevLife Academy!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">DevLife Academy</h1>
        </div>
        <div style="background-color: white; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome aboard, ${name}! 🎉</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Your email has been verified successfully! You now have full access to all our content.
          </p>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 30px 0;">
            Explore our library of coding tutorials, dev vlogs, and developer life lessons to level up your skills.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/videos" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Start Learning
            </a>
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What you'll learn:</h3>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">React, TypeScript, and modern web technologies</li>
              <li style="margin-bottom: 8px;">Full-stack development best practices</li>
              <li style="margin-bottom: 8px;">Real-world coding tutorials from the trenches</li>
              <li style="margin-bottom: 8px;">Developer lifestyle and career insights</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Questions? Feel free to reach out anytime. Happy learning!
          </p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>© 2025 DevLife Academy. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Base send email method
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (this.isDevelopment) {
      // In development, log email to console
      this.logger.log('======= EMAIL WOULD BE SENT =======');
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`HTML Body:\n${html}`);
      this.logger.log('===================================');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"DevLife Academy" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
