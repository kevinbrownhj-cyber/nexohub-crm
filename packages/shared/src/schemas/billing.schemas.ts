import { z } from 'zod';
import { InvoiceStatus } from '../enums';

export const createInvoiceSchema = z.object({
  insurerId: z.string(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  caseIds: z.array(z.string()).min(1),
});

export const issueInvoiceSchema = z.object({
  notes: z.string().optional(),
});

export const invoicesQuerySchema = z.object({
  insurerId: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const readyCasesQuerySchema = z.object({
  insurerId: z.string().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type IssueInvoiceDto = z.infer<typeof issueInvoiceSchema>;
export type InvoicesQueryDto = z.infer<typeof invoicesQuerySchema>;
export type ReadyCasesQueryDto = z.infer<typeof readyCasesQuerySchema>;
