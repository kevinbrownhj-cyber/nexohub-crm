import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: any = {}) {
    const { page = 1, limit = 50, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        cases: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(dto: CreateCustomerDto, actorId?: string) {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'customer',
      entityId: customer.id,
      action: 'CREATE',
      after: JSON.stringify(customer),
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, actorId?: string) {
    const customer = await this.findById(id);

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'customer',
      entityId: id,
      action: 'UPDATE',
      before: JSON.stringify(customer),
      after: JSON.stringify(updated),
    });

    return updated;
  }

  async softDelete(id: string, actorId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.deletedAt) {
      throw new ConflictException('Customer is already deleted');
    }

    const scheduledDeleteAt = new Date();
    scheduledDeleteAt.setDate(scheduledDeleteAt.getDate() + 30);

    await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: actorId,
        scheduledDeleteAt,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'customer',
      entityId: id,
      action: 'SOFT_DELETE',
      after: JSON.stringify({ scheduledDeleteAt }),
    });
  }

  async restore(id: string, actorId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.deletedAt) {
      throw new ConflictException('Customer is not deleted');
    }

    const restored = await this.prisma.customer.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        scheduledDeleteAt: null,
      },
    });

    await this.auditService.log({
      actorId,
      entityType: 'customer',
      entityId: id,
      action: 'RESTORE',
      after: JSON.stringify({ restored: true }),
    });

    return restored;
  }

  async findDeleted() {
    return this.prisma.customer.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }
}
