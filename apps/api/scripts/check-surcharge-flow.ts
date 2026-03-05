import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSurchargeFlow() {
  console.log('🔍 VERIFICANDO FLUJO DE RECLAMOS\n');

  try {
    // Buscar casos objetados
    const objectedCases = await prisma.case.findMany({
      where: { status: 'OBJECTED' },
      include: {
        surcharges: {
          where: { status: 'PENDING_APPROVAL' },
        },
        assignedToUser: {
          select: { name: true, email: true },
        },
      },
      take: 5,
    });

    console.log(`📊 CASOS OBJETADOS: ${objectedCases.length}\n`);

    if (objectedCases.length === 0) {
      console.log('   ℹ️  No hay casos objetados en este momento\n');
    } else {
      objectedCases.forEach((c, idx) => {
        console.log(`${idx + 1}. Expediente: ${c.externalId}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Técnico solicitó: $${(c.technicianRequestedAmountCents || 0) / 100}`);
        console.log(`   Razón: ${c.technicianRejectionReason || 'N/A'}`);
        console.log(`   Surcharges PENDING: ${c.surcharges.length}`);
        
        if (c.surcharges.length > 0) {
          c.surcharges.forEach(s => {
            console.log(`      - ID: ${s.id}, Monto: $${s.amountCents / 100}, Status: ${s.status}`);
          });
        } else {
          console.log(`      ⚠️  NO HAY SURCHARGE CREADO (problema detectado)`);
        }
        console.log('');
      });
    }

    // Verificar surcharges pendientes
    const pendingSurcharges = await prisma.surcharge.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        case: {
          select: { externalId: true, status: true },
        },
        requestedBy: {
          select: { name: true, email: true },
        },
      },
    });

    console.log(`📊 SURCHARGES PENDIENTES: ${pendingSurcharges.length}\n`);

    if (pendingSurcharges.length > 0) {
      pendingSurcharges.forEach((s, idx) => {
        console.log(`${idx + 1}. Caso: ${s.case.externalId}`);
        console.log(`   Monto: $${s.amountCents / 100}`);
        console.log(`   Concepto: ${s.concept}`);
        console.log(`   Solicitado por: ${s.requestedBy.name}`);
        console.log(`   Status: ${s.status}\n`);
      });
    }

    // Diagnóstico
    console.log('🔎 DIAGNÓSTICO:\n');
    
    const casesWithoutSurcharge = objectedCases.filter(c => c.surcharges.length === 0);
    if (casesWithoutSurcharge.length > 0) {
      console.log(`   ❌ PROBLEMA: ${casesWithoutSurcharge.length} casos objetados SIN surcharge creado`);
      console.log(`   Causa: El técnico rechaza pero no se crea registro en tabla surcharges`);
      console.log(`   Fix: Al rechazar caso, crear Surcharge con status PENDING_APPROVAL\n`);
    } else if (objectedCases.length > 0) {
      console.log(`   ✅ Todos los casos objetados tienen surcharge creado\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSurchargeFlow();
