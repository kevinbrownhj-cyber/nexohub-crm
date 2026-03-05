export interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    key: string;
    permissions: Permission[];
  } | null;
  isActive: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  key: string;
}

export interface Case {
  id: string;
  externalId: string;
  insurer: Insurer | null;
  insurerId?: string;
  status: CaseStatus;
  assignedTo?: User;
  assignedToUser?: User;
  assignedToUserId?: string;
  originProvince: string;
  destinationProvince: string;
  serviceType: string;
  vehicleType?: string;
  vehiclePlate?: string;
  openedAt: string;
  closedAt?: string;
  priceBaseCents?: number;
  surchargeAmountCents?: number;
  priceFinalCents?: number;
  baseAmount?: number;
  totalAmount?: number;
  notes?: CaseNote[];
  surcharges?: Surcharge[];
  technicianRejection?: {
    requestedAmountCents: number;
    requestedSurchargeCents: number;
    reason: string;
    rejectedBy: string;
    rejectedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  };
  isBackdated?: boolean;
}

export type CaseStatus = 
  | 'IMPORTED'
  | 'ASSIGNED'
  | 'OBJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PENDING_BILLING_REVIEW'
  | 'READY_TO_INVOICE'
  | 'INVOICED'
  | 'CLOSED';

export interface Insurer {
  id: string;
  name: string;
  code: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface CaseNote {
  id: string;
  content: string;
  createdBy: User;
  createdAt: string;
}

export interface Surcharge {
  id: string;
  caseId: string;
  concept: string;
  description: string;
  amountCents: number;
  currency: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestedById: string;
  requestedBy?: User;
  requestedAt: string;
  decidedById?: string;
  decidedBy?: User;
  decidedAt?: string;
  decisionReason?: string;
  evidenceAttachmentId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  insurer: Insurer;
  periodStart: string;
  periodEnd: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
  issuedAt?: string;
  issuedBy?: User;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  case: Case;
  description: string;
  amount: number;
}

export interface AuditLog {
  id: string;
  actor: User;
  entityType: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
  createdAt: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  insurer: Insurer;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors?: any[];
  createdBy: User;
  createdAt: string;
  completedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
