import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // VALIDACIÓN EN TIEMPO REAL - CRÍTICO PARA SEGURIDAD
    // Verificar el estado actual del usuario en cada petición
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Bloquear acceso si el usuario no existe, está inactivo o eliminado
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('User account has been deleted');
    }

    // Extraer rol y permisos de la relación many-to-many
    const userRole = user.userRoles[0]?.role;
    const permissions = userRole?.rolePermissions.map((rp: any) => rp.permission.key) || [];

    // Retornar usuario con permisos actualizados en tiempo real
    return {
      id: user.id,
      email: user.email,
      roles: userRole ? [userRole.name] : [],
      permissions,
    };
  }
}
