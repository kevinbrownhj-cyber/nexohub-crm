import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId?: string, userPermissions?: string[]) {
    // Determinar si el usuario solo puede ver sus casos asignados
    const hasOnlyAssignedPermission = userPermissions?.includes('cases.read_assigned') && 
                                      !userPermissions?.includes('cases.read_all');

    // Construir filtro base
    const caseFilter: any = {
      deletedAt: null,
    };

    if (hasOnlyAssignedPermission && userId) {
      // Técnicos solo ven sus casos
      caseFilter.assignedToUserId = userId;
    }

    // Obtener casos según permisos
    const cases = await this.prisma.case.findMany({
      where: caseFilter,
      select: {
        status: true,
        priceFinalCents: true,
      },
    });

    const casesByStatus = cases.reduce((acc: Record<string, number>, c: { status: string }) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Filtro para surcharges pendientes
    const surchargeFilter: any = {
      status: 'PENDING_APPROVAL',
    };

    if (hasOnlyAssignedPermission && userId) {
      // Técnicos solo ven surcharges de sus casos
      surchargeFilter.case = {
        assignedToUserId: userId,
      };
    }

    const pendingSurcharges = await this.prisma.surcharge.count({
      where: surchargeFilter,
    });

    // Filtro para casos listos para facturar
    const readyToInvoiceFilter: any = {
      status: 'READY_TO_INVOICE',
      deletedAt: null,
    };

    if (hasOnlyAssignedPermission && userId) {
      readyToInvoiceFilter.assignedToUserId = userId;
    }

    const readyToInvoice = await this.prisma.case.count({
      where: readyToInvoiceFilter,
    });

    const totalRevenueCents = cases.reduce(
      (sum: number, c: { priceFinalCents: number | null }) => sum + (c.priceFinalCents || 0),
      0,
    );

    return {
      casesByStatus,
      pendingSurcharges,
      readyToInvoice,
      totalRevenue: Math.round(totalRevenueCents / 100),
      totalCases: cases.length,
      activeCases: (casesByStatus['ASSIGNED'] || 0) + (casesByStatus['IN_PROGRESS'] || 0),
      completedCases: casesByStatus['COMPLETED'] || 0,
      monthlyRevenue: [] as any[],
    };
  }
}
