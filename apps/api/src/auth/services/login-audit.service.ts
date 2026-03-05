import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LoginAttemptData {
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  userId?: string;
  reason?: string;
}

@Injectable()
export class LoginAuditService {
  constructor(private prisma: PrismaService) {}

  async logAttempt(data: LoginAttemptData): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email: data.email,
          ip: data.ip,
          userAgent: data.userAgent,
          success: data.success,
          userId: data.userId,
          reason: data.reason,
        },
      });
    } catch (error) {
      // No fallar si el log falla
      console.error('Failed to log login attempt:', error);
    }
  }

  async getRecentAttempts(email: string, limit = 10) {
    return this.prisma.loginAttempt.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFailedAttempts(email: string, since: Date) {
    return this.prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { gte: since },
      },
    });
  }
}
