import { z } from 'zod';
import { SurchargeConcept, SurchargeStatus } from '../enums';

export const createSurchargeSchema = z.object({
  caseId: z.string(),
  concept: z.nativeEnum(SurchargeConcept),
  description: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().default('USD'),
  evidenceAttachmentId: z.string().optional(),
});

export const approveSurchargeSchema = z.object({
  reason: z.string().optional(),
});

export const rejectSurchargeSchema = z.object({
  reason: z.string().min(1),
});

export const surchargesQuerySchema = z.object({
  status: z.nativeEnum(SurchargeStatus).optional(),
  caseId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSurchargeDto = z.infer<typeof createSurchargeSchema>;
export type ApproveSurchargeDto = z.infer<typeof approveSurchargeSchema>;
export type RejectSurchargeDto = z.infer<typeof rejectSurchargeSchema>;
export type SurchargesQueryDto = z.infer<typeof surchargesQuerySchema>;
