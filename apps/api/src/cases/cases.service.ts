import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CaseStatus } from '@nexohub/shared';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private readonly STATE_TRANSITIONS: Record<string, string[]> = {
    IMPORTED: ['ASSIGNED'],
    ASSIGNED: ['IN_PROGRESS', 'IMPORTED'],
    IN_PROGRESS: ['COMPLETED', 'ASSIGNED'],
    COMPLETED: ['PENDING_BILLING_REVIEW'],
    PENDING_BILLING_REVIEW: ['READY_TO_INVOICE', 'COMPLETED'],
    READY_TO_INVOICE: ['INVOICED'],
    INVOICED: ['CLOSED'],
    CLOSED: [],
  };

  async findAll(filters: any = {}, userId?: string, userPermissions?: string[]) {
    const {
      page = 1,
      limit = 20,
      insurerId,
      status,
      assignedToUserId,
      province,
      openedFrom,
      openedTo,
      externalId,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {
      deletedAt: null, // Excluir casos eliminados
    };

    if (insurerId) where.insurerId = insurerId;
    if (status) where.status = status;
    if (province) {
      where.OR = [
        { originProvince: { contains: province, mode: 'insensitive' } },
        { destinationProvince: { contains: province, mode: 'insensitive' } },
      ];
    }
    if (externalId) where.externalId = { contains: externalId, mode: 'insensitive' };

    if (openedFrom || openedTo) {
      where.openedAt = {};
      if (openedFrom) where.openedAt.gte = new Date(openedFrom);
      if (openedTo) where.openedAt.lte = new Date(openedTo);
    }

    // Filtrar por permisos en lugar de roles textuales (más seguro y confiable)
    const hasOnlyAssignedPermission = userPermissions?.includes('cases.read_assigned') && 
                                      !userPermissions?.includes('cases.read_all');
    
    if (hasOnlyAssignedPermission) {
      // Usuarios con permiso 'cases.read_assigned' solo ven sus casos asignados
      where.assignedToUserId = userId;
    } else if (assignedToUserId) {
      // Usuarios con permiso 'cases.read_all' pueden filtrar por técnico específico
      where.assignedToUserId = assignedToUserId;
    }

    const [cases, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip,
        take: limit,
        include: {
          insurer: true,
          customer: true,
          vehicle: true,
          provider: true,
          assignedToUser: {
            select: { id: true, name: true, email: true },
          },
          surcharges: {
            where: { status: { in: ['APPROVED', 'PENDING_APPROVAL'] } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.case.count({ where }),
    ]);

    return {
      data: cases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id },
      include: {
        insurer: true,
        customer: true,
        vehicle: true,
        provider: true,
        assignedToUser: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignments: {
          include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        caseAttachments: {
          include: {
            attachment: true,
          },
        },
        surcharges: {
          include: {
            requestedBy: { select: { id: true, name: true, email: true } },
            decidedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoiceLines: {
          include: {
            invoice: true,
          },
        },
      },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    return caseRecord;
  }

  async create(data: any, actorId?: string) {
    let customerId = data.customerId;
    let vehicleId = data.vehicleId;
    let providerId = data.providerId;

    if (data.customerData && !customerId) {
      const customer = await this.prisma.customer.create({
        data: data.customerData,
      });
      customerId = customer.id;
    }

    if (data.vehicleData && !vehicleId) {
      const vehicle = await this.prisma.vehicle.create({
        data: data.vehicleData,
      });
      vehicleId = vehicle.id;
    }

    if (data.providerName && !providerId) {
      const provider = await this.prisma.provider.create({
        data: { name: data.providerName },
      });
      providerId = provider.id;
    }

    const caseData: any = {
      insurerId: data.insurerId,
      externalId: data.externalId || `CASE-${Date.now()}`,
      serviceType: data.serviceType || 'GENERAL',
      openedAt: data.openedAt ? new Date(data.openedAt) : new Date(),
      status: 'IMPORTED',
      createdById: actorId,
    };

    // Solo agregar campos opcionales si tienen valor
    if (data.externalSeq) caseData.externalSeq = data.externalSeq;
    if (data.serviceStatusRaw) caseData.serviceStatusRaw = data.serviceStatusRaw;
    if (data.productCode) caseData.productCode = data.productCode;
    if (data.policyNumber) caseData.policyNumber = data.policyNumber;
    if (data.certificate) caseData.certificate = data.certificate;
    if (customerId) caseData.customerId = customerId;
    if (vehicleId) caseData.vehicleId = vehicleId;
    if (providerId) caseData.providerId = providerId;
    if (data.assignedToUserId) caseData.assignedToUserId = data.assignedToUserId;
    if (data.originDescription) caseData.originDescription = data.originDescription;
    if (data.originProvince) caseData.originProvince = data.originProvince;
    if (data.originLocality) caseData.originLocality = data.originLocality;
    if (data.destinationDescription) caseData.destinationDescription = data.destinationDescription;
    if (data.destinationProvince) caseData.destinationProvince = data.destinationProvince;
    if (data.destinationLocality) caseData.destinationLocality = data.destinationLocality;
    if (data.kmToOrigin) caseData.kmToOrigin = data.kmToOrigin;
    if (data.kmOriginToDestination) caseData.kmOriginToDestination = data.kmOriginToDestination;
    if (data.driverName) caseData.driverName = data.driverName;
    if (data.priceInitialCents) caseData.priceInitialCents = data.priceInitialCents;
    if (data.priceSubtotalCents) caseData.priceSubtotalCents = data.priceSubtotalCents;
    if (data.taxApplicable !== undefined) caseData.taxApplicable = data.taxApplicable;
    if (data.taxAmountCents) caseData.taxAmountCents = data.taxAmountCents;
    if (data.insurerAmountCents) caseData.insurerAmountCents = data.insurerAmountCents;
    if (data.customerExcessCents) caseData.customerExcessCents = data.customerExcessCents;
    if (data.customerManiobraCents) caseData.customerManiobraCents = data.customerManiobraCents;
    if (data.priceFinalCents) caseData.priceFinalCents = data.priceFinalCents;
    if (data.coverageText) caseData.coverageText = data.coverageText;

    const caseRecord = await this.prisma.case.create({
      data: caseData,
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: caseRecord.id,
      action: 'CREATE',
      after: JSON.stringify(caseRecord),
    });

    return caseRecord;
  }

  async update(id: string, data: any, actorId?: string) {
    const existing = await this.findById(id);

    if (existing.lockedAt) {
      throw new ForbiddenException('Case is locked (invoiced). Cannot edit.');
    }

    // Validar transiciones de estado
    if (data.status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        'IMPORTED': ['IMPORTED', 'ASSIGNED', 'IN_PROGRESS'],
        'ASSIGNED': ['IN_PROGRESS', 'COMPLETED', 'OBJECTED', 'IMPORTED', 'READY_TO_INVOICE'],
        'OBJECTED': ['IMPORTED', 'COMPLETED', 'READY_TO_INVOICE'],
        'IN_PROGRESS': ['COMPLETED'],
        'COMPLETED': ['READY_TO_INVOICE'],
        'READY_TO_INVOICE': ['INVOICED'],
        'INVOICED': ['CLOSED']
      };

      const allowedStatuses = validTransitions[existing.status] || [];
      if (!allowedStatuses.includes(data.status)) {
        throw new BadRequestException(
          `No se puede cambiar el estado de ${existing.status} a ${data.status}. Transiciones permitidas: ${allowedStatuses.join(', ')}`
        );
      }
    }

    const updateData: any = {};
    
    // Validar fecha pasada
    if (data.openedAt !== undefined) {
      const openedDate = new Date(data.openedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (openedDate < today) {
        updateData.isBackdated = true;
      }
    }

    // Campos editables
    if (data.status !== undefined) updateData.status = data.status;
    if (data.externalId !== undefined) updateData.externalId = data.externalId;
    if (data.insurerId !== undefined) updateData.insurerId = data.insurerId;
    if (data.assignedToUserId !== undefined) updateData.assignedToUserId = data.assignedToUserId;
    if (data.openedAt !== undefined) updateData.openedAt = new Date(data.openedAt);
    if (data.priceBaseCents !== undefined) updateData.priceBaseCents = data.priceBaseCents;
    if (data.surchargeAmountCents !== undefined) updateData.surchargeAmountCents = data.surchargeAmountCents;
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.originDescription !== undefined) updateData.originDescription = data.originDescription;
    if (data.destinationDescription !== undefined) updateData.destinationDescription = data.destinationDescription;
    if (data.kmToOrigin !== undefined) updateData.kmToOrigin = data.kmToOrigin;
    if (data.kmOriginToDestination !== undefined) updateData.kmOriginToDestination = data.kmOriginToDestination;
    if (data.priceInitialCents !== undefined) updateData.priceInitialCents = data.priceInitialCents;
    if (data.priceSubtotalCents !== undefined) updateData.priceSubtotalCents = data.priceSubtotalCents;
    if (data.taxAmountCents !== undefined) updateData.taxAmountCents = data.taxAmountCents;
    if (data.insurerAmountCents !== undefined) updateData.insurerAmountCents = data.insurerAmountCents;
    if (data.priceFinalCents !== undefined) updateData.priceFinalCents = data.priceFinalCents;
    if (data.driverName !== undefined) updateData.driverName = data.driverName;
    
    // Campos de objeción del técnico
    if (data.technicianRequestedAmountCents !== undefined) updateData.technicianRequestedAmountCents = data.technicianRequestedAmountCents;
    if (data.technicianRequestedSurchargeCents !== undefined) updateData.technicianRequestedSurchargeCents = data.technicianRequestedSurchargeCents;
    if (data.technicianRejectionReason !== undefined) updateData.technicianRejectionReason = data.technicianRejectionReason;
    if (data.technicianRejectedBy !== undefined) updateData.technicianRejectedBy = data.technicianRejectedBy;
    if (data.technicianRejectedAt !== undefined) updateData.technicianRejectedAt = new Date(data.technicianRejectedAt);
    if (data.technicianRejectionStatus !== undefined) updateData.technicianRejectionStatus = data.technicianRejectionStatus;
    
    // Calcular precio final si se actualizan base o recargo
    if (data.priceBaseCents !== undefined || data.surchargeAmountCents !== undefined) {
      const basePrice = data.priceBaseCents !== undefined ? data.priceBaseCents : (existing.priceBaseCents || 0);
      const surcharge = data.surchargeAmountCents !== undefined ? data.surchargeAmountCents : (existing.surchargeAmountCents || 0);
      updateData.priceFinalCents = basePrice + surcharge;
    }

    const updated = await this.prisma.case.update({
      where: { id },
      data: updateData,
    });

    // Si el técnico rechaza (OBJECTED), crear Surcharge PENDING_APPROVAL
    if (data.status === 'OBJECTED' && existing.status === 'ASSIGNED' && actorId) {
      const amountCents = data.technicianRequestedSurchargeCents || data.technicianRequestedAmountCents || 0;
      const reason = data.technicianRejectionReason || 'Sin justificación';

      // Verificar si ya existe un surcharge pendiente para este caso
      const existingSurcharge = await this.prisma.surcharge.findFirst({
        where: {
          caseId: id,
          status: 'PENDING_APPROVAL',
        },
      });

      if (!existingSurcharge && amountCents > 0) {
        await this.prisma.surcharge.create({
          data: {
            caseId: id,
            concept: 'Recargo solicitado por técnico',
            description: reason,
            amountCents,
            currency: 'USD',
            status: 'PENDING_APPROVAL',
            requestedById: actorId,
            requestedAt: new Date(),
          },
        });
      }
    }

    // Obtener información del actor para el log
    let actor = null;
    let actionLabel = 'UPDATE';
    let details = 'Caso actualizado';

    if (actorId) {
      actor = await this.prisma.user.findUnique({
        where: { id: actorId },
      });
    }

    // Determinar acción específica y detalles
    if (data.status && data.status !== existing.status) {
      if (data.status === 'ASSIGNED' && existing.status === 'IMPORTED') {
        actionLabel = 'ASIGNACIÓN';
        details = `Caso asignado a técnico${data.assignedToUserId ? ` (ID: ${data.assignedToUserId})` : ''}`;
      } else if (data.status === 'READY_TO_INVOICE' && existing.status === 'ASSIGNED') {
        actionLabel = 'APROBACIÓN_TÉCNICO';
        details = `Técnico ${actor?.name || 'desconocido'} aprobó la tarifa y envió a facturación`;
      } else if (data.status === 'OBJECTED' && existing.status === 'ASSIGNED') {
        actionLabel = 'RECLAMO_CREADO';
        const montoRecargo = data.technicianRequestedSurchargeCents ? (data.technicianRequestedSurchargeCents / 100).toFixed(2) : '0.00';
        details = `Técnico ${actor?.name || 'desconocido'} objetó la tarifa. Solicitó $${montoRecargo} extra por: ${data.technicianRejectionReason || 'Sin justificación'}`;
      } else if (data.status === 'READY_TO_INVOICE' && existing.status === 'OBJECTED') {
        actionLabel = 'RECLAMO_APROBADO';
        details = `Admin ${actor?.name || 'desconocido'} aprobó el reclamo y envió a facturación`;
      } else if (data.status === 'IMPORTED' && existing.status === 'OBJECTED') {
        actionLabel = 'RECLAMO_RECHAZADO';
        details = `Admin ${actor?.name || 'desconocido'} rechazó el reclamo y devolvió a importados`;
      } else {
        actionLabel = 'CAMBIO_ESTADO';
        details = `Estado cambiado de ${existing.status} a ${data.status}`;
      }
    } else if (data.assignedToUserId && data.assignedToUserId !== existing.assignedToUserId) {
      actionLabel = 'REASIGNACIÓN';
      details = `Caso reasignado a técnico (ID: ${data.assignedToUserId})`;
    } else if (data.priceBaseCents !== undefined || data.surchargeAmountCents !== undefined) {
      actionLabel = 'ACTUALIZACIÓN_MONTOS';
      const baseOld = (existing.priceBaseCents || 0) / 100;
      const baseNew = (data.priceBaseCents !== undefined ? data.priceBaseCents : existing.priceBaseCents || 0) / 100;
      details = `Montos actualizados. Base: $${baseOld.toFixed(2)} → $${baseNew.toFixed(2)}`;
    }

    await this.auditService.log({
      actorId,
      actorName: actor?.name || undefined,
      actorRole: undefined, // Se puede obtener del rol si es necesario
      entityType: 'case',
      entityId: id,
      action: actionLabel,
      details,
      before: JSON.stringify(existing),
      after: JSON.stringify(updated),
    });

    return this.findById(id);
  }

  async assignToUser(id: string, userId: string, reason: string, actorId?: string) {
    const caseRecord = await this.findById(id);

    await this.prisma.caseAssignment.create({
      data: {
        caseId: id,
        fromUserId: caseRecord.assignedToUserId,
        toUserId: userId,
        reason,
      },
    });

    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        assignedToUserId: userId,
        status: 'ASSIGNED',
        tAssignedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: id,
      action: 'ASSIGN',
      after: JSON.stringify({ userId, reason }),
    });

    return this.findById(id);
  }

  async updateStatus(id: string, newStatus: string, reason: string, actorId?: string) {
    const caseRecord = await this.findById(id);

    if (caseRecord.lockedAt && newStatus !== 'CLOSED') {
      throw new ForbiddenException('Case is locked (invoiced)');
    }

    const allowedTransitions = this.STATE_TRANSITIONS[caseRecord.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${caseRecord.status} to ${newStatus}`,
      );
    }

    if (newStatus === 'READY_TO_INVOICE') {
      const pendingSurcharges = await this.prisma.surcharge.count({
        where: {
          caseId: id,
          status: 'PENDING_APPROVAL',
        },
      });

      if (pendingSurcharges > 0) {
        throw new BadRequestException(
          'Cannot mark as ready to invoice: pending surcharge approvals',
        );
      }
    }

    const updated = await this.prisma.case.update({
      where: { id },
      data: { status: newStatus as any },
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: id,
      action: 'STATUS_CHANGE',
      before: JSON.stringify({ status: caseRecord.status }),
      after: JSON.stringify({ status: newStatus, reason }),
    });

    return this.findById(id);
  }

  async addNote(id: string, note: string, actorId: string) {
    await this.findById(id);

    const noteRecord = await this.prisma.caseNote.create({
      data: {
        caseId: id,
        authorId: actorId,
        note,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: id,
      action: 'UPDATE',
      after: JSON.stringify({ action: 'note_added', noteId: noteRecord.id }),
    });

    return noteRecord;
  }

  async exportToExcel(filters: any = {}, userId?: string, userPermissions?: string[]) {
    const ExcelJS = require('exceljs');
    
    // Obtener todos los casos sin paginación
    const { data: cases } = await this.findAll({ ...filters, limit: 10000 }, userId, userPermissions);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Casos');

    // Definir columnas
    worksheet.columns = [
      { header: 'ID Externo', key: 'externalId', width: 15 },
      { header: 'Aseguradora', key: 'insurer', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
      { header: 'Tipo de Servicio', key: 'serviceType', width: 20 },
      { header: 'Cliente', key: 'customer', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Vehículo', key: 'vehicle', width: 20 },
      { header: 'Técnico Asignado', key: 'technician', width: 25 },
      { header: 'Origen', key: 'origin', width: 30 },
      { header: 'Destino', key: 'destination', width: 30 },
      { header: 'Fecha Apertura', key: 'openedAt', width: 15 },
      { header: 'Monto Base', key: 'baseAmount', width: 12 },
      { header: 'Recargos', key: 'surcharges', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
    ];

    // Estilo del header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a4b91' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Agregar datos
    cases.forEach((caseItem: any) => {
      const surchargesTotal = caseItem.surcharges
        ?.filter((s: any) => s.status === 'APPROVED')
        .reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0;

      worksheet.addRow({
        externalId: caseItem.externalId || '',
        insurer: caseItem.insurer?.name || '',
        status: this.translateStatus(caseItem.status),
        serviceType: caseItem.serviceType || '',
        customer: caseItem.customer?.name || '',
        phone: caseItem.customer?.phone || '',
        vehicle: caseItem.vehicle ? `${caseItem.vehicle.brand} ${caseItem.vehicle.model} - ${caseItem.vehicle.plate}` : '',
        technician: caseItem.assignedToUser?.name || 'Sin asignar',
        origin: `${caseItem.originProvince || ''} - ${caseItem.originLocality || ''}`,
        destination: `${caseItem.destinationProvince || ''} - ${caseItem.destinationLocality || ''}`,
        openedAt: caseItem.openedAt ? new Date(caseItem.openedAt).toLocaleDateString() : '',
        baseAmount: (caseItem.priceFinalCents || 0) / 100,
        surcharges: surchargesTotal / 100,
        total: ((caseItem.priceFinalCents || 0) + surchargesTotal) / 100,
      });
    });

    // Formato de moneda para columnas de dinero
    ['L', 'M', 'N'].forEach(col => {
      worksheet.getColumn(col).numFmt = '$#,##0.00';
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'IMPORTED': 'Importado',
      'ASSIGNED': 'Asignado',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'PENDING_BILLING_REVIEW': 'Pendiente Revisión',
      'READY_TO_INVOICE': 'Listo para Facturar',
      'INVOICED': 'Facturado',
      'CLOSED': 'Cerrado',
    };
    return translations[status] || status;
  }

  async softDelete(id: string, actorId?: string) {
    const caseItem = await this.prisma.case.findUnique({
      where: { id },
    });

    if (!caseItem) {
      throw new NotFoundException('Case not found');
    }

    if (caseItem.deletedAt) {
      throw new BadRequestException('Case is already deleted');
    }

    await this.prisma.case.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actorId,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: id,
      action: 'SOFT_DELETE',
      after: JSON.stringify({ deletedAt: new Date() }),
    });
  }

  async restore(id: string, actorId?: string) {
    const caseItem = await this.prisma.case.findUnique({
      where: { id },
    });

    if (!caseItem) {
      throw new NotFoundException('Case not found');
    }

    if (!caseItem.deletedAt) {
      throw new BadRequestException('Case is not deleted');
    }

    const restored = await this.prisma.case.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
      },
      include: {
        insurer: true,
        customer: true,
        assignedToUser: true,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: id,
      action: 'RESTORE',
      after: JSON.stringify({ restored: true }),
    });

    return restored;
  }

  async approveSurcharge(caseId: string, actorId: string) {
    const caseItem = await this.findById(caseId);

    // Buscar surcharge pendiente
    const pendingSurcharge = await this.prisma.surcharge.findFirst({
      where: {
        caseId,
        status: 'PENDING_APPROVAL',
      },
    });

    if (!pendingSurcharge) {
      throw new NotFoundException('No hay recargo solicitado para aprobar');
    }

    // Aprobar surcharge y aplicar al caso
    await this.prisma.$transaction(async (tx) => {
      // Actualizar surcharge a APPROVED
      await tx.surcharge.update({
        where: { id: pendingSurcharge.id },
        data: {
          status: 'APPROVED',
          decidedById: actorId,
          decidedAt: new Date(),
        },
      });

      // Aplicar recargo al caso
      const newSurchargeAmount = (caseItem.surchargeAmountCents || 0) + pendingSurcharge.amountCents;
      const newFinalPrice = (caseItem.priceBaseCents || 0) + newSurchargeAmount;

      await tx.case.update({
        where: { id: caseId },
        data: {
          surchargeAmountCents: newSurchargeAmount,
          priceFinalCents: newFinalPrice,
          status: 'READY_TO_INVOICE',
        },
      });
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: caseId,
      action: 'SURCHARGE_APPROVED',
      details: `Recargo de $${(pendingSurcharge.amountCents / 100).toFixed(2)} aprobado y aplicado al caso`,
      after: JSON.stringify({ surchargeId: pendingSurcharge.id, amountCents: pendingSurcharge.amountCents }),
    });

    return { message: 'Recargo aprobado y aplicado exitosamente', surcharge: pendingSurcharge };
  }

  async rejectSurcharge(caseId: string, reason: string, actorId: string) {
    const caseItem = await this.findById(caseId);

    // Buscar surcharge pendiente
    const pendingSurcharge = await this.prisma.surcharge.findFirst({
      where: {
        caseId,
        status: 'PENDING_APPROVAL',
      },
    });

    if (!pendingSurcharge) {
      throw new NotFoundException('No hay recargo solicitado para rechazar');
    }

    // Rechazar surcharge y devolver caso a IMPORTED
    await this.prisma.$transaction(async (tx) => {
      // Actualizar surcharge a REJECTED
      await tx.surcharge.update({
        where: { id: pendingSurcharge.id },
        data: {
          status: 'REJECTED',
          decidedById: actorId,
          decidedAt: new Date(),
          decisionReason: reason || 'Recargo rechazado por administrador',
        },
      });

      // Devolver caso a IMPORTED
      await tx.case.update({
        where: { id: caseId },
        data: {
          status: 'IMPORTED',
          technicianRejectionStatus: 'REJECTED',
        },
      });
    });

    await this.auditService.log({
      actorId,
      entityType: 'case',
      entityId: caseId,
      action: 'SURCHARGE_REJECTED',
      details: `Recargo de $${(pendingSurcharge.amountCents / 100).toFixed(2)} rechazado. Razón: ${reason || 'No especificada'}`,
      after: JSON.stringify({ surchargeId: pendingSurcharge.id, reason }),
    });

    return { message: 'Recargo rechazado. Caso devuelto a importados', surcharge: pendingSurcharge };
  }

  async findDeleted() {
    return this.prisma.case.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        insurer: true,
        customer: true,
        assignedToUser: true,
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }
}
