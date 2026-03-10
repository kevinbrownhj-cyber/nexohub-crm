import { z } from 'zod';
import { CaseStatus } from '../enums';
export declare const createCaseSchema: z.ZodObject<{
    insurerId: z.ZodString;
    externalId: z.ZodString;
    externalSeq: z.ZodOptional<z.ZodString>;
    serviceType: z.ZodOptional<z.ZodString>;
    serviceStatusRaw: z.ZodOptional<z.ZodString>;
    openedAt: z.ZodOptional<z.ZodString>;
    productCode: z.ZodOptional<z.ZodString>;
    policyNumber: z.ZodOptional<z.ZodString>;
    certificate: z.ZodOptional<z.ZodString>;
    customerData: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    }, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    }>>;
    vehicleData: z.ZodOptional<z.ZodObject<{
        make: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodNumber>;
        plate: z.ZodOptional<z.ZodString>;
        color: z.ZodOptional<z.ZodString>;
        weight: z.ZodOptional<z.ZodString>;
        usageType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    }, {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    }>>;
    originDescription: z.ZodOptional<z.ZodString>;
    originProvince: z.ZodOptional<z.ZodString>;
    originLocality: z.ZodOptional<z.ZodString>;
    destinationDescription: z.ZodOptional<z.ZodString>;
    destinationProvince: z.ZodOptional<z.ZodString>;
    destinationLocality: z.ZodOptional<z.ZodString>;
    kmToOrigin: z.ZodOptional<z.ZodNumber>;
    kmOriginToDestination: z.ZodOptional<z.ZodNumber>;
    providerName: z.ZodOptional<z.ZodString>;
    driverName: z.ZodOptional<z.ZodString>;
    priceInitialCents: z.ZodOptional<z.ZodNumber>;
    priceSubtotalCents: z.ZodOptional<z.ZodNumber>;
    taxApplicable: z.ZodOptional<z.ZodBoolean>;
    taxAmountCents: z.ZodOptional<z.ZodNumber>;
    insurerAmountCents: z.ZodOptional<z.ZodNumber>;
    customerExcessCents: z.ZodOptional<z.ZodNumber>;
    customerManiobraCents: z.ZodOptional<z.ZodNumber>;
    priceFinalCents: z.ZodOptional<z.ZodNumber>;
    coverageText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    insurerId: string;
    externalId: string;
    externalSeq?: string | undefined;
    serviceType?: string | undefined;
    serviceStatusRaw?: string | undefined;
    openedAt?: string | undefined;
    productCode?: string | undefined;
    policyNumber?: string | undefined;
    certificate?: string | undefined;
    customerData?: {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    } | undefined;
    vehicleData?: {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    } | undefined;
    originDescription?: string | undefined;
    originProvince?: string | undefined;
    originLocality?: string | undefined;
    destinationDescription?: string | undefined;
    destinationProvince?: string | undefined;
    destinationLocality?: string | undefined;
    kmToOrigin?: number | undefined;
    kmOriginToDestination?: number | undefined;
    providerName?: string | undefined;
    driverName?: string | undefined;
    priceInitialCents?: number | undefined;
    priceSubtotalCents?: number | undefined;
    taxApplicable?: boolean | undefined;
    taxAmountCents?: number | undefined;
    insurerAmountCents?: number | undefined;
    customerExcessCents?: number | undefined;
    customerManiobraCents?: number | undefined;
    priceFinalCents?: number | undefined;
    coverageText?: string | undefined;
}, {
    insurerId: string;
    externalId: string;
    externalSeq?: string | undefined;
    serviceType?: string | undefined;
    serviceStatusRaw?: string | undefined;
    openedAt?: string | undefined;
    productCode?: string | undefined;
    policyNumber?: string | undefined;
    certificate?: string | undefined;
    customerData?: {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    } | undefined;
    vehicleData?: {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    } | undefined;
    originDescription?: string | undefined;
    originProvince?: string | undefined;
    originLocality?: string | undefined;
    destinationDescription?: string | undefined;
    destinationProvince?: string | undefined;
    destinationLocality?: string | undefined;
    kmToOrigin?: number | undefined;
    kmOriginToDestination?: number | undefined;
    providerName?: string | undefined;
    driverName?: string | undefined;
    priceInitialCents?: number | undefined;
    priceSubtotalCents?: number | undefined;
    taxApplicable?: boolean | undefined;
    taxAmountCents?: number | undefined;
    insurerAmountCents?: number | undefined;
    customerExcessCents?: number | undefined;
    customerManiobraCents?: number | undefined;
    priceFinalCents?: number | undefined;
    coverageText?: string | undefined;
}>;
export declare const updateCaseSchema: z.ZodObject<{
    insurerId: z.ZodOptional<z.ZodString>;
    externalId: z.ZodOptional<z.ZodString>;
    externalSeq: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    serviceType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    serviceStatusRaw: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    openedAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    productCode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    policyNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    certificate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customerData: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    }, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    }>>>;
    vehicleData: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        make: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        year: z.ZodOptional<z.ZodNumber>;
        plate: z.ZodOptional<z.ZodString>;
        color: z.ZodOptional<z.ZodString>;
        weight: z.ZodOptional<z.ZodString>;
        usageType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    }, {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    }>>>;
    originDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    originProvince: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    originLocality: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    destinationDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    destinationProvince: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    destinationLocality: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    kmToOrigin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    kmOriginToDestination: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    providerName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    driverName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priceInitialCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    priceSubtotalCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    taxApplicable: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    taxAmountCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    insurerAmountCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    customerExcessCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    customerManiobraCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    priceFinalCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    coverageText: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    insurerId?: string | undefined;
    externalId?: string | undefined;
    externalSeq?: string | undefined;
    serviceType?: string | undefined;
    serviceStatusRaw?: string | undefined;
    openedAt?: string | undefined;
    productCode?: string | undefined;
    policyNumber?: string | undefined;
    certificate?: string | undefined;
    customerData?: {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    } | undefined;
    vehicleData?: {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    } | undefined;
    originDescription?: string | undefined;
    originProvince?: string | undefined;
    originLocality?: string | undefined;
    destinationDescription?: string | undefined;
    destinationProvince?: string | undefined;
    destinationLocality?: string | undefined;
    kmToOrigin?: number | undefined;
    kmOriginToDestination?: number | undefined;
    providerName?: string | undefined;
    driverName?: string | undefined;
    priceInitialCents?: number | undefined;
    priceSubtotalCents?: number | undefined;
    taxApplicable?: boolean | undefined;
    taxAmountCents?: number | undefined;
    insurerAmountCents?: number | undefined;
    customerExcessCents?: number | undefined;
    customerManiobraCents?: number | undefined;
    priceFinalCents?: number | undefined;
    coverageText?: string | undefined;
}, {
    insurerId?: string | undefined;
    externalId?: string | undefined;
    externalSeq?: string | undefined;
    serviceType?: string | undefined;
    serviceStatusRaw?: string | undefined;
    openedAt?: string | undefined;
    productCode?: string | undefined;
    policyNumber?: string | undefined;
    certificate?: string | undefined;
    customerData?: {
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        address?: string | undefined;
    } | undefined;
    vehicleData?: {
        make?: string | undefined;
        model?: string | undefined;
        year?: number | undefined;
        plate?: string | undefined;
        color?: string | undefined;
        weight?: string | undefined;
        usageType?: string | undefined;
    } | undefined;
    originDescription?: string | undefined;
    originProvince?: string | undefined;
    originLocality?: string | undefined;
    destinationDescription?: string | undefined;
    destinationProvince?: string | undefined;
    destinationLocality?: string | undefined;
    kmToOrigin?: number | undefined;
    kmOriginToDestination?: number | undefined;
    providerName?: string | undefined;
    driverName?: string | undefined;
    priceInitialCents?: number | undefined;
    priceSubtotalCents?: number | undefined;
    taxApplicable?: boolean | undefined;
    taxAmountCents?: number | undefined;
    insurerAmountCents?: number | undefined;
    customerExcessCents?: number | undefined;
    customerManiobraCents?: number | undefined;
    priceFinalCents?: number | undefined;
    coverageText?: string | undefined;
}>;
export declare const assignCaseSchema: z.ZodObject<{
    userId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    reason?: string | undefined;
}, {
    userId: string;
    reason?: string | undefined;
}>;
export declare const updateCaseStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof CaseStatus>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: CaseStatus;
    reason?: string | undefined;
}, {
    status: CaseStatus;
    reason?: string | undefined;
}>;
export declare const addCaseNoteSchema: z.ZodObject<{
    note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    note: string;
}, {
    note: string;
}>;
export declare const casesQuerySchema: z.ZodObject<{
    insurerId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof CaseStatus>>;
    assignedToUserId: z.ZodOptional<z.ZodString>;
    province: z.ZodOptional<z.ZodString>;
    openedFrom: z.ZodOptional<z.ZodString>;
    openedTo: z.ZodOptional<z.ZodString>;
    externalId: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: CaseStatus | undefined;
    insurerId?: string | undefined;
    externalId?: string | undefined;
    assignedToUserId?: string | undefined;
    province?: string | undefined;
    openedFrom?: string | undefined;
    openedTo?: string | undefined;
}, {
    status?: CaseStatus | undefined;
    insurerId?: string | undefined;
    externalId?: string | undefined;
    assignedToUserId?: string | undefined;
    province?: string | undefined;
    openedFrom?: string | undefined;
    openedTo?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type CreateCaseDto = z.infer<typeof createCaseSchema>;
export type UpdateCaseDto = z.infer<typeof updateCaseSchema>;
export type AssignCaseDto = z.infer<typeof assignCaseSchema>;
export type UpdateCaseStatusDto = z.infer<typeof updateCaseStatusSchema>;
export type AddCaseNoteDto = z.infer<typeof addCaseNoteSchema>;
export type CasesQueryDto = z.infer<typeof casesQuerySchema>;
