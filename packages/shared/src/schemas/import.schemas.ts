import { z } from 'zod';
import { InsurerKey } from '../enums';

export const previewImportSchema = z.object({
  insurerKey: z.nativeEnum(InsurerKey),
  fileName: z.string(),
  fileHash: z.string(),
});

export const commitImportSchema = z.object({
  importJobId: z.string(),
});

export const importsQuerySchema = z.object({
  insurerId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PreviewImportDto = z.infer<typeof previewImportSchema>;
export type CommitImportDto = z.infer<typeof commitImportSchema>;
export type ImportsQueryDto = z.infer<typeof importsQuerySchema>;
