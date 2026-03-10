import { z } from 'zod';
import { InvoiceStatus } from '../enums';
export declare const createInvoiceSchema: z.ZodObject<{
    insurerId: z.ZodString;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    caseIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    insurerId: string;
    periodStart: string;
    periodEnd: string;
    caseIds: string[];
}, {
    insurerId: string;
    periodStart: string;
    periodEnd: string;
    caseIds: string[];
}>;
export declare const issueInvoiceSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export declare const invoicesQuerySchema: z.ZodObject<{
    insurerId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof InvoiceStatus>>;
    periodStart: z.ZodOptional<z.ZodString>;
    periodEnd: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: InvoiceStatus | undefined;
    insurerId?: string | undefined;
    periodStart?: string | undefined;
    periodEnd?: string | undefined;
}, {
    status?: InvoiceStatus | undefined;
    insurerId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    periodStart?: string | undefined;
    periodEnd?: string | undefined;
}>;
export declare const readyCasesQuerySchema: z.ZodObject<{
    insurerId: z.ZodOptional<z.ZodString>;
    periodStart: z.ZodOptional<z.ZodString>;
    periodEnd: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    insurerId?: string | undefined;
    periodStart?: string | undefined;
    periodEnd?: string | undefined;
}, {
    insurerId?: string | undefined;
    periodStart?: string | undefined;
    periodEnd?: string | undefined;
}>;
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type IssueInvoiceDto = z.infer<typeof issueInvoiceSchema>;
export type InvoicesQueryDto = z.infer<typeof invoicesQuerySchema>;
export type ReadyCasesQueryDto = z.infer<typeof readyCasesQuerySchema>;
