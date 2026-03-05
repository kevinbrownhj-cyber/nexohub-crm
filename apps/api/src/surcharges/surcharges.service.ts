import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SurchargesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: any = {}) {
    const { page = 1, limit = 20, status, caseId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (caseId) where.caseId = caseId;

    const [surcharges, total] = await Promise.all([
      this.prisma.surcharge.findMany({
        where,
        skip,
        take: limit,
        include: {
          case: {
            select: {
              id: true,
              externalId: true,
              insurer: { select: { name: true } },
            },
          },
          requestedBy: {
            select: { id: true, name: true, email: true },
          },
          decidedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.surcharge.count({ where }),
    ]);

    return {
      data: surcharges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const surcharge = await this.prisma.surcharge.findUnique({
      where: { id },
      include: {
        case: true,
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        decidedBy: {
          select: { id: true, name: true, email: true },
        },
        evidenceAttachment: true,
      },
    });

    if (!surcharge) {
      throw new NotFoundException('Surcharge not found');
    }

    return surcharge;
  }

  async create(data: any, actorId: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: data.caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    if (caseRecord.lockedAt) {
      throw new ForbiddenException('Cannot add surcharge to locked/invoiced case');
    }

    const surcharge = await this.prisma.surcharge.create({
      data: {
        caseId: data.caseId,
        concept: data.reason || data.concept || 'Recargo adicional',
        description: data.reason || data.description,
        amountCents: data.surchargeAmount || data.amountCents,
        currency: data.currency || 'USD',
        evidenceAttachmentId: data.evidenceAttachmentId,
        status: 'PENDING_APPROVAL',
        requestedById: actorId,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'surcharge',
      entityId: surcharge.id,
      action: 'CREATE',
      after: JSON.stringify(surcharge),
    });

    return surcharge;
  }

  async approve(id: string, reason: string, actorId: string) {
    const surcharge = await this.findById(id);

    if (surcharge.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Surcharge is not pending approval');
    }

    const updated = await this.prisma.surcharge.update({
      where: { id },
      data: {
        status: 'APPROVED',
        decidedById: actorId,
        decidedAt: new Date(),
        decisionReason: reason,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'surcharge',
      entityId: id,
      action: 'APPROVE',
      before: JSON.stringify(surcharge),
      after: JSON.stringify(updated),
    });

    return this.findById(id);
  }

  async reject(id: string, reason: string, actorId: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    const surcharge = await this.findById(id);

    if (surcharge.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Surcharge is not pending approval');
    }

    const updated = await this.prisma.surcharge.update({
      where: { id },
      data: {
        status: 'REJECTED',
        decidedById: actorId,
        decidedAt: new Date(),
        decisionReason: reason,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'surcharge',
      entityId: id,
      action: 'REJECT',
      before: JSON.stringify(surcharge),
      after: JSON.stringify(updated),
    });

    return this.findById(id);
  }
}
