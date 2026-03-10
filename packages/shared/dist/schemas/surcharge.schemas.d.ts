import { z } from 'zod';
import { SurchargeConcept, SurchargeStatus } from '../enums';
export declare const createSurchargeSchema: z.ZodObject<{
    caseId: z.ZodString;
    concept: z.ZodNativeEnum<typeof SurchargeConcept>;
    description: z.ZodString;
    amountCents: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    evidenceAttachmentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    caseId: string;
    concept: SurchargeConcept;
    description: string;
    amountCents: number;
    currency: string;
    evidenceAttachmentId?: string | undefined;
}, {
    caseId: string;
    concept: SurchargeConcept;
    description: string;
    amountCents: number;
    currency?: string | undefined;
    evidenceAttachmentId?: string | undefined;
}>;
export declare const approveSurchargeSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const rejectSurchargeSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const surchargesQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof SurchargeStatus>>;
    caseId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: SurchargeStatus | undefined;
    caseId?: string | undefined;
}, {
    status?: SurchargeStatus | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    caseId?: string | undefined;
}>;
export type CreateSurchargeDto = z.infer<typeof createSurchargeSchema>;
export type ApproveSurchargeDto = z.infer<typeof approveSurchargeSchema>;
export type RejectSurchargeDto = z.infer<typeof rejectSurchargeSchema>;
export type SurchargesQueryDto = z.infer<typeof surchargesQuerySchema>;
