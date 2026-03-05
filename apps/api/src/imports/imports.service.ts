import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findById(id: string) {
    return this.prisma.importJob.findUnique({
      where: { id },
      include: {
        importRows: true,
      },
    });
  }

  async processFile(file: Express.Multer.File, insurerId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    let extractedCases = [];

    try {
      // Procesar archivo Excel
      if (file.mimetype.includes('spreadsheet') || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        extractedCases = data.map((row: any, index: number) => {
          const errors = [];
          
          // Validar campos requeridos
          if (!row.fecha && !row.Fecha && !row.FECHA) errors.push('Falta fecha');
          if (!row.expediente && !row.Expediente && !row.EXPEDIENTE) errors.push('Falta expediente');
          if (!row.tecnico && !row.Técnico && !row.TECNICO) errors.push('Falta técnico');
          if (!row.servicio && !row.Servicio && !row.SERVICIO) errors.push('Falta servicio');
          if (!row.monto && !row.Monto && !row.MONTO) errors.push('Falta monto');

          return {
            date: row.fecha || row.Fecha || row.FECHA || '',
            externalId: row.expediente || row.Expediente || row.EXPEDIENTE || '',
            technician: row.tecnico || row.Técnico || row.TECNICO || '',
            service: row.servicio || row.Servicio || row.SERVICIO || '',
            amount: parseFloat(row.monto || row.Monto || row.MONTO || 0),
            valid: errors.length === 0,
            errors,
          };
        });
      } else {
        throw new BadRequestException('Formato de archivo no soportado. Use Excel (.xlsx, .xls, .csv)');
      }

      return {
        cases: extractedCases,
        total: extractedCases.length,
        valid: extractedCases.filter(c => c.valid).length,
        invalid: extractedCases.filter(c => !c.valid).length,
      };
    } catch (error) {
      throw new BadRequestException('Error procesando archivo: ' + (error as Error).message);
    }
  }

  async confirmImport(insurerId: string, cases: any[]) {
    // Por ahora, solo retornamos éxito
    // En una implementación real, aquí se crearían los casos en la base de datos
    return {
      success: true,
      imported: cases.length,
      message: `Se importaron ${cases.length} casos exitosamente`,
    };
  }

  async generateTemplate() {
    const workbook = XLSX.utils.book_new();
    
    // Datos de ejemplo para la plantilla
    const templateData = [
      {
        fecha: '2026-02-28',
        expediente: 'EXP-2024-001',
        tecnico: 'Juan Pérez',
        servicio: 'Grúa',
        monto: 150.50
      },
      {
        fecha: '2026-02-27',
        expediente: 'EXP-2024-002',
        tecnico: 'María García',
        servicio: 'Mecánica',
        monto: 200.00
      },
      {
        fecha: '2026-02-26',
        expediente: 'EXP-2024-003',
        tecnico: 'Pedro López',
        servicio: 'Grúa',
        monto: 175.25
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 12 }, // fecha
      { wch: 18 }, // expediente
      { wch: 20 }, // tecnico
      { wch: 15 }, // servicio
      { wch: 10 }, // monto
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Casos');

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}
