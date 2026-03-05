import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getReadyCases(filters: any = {}) {
    const { insurerId, periodStart, periodEnd } = filters;

    const where: any = {
      status: 'READY_TO_INVOICE',
      lockedAt: null,
    };

    if (insurerId) where.insurerId = insurerId;

    if (periodStart || periodEnd) {
      where.openedAt = {};
      if (periodStart) where.openedAt.gte = new Date(periodStart);
      if (periodEnd) where.openedAt.lte = new Date(periodEnd);
    }

    const cases = await this.prisma.case.findMany({
      where,
      include: {
        insurer: true,
        customer: true,
        surcharges: {
          where: { status: 'APPROVED' },
        },
      },
      orderBy: { openedAt: 'asc' },
    });

    return cases.map((c) => {
      const approvedSurcharges = c.surcharges.reduce((sum, s) => sum + s.amountCents, 0);
      const baseAmount = c.insurerAmountCents || 0;
      const taxAmount = c.taxAmountCents || 0;
      const total = baseAmount + approvedSurcharges + taxAmount;

      return {
        ...c,
        approvedSurchargesTotal: approvedSurcharges,
        calculatedTotal: total,
      };
    });
  }

  async findAllInvoices(filters: any = {}) {
    const { page = 1, limit = 20, insurerId, status, periodStart, periodEnd } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (insurerId) where.insurerId = insurerId;
    if (status) where.status = status;

    if (periodStart || periodEnd) {
      where.periodStart = {};
      if (periodStart) where.periodStart.gte = new Date(periodStart);
      if (periodEnd) where.periodStart.lte = new Date(periodEnd);
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          insurer: true,
          issuedBy: {
            select: { id: true, name: true, email: true },
          },
          invoiceLines: {
            include: {
              case: {
                select: {
                  id: true,
                  externalId: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        insurer: true,
        issuedBy: {
          select: { id: true, name: true, email: true },
        },
        invoiceLines: {
          include: {
            case: {
              include: {
                customer: true,
                vehicle: true,
                surcharges: {
                  where: { status: 'APPROVED' },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async createInvoice(data: any, actorId: string) {
    const { insurerId, periodStart, periodEnd, caseIds } = data;

    for (const caseId of caseIds) {
      const existing = await this.prisma.invoiceLine.findFirst({
        where: { caseId },
      });

      if (existing) {
        throw new BadRequestException(`Case ${caseId} has already been invoiced`);
      }

      const caseRecord = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: {
          surcharges: {
            where: { status: 'APPROVED' },
          },
        },
      });

      if (!caseRecord) {
        throw new NotFoundException(`Case ${caseId} not found`);
      }

      if (caseRecord.status !== 'READY_TO_INVOICE') {
        throw new BadRequestException(`Case ${caseId} is not ready to invoice`);
      }
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        insurerId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: 'DRAFT',
        totalCents: 0,
      },
    });

    let totalCents = 0;

    for (const caseId of caseIds) {
      const caseRecord = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: {
          surcharges: {
            where: { status: 'APPROVED' },
          },
        },
      });

      if (!caseRecord) {
        throw new NotFoundException(`Case ${caseId} not found`);
      }

      const baseAmount = caseRecord.insurerAmountCents || 0;
      const surchargeTotal = caseRecord.surcharges.reduce((sum, s) => sum + s.amountCents, 0);
      const taxAmount = caseRecord.taxAmountCents || 0;
      const lineTotal = baseAmount + surchargeTotal + taxAmount;

      await this.prisma.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          caseId,
          baseAmountCents: baseAmount,
          surchargeTotalCents: surchargeTotal,
          taxCents: taxAmount,
          totalCents: lineTotal,
        },
      });

      totalCents += lineTotal;
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { totalCents },
    });

    await this.auditService.log({
      actorId,
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'CREATE',
      after: JSON.stringify(updated),
    });

    return this.findInvoiceById(invoice.id);
  }

  async issueInvoice(id: string, actorId: string) {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be issued');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        issuedById: actorId,
      },
    });

    for (const line of invoice.invoiceLines) {
      await this.prisma.case.update({
        where: { id: line.caseId },
        data: {
          status: 'INVOICED',
          lockedAt: new Date(),
        },
      });
    }

    await this.auditService.log({
      actorId,
      entityType: 'invoice',
      entityId: id,
      action: 'INVOICE',
      before: JSON.stringify(invoice),
      after: JSON.stringify(updated),
    });

    return this.findInvoiceById(id);
  }

  async exportToExcel(id: string): Promise<Buffer> {
    const invoice = await this.findInvoiceById(id);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Factura');

    worksheet.columns = [
      { header: 'Expediente', key: 'externalId', width: 15 },
      { header: 'Cliente', key: 'customer', width: 30 },
      { header: 'Vehículo', key: 'vehicle', width: 20 },
      { header: 'Monto Base', key: 'baseAmount', width: 15 },
      { header: 'Recargos', key: 'surcharges', width: 15 },
      { header: 'Impuestos', key: 'tax', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
    ];

    for (const line of invoice.invoiceLines) {
      const customerName = line.case.customer
        ? line.case.customer.name || 'N/A'
        : 'N/A';
      const vehicleInfo = line.case.vehicle
        ? `${line.case.vehicle.make || ''} ${line.case.vehicle.model || ''} ${line.case.vehicle.plate || ''}`.trim()
        : 'N/A';

      worksheet.addRow({
        externalId: line.case.externalId,
        customer: customerName,
        vehicle: vehicleInfo,
        baseAmount: (line.baseAmountCents / 100).toFixed(2),
        surcharges: (line.surchargeTotalCents / 100).toFixed(2),
        tax: (line.taxCents / 100).toFixed(2),
        total: (line.totalCents / 100).toFixed(2),
      });
    }

    worksheet.addRow({});
    worksheet.addRow({
      externalId: '',
      customer: '',
      vehicle: '',
      baseAmount: '',
      surcharges: '',
      tax: 'TOTAL:',
      total: (invoice.totalCents / 100).toFixed(2),
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
