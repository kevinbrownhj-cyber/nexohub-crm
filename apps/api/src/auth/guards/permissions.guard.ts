import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Leer permisos del JWT (cacheados) en lugar de hacer query a la DB
    const userPermissions: string[] = user.permissions || [];

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      // Log PERMISSION_DENIED
      const requestId = (request as any).requestId;
      const endpoint = `${request.method} ${request.url}`;
      
      await this.auditService.log({
        requestId,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.roles?.[0],
        eventType: 'PERMISSION_DENIED',
        entityType: 'endpoint',
        action: 'ACCESS_DENIED',
        status: 'DENIED',
        message: `Access denied to ${endpoint}`,
        metadata: {
          endpoint,
          method: request.method,
          requiredPermissions,
          userPermissions,
          ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
        },
      });

      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
