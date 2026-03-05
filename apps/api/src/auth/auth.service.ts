import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string, requestId?: string, metadata?: any): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    console.log('🔍 validateUser - user from DB:', JSON.stringify(user, null, 2));
    
    // Log LOGIN_ATTEMPT
    await this.auditService.log({
      requestId,
      actorEmail: email,
      eventType: 'AUTH_LOGIN_ATTEMPT',
      entityType: 'user',
      entityId: user?.id,
      action: 'LOGIN',
      status: 'SUCCESS',
      message: 'Login attempt initiated',
      metadata,
    });
    
    if (!user) {
      console.log('❌ validateUser - user not found');
      await this.auditService.log({
        requestId,
        actorEmail: email,
        eventType: 'AUTH_LOGIN_FAILED',
        entityType: 'user',
        action: 'LOGIN',
        status: 'FAILED',
        message: 'User not found',
        metadata,
      });
      return null;
    }
    
    if (!user.isActive) {
      console.log('❌ validateUser - user inactive');
      await this.auditService.log({
        requestId,
        actorId: user.id,
        actorEmail: email,
        eventType: 'AUTH_LOGIN_FAILED',
        entityType: 'user',
        entityId: user.id,
        action: 'LOGIN',
        status: 'FAILED',
        message: 'User account is inactive',
        metadata,
      });
      return null;
    }
    
    if (user.deletedAt) {
      console.log('❌ validateUser - user deleted');
      await this.auditService.log({
        requestId,
        actorId: user.id,
        actorEmail: email,
        eventType: 'AUTH_LOGIN_FAILED',
        entityType: 'user',
        entityId: user.id,
        action: 'LOGIN',
        status: 'FAILED',
        message: 'User account has been deleted',
        metadata,
      });
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔐 validateUser - password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ validateUser - invalid password');
      await this.auditService.log({
        requestId,
        actorId: user.id,
        actorEmail: email,
        eventType: 'AUTH_LOGIN_FAILED',
        entityType: 'user',
        entityId: user.id,
        action: 'LOGIN',
        status: 'FAILED',
        message: 'Invalid password',
        metadata,
      });
      return null;
    }

    const { passwordHash, ...result } = user;
    console.log('✅ validateUser - returning user:', JSON.stringify(result, null, 2));
    return result;
  }

  async login(user: any, requestId?: string, metadata?: any) {
    console.log('🚀 login - received user object:', JSON.stringify(user, null, 2));
    console.log('🚀 login - user.id:', user.id);
    const userWithRoles = await this.usersService.findById(user.id);

    // Extraer permisos para incluir en el JWT
    const permissions = userWithRoles.role?.permissions.map(p => p.key) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      roles: [userWithRoles.role?.key].filter(Boolean),
      permissions, // Cachear permisos en JWT
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Log LOGIN_SUCCESS
    await this.auditService.log({
      requestId,
      actorId: user.id,
      actorEmail: user.email,
      actorName: userWithRoles.name,
      actorRole: userWithRoles.role?.key,
      eventType: 'AUTH_LOGIN_SUCCESS',
      entityType: 'user',
      entityId: user.id,
      action: 'LOGIN',
      status: 'SUCCESS',
      message: `User ${user.email} logged in successfully`,
      metadata,
    });

    return {
      accessToken,
      refreshToken,
      user: userWithRoles, // Devolver estructura completa con role.permissions
    };
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: true,
      },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Detectar reuso de token - revocar toda la familia
    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Revocar token usado
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Obtener usuario completo con estructura correcta
    const userWithRoles = await this.usersService.findById(tokenRecord.user.id);

    // Extraer permisos para el nuevo token
    const permissions = userWithRoles.role?.permissions.map(p => p.key) || [];

    const payload = {
      sub: tokenRecord.user.id,
      email: tokenRecord.user.email,
      roles: [userWithRoles.role?.key].filter(Boolean),
      permissions, // Cachear permisos en JWT
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(
      tokenRecord.user.id
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: userWithRoles, // Devolver estructura completa con role.permissions
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}
