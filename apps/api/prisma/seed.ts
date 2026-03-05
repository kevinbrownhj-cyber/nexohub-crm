import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  console.log('📦 Creating insurers...');
  const assa = await prisma.insurer.upsert({
    where: { key: 'ASSA' },
    update: {},
    create: {
      key: 'ASSA',
      name: 'ASSA Compañía de Seguros',
    },
  });

  const fedpa = await prisma.insurer.upsert({
    where: { key: 'FEDPA' },
    update: {},
    create: {
      key: 'FEDPA',
      name: 'FEDPA Seguros',
    },
  });

  const regional = await prisma.insurer.upsert({
    where: { key: 'REGIONAL' },
    update: {},
    create: {
      key: 'REGIONAL',
      name: 'Regional de Seguros',
    },
  });

  console.log(`✓ Created insurers: ${assa.name}, ${fedpa.name}, ${regional.name}`);

  console.log('🔑 Creating permissions...');
  const permissions = [
    { key: 'cases.read_all', description: 'Read all cases' },
    { key: 'cases.read_assigned', description: 'Read assigned cases only' },
    { key: 'cases.create', description: 'Create new cases' },
    { key: 'cases.edit', description: 'Edit cases' },
    { key: 'cases.manage', description: 'Manage cases (full access)' },
    { key: 'cases.soft_delete', description: 'Soft delete cases' },
    { key: 'customers.read', description: 'Read customers' },
    { key: 'customers.create', description: 'Create customers' },
    { key: 'customers.update', description: 'Update customers' },
    { key: 'customers.manage', description: 'Manage customers (full access)' },
    { key: 'assignments.manage', description: 'Manage case assignments' },
    { key: 'surcharges.create', description: 'Create surcharges' },
    { key: 'surcharges.approve', description: 'Approve surcharges' },
    { key: 'surcharges.reject', description: 'Reject surcharges' },
    { key: 'billing.prepare', description: 'Prepare invoices' },
    { key: 'billing.issue', description: 'Issue invoices' },
    { key: 'billing.export', description: 'Export invoices' },
    { key: 'imports.run', description: 'Run imports' },
    { key: 'imports.preview', description: 'Preview imports' },
    { key: 'imports.rollback', description: 'Rollback imports' },
    { key: 'users.manage', description: 'Manage users' },
    { key: 'roles.manage', description: 'Manage roles' },
    { key: 'audit.read', description: 'Read audit logs' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
    createdPermissions.push(created);
  }

  console.log(`✓ Created ${createdPermissions.length} permissions`);

  console.log('👥 Creating roles...');
  
  const adminRole = await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: {},
    create: {
      key: 'ADMIN',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
    },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { key: 'SUPERVISOR_OPERACIONES' },
    update: {},
    create: {
      key: 'SUPERVISOR_OPERACIONES',
      name: 'Supervisor de Operaciones',
      description: 'Gestiona casos, asignaciones y validaciones',
    },
  });

  const tecnicoRole = await prisma.role.upsert({
    where: { key: 'TECNICO' },
    update: {},
    create: {
      key: 'TECNICO',
      name: 'Técnico',
      description: 'Trabaja en casos asignados',
    },
  });

  const facturacionRole = await prisma.role.upsert({
    where: { key: 'FACTURACION' },
    update: {},
    create: {
      key: 'FACTURACION',
      name: 'Facturación',
      description: 'Prepara y emite facturas',
    },
  });

  const auditorRole = await prisma.role.upsert({
    where: { key: 'AUDITOR' },
    update: {},
    create: {
      key: 'AUDITOR',
      name: 'Auditor',
      description: 'Solo lectura y auditoría',
    },
  });

  console.log('✓ Created 5 roles');

  console.log('🔗 Mapping role permissions...');

  await prisma.rolePermission.deleteMany({});

  const adminPermissions = createdPermissions.map((p) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  const supervisorPermissions = createdPermissions
    .filter((p) =>
      [
        'cases.read_all',
        'cases.create',
        'cases.edit',
        'assignments.manage',
        'surcharges.create',
        'surcharges.approve',
        'surcharges.reject',
        'imports.run',
        'imports.preview',
      ].includes(p.key),
    )
    .map((p) => ({
      roleId: supervisorRole.id,
      permissionId: p.id,
    }));

  const tecnicoPermissions = createdPermissions
    .filter((p) => ['cases.read_assigned', 'cases.edit', 'surcharges.create'].includes(p.key))
    .map((p) => ({
      roleId: tecnicoRole.id,
      permissionId: p.id,
    }));

  const facturacionPermissions = createdPermissions
    .filter((p) =>
      [
        'cases.read_all',
        'surcharges.approve',
        'surcharges.reject',
        'billing.prepare',
        'billing.issue',
        'billing.export',
      ].includes(p.key),
    )
    .map((p) => ({
      roleId: facturacionRole.id,
      permissionId: p.id,
    }));

  const auditorPermissions = createdPermissions
    .filter((p) => ['cases.read_all', 'audit.read'].includes(p.key))
    .map((p) => ({
      roleId: auditorRole.id,
      permissionId: p.id,
    }));

  await prisma.rolePermission.createMany({
    data: [
      ...adminPermissions,
      ...supervisorPermissions,
      ...tecnicoPermissions,
      ...facturacionPermissions,
      ...auditorPermissions,
    ],
  });

  console.log('✓ Mapped permissions to roles');

  console.log('👤 Creating default users...');

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexohub.com' },
    update: {
      passwordHash,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'admin@nexohub.com',
      passwordHash,
      name: 'Administrador',
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({
    where: { userId: adminUser.id },
  });

  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Admin Servivial
  const adminServivial = await prisma.user.upsert({
    where: { email: 'admin@servivial.com' },
    update: {
      passwordHash,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'admin@servivial.com',
      passwordHash,
      name: 'Administrador Servivial',
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({
    where: { userId: adminServivial.id },
  });

  await prisma.userRole.create({
    data: {
      userId: adminServivial.id,
      roleId: adminRole.id,
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@nexohub.com' },
    update: {
      passwordHash: await bcrypt.hash('Super123!', 10),
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'supervisor@nexohub.com',
      passwordHash: await bcrypt.hash('Super123!', 10),
      name: 'Supervisor Principal',
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({
    where: { userId: supervisorUser.id },
  });

  await prisma.userRole.create({
    data: {
      userId: supervisorUser.id,
      roleId: supervisorRole.id,
    },
  });

  const tecnicoUser = await prisma.user.upsert({
    where: { email: 'tecnico@nexohub.com' },
    update: {
      passwordHash: await bcrypt.hash('Tecnico123!', 10),
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'tecnico@nexohub.com',
      passwordHash: await bcrypt.hash('Tecnico123!', 10),
      name: 'Técnico de Campo',
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({
    where: { userId: tecnicoUser.id },
  });

  await prisma.userRole.create({
    data: {
      userId: tecnicoUser.id,
      roleId: tecnicoRole.id,
    },
  });

  const facturacionUser = await prisma.user.upsert({
    where: { email: 'facturacion@nexohub.com' },
    update: {
      passwordHash: await bcrypt.hash('Factura123!', 10),
      isActive: true,
      deletedAt: null,
    },
    create: {
      email: 'facturacion@nexohub.com',
      passwordHash: await bcrypt.hash('Factura123!', 10),
      name: 'Departamento de Facturación',
      isActive: true,
    },
  });

  await prisma.userRole.deleteMany({
    where: { userId: facturacionUser.id },
  });

  await prisma.userRole.create({
    data: {
      userId: facturacionUser.id,
      roleId: facturacionRole.id,
    },
  });

  console.log('✓ Created default users');
  console.log('\n📋 Default Credentials:');
  console.log('  Admin:       admin@nexohub.com / Admin123!');
  console.log('  Admin:       admin@servivial.com / Admin123!');
  console.log('  Supervisor:  supervisor@nexohub.com / Super123!');
  console.log('  Técnico:     tecnico@nexohub.com / Tecnico123!');
  console.log('  Facturación: facturacion@nexohub.com / Factura123!');

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
