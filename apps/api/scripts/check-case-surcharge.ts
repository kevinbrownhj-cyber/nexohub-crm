import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCaseSurcharge() {
  const externalId = '455s5f87d4844';

  console.log('🔍 VERIFICANDO CASO:', externalId);
  console.log('');

  try {
    const caseItem = await prisma.case.findFirst({
      where: { externalId },
      include: {
        surcharges: {
          orderBy: { createdAt: 'desc' },
        },
        assignedToUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!caseItem) {
      console.log('❌ Caso no encontrado');
      return;
    }

    console.log('📊 DATOS DEL CASO:');
    console.log('   Expediente:', caseItem.externalId);
    console.log('   Estado:', caseItem.status);
    console.log('   Técnico:', caseItem.assignedToUser?.name);
    console.log('   Precio Base:', `$${(caseItem.priceBaseCents || 0) / 100}`);
    console.log('   Recargo Actual:', `$${(caseItem.surchargeAmountCents || 0) / 100}`);
    console.log('   Precio Final:', `$${(caseItem.priceFinalCents || 0) / 100}`);
    console.log('');

    console.log('📋 DATOS DE RECHAZO DEL TÉCNICO:');
    console.log('   Monto solicitado:', `$${(caseItem.technicianRequestedAmountCents || 0) / 100}`);
    console.log('   Recargo solicitado:', `$${(caseItem.technicianRequestedSurchargeCents || 0) / 100}`);
    console.log('   Razón:', caseItem.technicianRejectionReason || 'N/A');
    console.log('   Rechazado por:', caseItem.technicianRejectedBy || 'N/A');
    console.log('   Fecha rechazo:', caseItem.technicianRejectedAt || 'N/A');
    console.log('');

    console.log('💰 SURCHARGES EN BD:', caseItem.surcharges.length);
    console.log('');

    if (caseItem.surcharges.length === 0) {
      console.log('❌ NO HAY SURCHARGES CREADOS');
      console.log('   PROBLEMA: El técnico rechazó pero no se creó el Surcharge');
    } else {
      caseItem.surcharges.forEach((s, idx) => {
        console.log(`${idx + 1}. Surcharge ID: ${s.id}`);
        console.log(`   Concepto: ${s.concept}`);
        console.log(`   Descripción: ${s.description}`);
        console.log(`   Monto: $${s.amountCents / 100}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Solicitado por: ${s.requestedById}`);
        console.log(`   Fecha: ${s.requestedAt}`);
        console.log('');
      });
    }

    // Diagnóstico
    const pendingSurcharge = caseItem.surcharges.find(s => s.status === 'PENDING_APPROVAL');
    
    console.log('🔎 DIAGNÓSTICO:');
    if (caseItem.status === 'OBJECTED' && !pendingSurcharge) {
      console.log('   ❌ PROBLEMA: Caso OBJECTED sin Surcharge PENDING_APPROVAL');
      console.log('   El backend NO creó el Surcharge al rechazar');
    } else if (pendingSurcharge) {
      console.log('   ✅ Surcharge PENDING_APPROVAL existe');
      console.log(`   Monto: $${pendingSurcharge.amountCents / 100}`);
      console.log(`   Razón: ${pendingSurcharge.description}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCaseSurcharge();
