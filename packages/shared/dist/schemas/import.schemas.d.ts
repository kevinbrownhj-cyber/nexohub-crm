import { z } from 'zod';
import { InsurerKey } from '../enums';
export declare const previewImportSchema: z.ZodObject<{
    insurerKey: z.ZodNativeEnum<typeof InsurerKey>;
    fileName: z.ZodString;
    fileHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    insurerKey: InsurerKey;
    fileName: string;
    fileHash: string;
}, {
    insurerKey: InsurerKey;
    fileName: string;
    fileHash: string;
}>;
export declare const commitImportSchema: z.ZodObject<{
    importJobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    importJobId: string;
}, {
    importJobId: string;
}>;
export declare const importsQuerySchema: z.ZodObject<{
    insurerId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: string | undefined;
    insurerId?: string | undefined;
}, {
    status?: string | undefined;
    insurerId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PreviewImportDto = z.infer<typeof previewImportSchema>;
export type CommitImportDto = z.infer<typeof commitImportSchema>;
export type ImportsQueryDto = z.infer<typeof importsQuerySchema>;
