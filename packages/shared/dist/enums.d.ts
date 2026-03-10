export declare enum CaseStatus {
    IMPORTED = "IMPORTED",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    PENDING_BILLING_REVIEW = "PENDING_BILLING_REVIEW",
    READY_TO_INVOICE = "READY_TO_INVOICE",
    INVOICED = "INVOICED",
    CLOSED = "CLOSED"
}
export declare enum SurchargeStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum SurchargeConcept {
    FALTA_PEAJE = "FALTA_PEAJE",
    MANIOBRA = "MANIOBRA",
    EXCESO_KM = "EXCESO_KM",
    OTRO = "OTRO"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    ISSUED = "ISSUED",
    VOIDED = "VOIDED"
}
export declare enum ImportJobStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum ImportRowAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    SKIP = "SKIP",
    ERROR = "ERROR"
}
export declare enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    ASSIGN = "ASSIGN",
    IMPORT = "IMPORT",
    INVOICE = "INVOICE",
    STATUS_CHANGE = "STATUS_CHANGE"
}
export declare enum RoleKey {
    ADMIN = "ADMIN",
    SUPERVISOR_OPERACIONES = "SUPERVISOR_OPERACIONES",
    TECNICO = "TECNICO",
    FACTURACION = "FACTURACION",
    AUDITOR = "AUDITOR"
}
export declare enum PermissionKey {
    CASES_READ_ALL = "cases.read_all",
    CASES_READ_ASSIGNED = "cases.read_assigned",
    CASES_CREATE = "cases.create",
    CASES_EDIT = "cases.edit",
    CASES_SOFT_DELETE = "cases.soft_delete",
    ASSIGNMENTS_MANAGE = "assignments.manage",
    SURCHARGES_CREATE = "surcharges.create",
    SURCHARGES_APPROVE = "surcharges.approve",
    SURCHARGES_REJECT = "surcharges.reject",
    BILLING_PREPARE = "billing.prepare",
    BILLING_ISSUE = "billing.issue",
    BILLING_EXPORT = "billing.export",
    IMPORTS_RUN = "imports.run",
    IMPORTS_PREVIEW = "imports.preview",
    IMPORTS_ROLLBACK = "imports.rollback",
    USERS_MANAGE = "users.manage",
    ROLES_MANAGE = "roles.manage",
    AUDIT_READ = "audit.read"
}
export declare enum InsurerKey {
    ASSA = "ASSA",
    FEDPA = "FEDPA",
    REGIONAL = "REGIONAL"
}
