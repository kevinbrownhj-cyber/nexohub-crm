import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: any = {}) {
    const { page = 1, limit = 20, isActive, roleKey, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null, // Excluir usuarios eliminados
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roleKey) {
      where.userRoles = {
        some: {
          role: {
            key: roleKey,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return users.map((user: any) => {
      const primaryRole = user.userRoles[0]?.role;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        role: primaryRole ? {
          id: primaryRole.id,
          key: primaryRole.key,
          name: primaryRole.name,
        } : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transformar al formato esperado por el frontend
    const primaryRole = user.userRoles[0]?.role;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      role: primaryRole ? {
        id: primaryRole.id,
        name: primaryRole.name,
        key: primaryRole.key,
        permissions: primaryRole.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          key: rp.permission.key,
        })),
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(dto: CreateUserDto, actorId?: string): Promise<UserResponseDto> {
    try {
      // Verificar si el email ya existe
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException({
          code: 'USER_EMAIL_EXISTS',
          message: 'El correo electrónico ya está registrado',
          field: 'email'
        });
      }

      // Validar contraseña
      if (dto.password.length < 6) {
        throw new BadRequestException({
          code: 'PASSWORD_TOO_SHORT',
          message: 'La contraseña debe tener al menos 6 caracteres',
          field: 'password'
        });
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Usar transacción para asegurar consistencia
      const result = await this.prisma.$transaction(async (tx: any) => {
        // 1) Crear usuario
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            name: dto.name,
            isActive: true,
          },
        });

        // 2) Asignar rol si se proporciona
        if (dto.roleId) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: dto.roleId,
            },
          });
        }

        // 3) Log de auditoría usando tx
        await tx.auditLog.create({
          data: {
            eventType: 'USER_CREATED',
            entityType: 'user',
            entityId: user.id,
            action: 'CREATE',
            actorId: actorId || 'system',
            details: `Usuario creado: ${dto.email} - ${dto.name}`,
            afterJson: JSON.stringify({ email: dto.email, name: dto.name, roleId: dto.roleId }),
          },
        });

        return user;
      });

      // Retornar usuario completo con rol
      return this.findById(result.id);

    } catch (error: any) {
      // Si ya es una excepción nuestra, relanzarla
      if (error.code === 'USER_EMAIL_EXISTS' || error.code === 'PASSWORD_TOO_SHORT') {
        throw error;
      }

      // Manejar errores de Prisma
      if (error.code === 'P2002') {
        throw new ConflictException({
          code: 'USER_EMAIL_EXISTS',
          message: 'El correo electrónico ya está registrado',
          field: 'email'
        });
      }

      // Error genérico
      throw new BadRequestException({
        code: 'USER_CREATION_FAILED',
        message: 'Error al crear el usuario. Por favor, intente nuevamente',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string): Promise<UserResponseDto> {
    const user = await this.findById(id);

    const updateData: Partial<{ email: string; name: string; isActive: boolean }> = {};

    if (dto.email) updateData.email = dto.email;
    if (dto.name) updateData.name = dto.name;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.prisma.userRole.deleteMany({
        where: { userId: id },
      });

      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId: string) => ({
          userId: id,
          roleId,
        })),
      });
    }

    await this.auditService.log({
      actorId: actorId || 'system',
      actorName: undefined,
      actorRole: undefined,
      entityType: 'user',
      entityId: id,
      action: 'UPDATE',
      details: `Usuario actualizado: ${dto.email || user.email}`,
      beforeJson: JSON.stringify(user),
      after: JSON.stringify(updated),
    });

    return this.findById(id);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.auditService.log({
      actorId: actorId || 'system',
      actorName: undefined,
      actorRole: undefined,
      entityType: 'user',
      entityId: id,
      action: 'UPDATE',
      details: 'Contraseña cambiada por el usuario',
      after: JSON.stringify({ action: 'password_changed' }),
    });
  }

  async resetPassword(id: string, newPassword: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.auditService.log({
      actorId: actorId || 'system',
      actorName: undefined,
      actorRole: undefined,
      entityType: 'user',
      entityId: id,
      action: 'UPDATE',
      details: 'Contraseña reseteada por administrador',
      after: JSON.stringify({ action: 'password_reset_by_admin' }),
    });
  }

  async softDelete(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.deletedAt) {
      throw new ConflictException('User is already deleted');
    }

    const scheduledDeleteAt = new Date();
    scheduledDeleteAt.setDate(scheduledDeleteAt.getDate() + 30);

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: actorId,
        scheduledDeleteAt,
        isActive: false,
      },
    });

    await this.auditService.log({
      actorId: actorId || 'system',
      actorName: undefined,
      actorRole: undefined,
      entityType: 'user',
      entityId: id,
      action: 'SOFT_DELETE',
      details: `Usuario ${user.email} eliminado (recuperable por 30 días)`,
      after: JSON.stringify({ scheduledDeleteAt }),
    });
  }

  async restore(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new ConflictException('User is not deleted');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        scheduledDeleteAt: null,
        isActive: true,
      },
    });

    await this.auditService.log({
      actorId: actorId || 'system',
      actorName: undefined,
      actorRole: undefined,
      entityType: 'user',
      entityId: id,
      action: 'RESTORE',
      details: `Usuario ${user.email} restaurado`,
      after: JSON.stringify({ restored: true }),
    });

    return this.findById(id);
  }

  async findDeleted() {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    return users.map((user: any) => {
      const primaryRole = user.userRoles[0]?.role;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        deletedAt: user.deletedAt,
        deletedBy: user.deletedBy,
        scheduledDeleteAt: user.scheduledDeleteAt,
        role: primaryRole ? {
          id: primaryRole.id,
          key: primaryRole.key,
          name: primaryRole.name,
        } : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }

  async permanentDelete(id: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new ForbiddenException('User must be soft deleted before permanent deletion');
    }

    await this.auditService.log({
      actorId,
      entityType: 'user',
      entityId: id,
      action: 'PERMANENT_DELETE',
      beforeJson: JSON.stringify(user),
    });

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
