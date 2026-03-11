import { z } from 'zod';
import { CaseStatus } from '../enums';

export const createCaseSchema = z.object({
  insurerId: z.string(),
  externalId: z.string(),
  externalSeq: z.string().optional(),
  serviceType: z.string().optional(),
  serviceStatusRaw: z.string().optional(),
  openedAt: z.string().datetime().optional(),
  productCode: z.string().optional(),
  policyNumber: z.string().optional(),
  certificate: z.string().optional(),
  customerData: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  vehicleData: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      plate: z.string().optional(),
      color: z.string().optional(),
      weight: z.string().optional(),
      usageType: z.string().optional(),
    })
    .optional(),
  originDescription: z.string().optional(),
  originProvince: z.string().optional(),
  originLocality: z.string().optional(),
  destinationDescription: z.string().optional(),
  destinationProvince: z.string().optional(),
  destinationLocality: z.string().optional(),
  kmToOrigin: z.number().optional(),
  kmOriginToDestination: z.number().optional(),
  providerName: z.string().optional(),
  driverName: z.string().optional(),
  priceInitialCents: z.number().int().optional(),
  priceSubtotalCents: z.number().int().optional(),
  taxApplicable: z.boolean().optional(),
  taxAmountCents: z.number().int().optional(),
  insurerAmountCents: z.number().int().optional(),
  customerExcessCents: z.number().int().optional(),
  customerManiobraCents: z.number().int().optional(),
  priceFinalCents: z.number().int().optional(),
  coverageText: z.string().optional(),
});

export const updateCaseSchema = createCaseSchema.partial();

export const assignCaseSchema = z.object({
  userId: z.string(),
  reason: z.string().optional(),
});

export const updateCaseStatusSchema = z.object({
  status: z.nativeEnum(CaseStatus),
  reason: z.string().optional(),
});

export const addCaseNoteSchema = z.object({
  note: z.string().min(1),
});

export const casesQuerySchema = z.object({
  insurerId: z.string().optional(),
  status: z.nativeEnum(CaseStatus).optional(),
  assignedToUserId: z.string().optional(),
  province: z.string().optional(),
  openedFrom: z.string().datetime().optional(),
  openedTo: z.string().datetime().optional(),
  externalId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCaseDto = z.infer<typeof createCaseSchema>;
export type UpdateCaseDto = z.infer<typeof updateCaseSchema>;
export type AssignCaseDto = z.infer<typeof assignCaseSchema>;
export type UpdateCaseStatusDto = z.infer<typeof updateCaseStatusSchema>;
export type AddCaseNoteDto = z.infer<typeof addCaseNoteSchema>;
export type CasesQueryDto = z.infer<typeof casesQuerySchema>;
