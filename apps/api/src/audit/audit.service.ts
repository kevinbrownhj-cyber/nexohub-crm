import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sanitize, sanitizeMetadata } from './audit.sanitizer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.auditEnabled = this.configService.get<string>('AUDIT_ENABLED', 'true') === 'true';
    if (!this.auditEnabled) {
      this.logger.warn('⚠️  Audit logging is DISABLED');
    }
  }

  /**
   * Fire-and-forget audit log
   * NUNCA lanza errores hacia arriba - falla silenciosamente
   * Backward compatible: acepta beforeJson/afterJson (deprecated) y before/after (nuevo)
   */
  async log(data: {
    requestId?: string;
    actorId?: string;
    actorEmail?: string;
    actorName?: string;
    actorRole?: string;
    eventType?: string; // Opcional para backward compatibility
    entityType: string;
    entityId?: string;
    action: string;
    status?: 'SUCCESS' | 'FAILED' | 'DENIED';
    message?: string;
    details?: string;
    before?: any;
    after?: any;
    beforeJson?: string; // Deprecated pero soportado
    afterJson?: string; // Deprecated pero soportado
    metadata?: any;
  }): Promise<void> {
    // Feature flag check
    if (!this.auditEnabled) {
      return;
    }

    try {
      // Backward compatibility: si no hay eventType, usar action
      const eventType = data.eventType || data.action;

      // Backward compatibility: soportar beforeJson/afterJson
      let beforeData = data.before;
      let afterData = data.after;

      if (!beforeData && data.beforeJson) {
        try {
          beforeData = JSON.parse(data.beforeJson);
        } catch {
          beforeData = data.beforeJson;
        }
      }

      if (!afterData && data.afterJson) {
        try {
          afterData = JSON.parse(data.afterJson);
        } catch {
          afterData = data.afterJson;
        }
      }

      // Sanitizar datos sensibles
      const sanitizedBefore = beforeData ? sanitize(beforeData) : null;
      const sanitizedAfter = afterData ? sanitize(afterData) : null;
      const sanitizedMetadata = data.metadata ? sanitizeMetadata(data.metadata) : null;

      // Crear log sin bloquear flujo principal
      await this.prisma.auditLog.create({
        data: {
          requestId: data.requestId || null,
          actorId: data.actorId || null,
          actorEmail: data.actorEmail || null,
          actorName: data.actorName || null,
          actorRole: data.actorRole || null,
          eventType,
          entityType: data.entityType,
          entityId: data.entityId || null,
          action: data.action,
          status: data.status || 'SUCCESS',
          message: data.message || null,
          details: data.details || null,
          beforeJson: sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
          afterJson: sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
          metadataJson: sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
        },
      });
    } catch (error: any) {
      // NUNCA lanzar error hacia arriba
      this.logger.error('Failed to create audit log', {
        requestId: data.requestId,
        eventType: data.eventType,
        error: error?.message || 'Unknown error',
      });
    }
  }

  async findAll(filters: any = {}) {
    const { 
      page = 1, 
      limit = 50, 
      entityType, 
      entityId, 
      actorId,
      eventType,
      status,
      requestId,
      startDate,
      endDate,
      search,
      action
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    if (requestId) where.requestId = requestId;

    // Filtro por rango de fechas
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // Búsqueda por expediente o usuario
    if (search) {
      where.OR = [
        { actorName: { contains: search, mode: 'insensitive' } },
        { actorRole: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
      
      // Si el search parece un ID de caso, buscar también en entityId
      if (search.length > 3) {
        where.OR.push({ entityId: { contains: search, mode: 'insensitive' } });
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
