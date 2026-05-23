export { PERMISSION_CODES } from './permissions';
export type { PermissionCode } from './permissions';
export const PURCHASE_ORDER_STATUS = { DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED', RECEIVED: 'RECEIVED', CANCELLED: 'CANCELLED' } as const;
export const TRANSFER_STATUS = { PENDING: 'PENDING', IN_TRANSIT: 'IN_TRANSIT', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' } as const;
export const COUNT_STATUS = { OPEN: 'OPEN', SUBMITTED: 'SUBMITTED', CLOSED: 'CLOSED' } as const;
export const IMPORT_STATUS = { PENDING: 'PENDING', PROCESSING: 'PROCESSING', COMPLETED: 'COMPLETED', FAILED: 'FAILED' } as const;
export const ITEM_TYPES = { RAW: 'RAW', PREP: 'PREP' } as const;
export const LEDGER_REASON_CODES = {
  PO_RECEIPT: 'PO_RECEIPT', SALES_DEPLETION: 'SALES_DEPLETION', WASTE: 'WASTE',
  TRANSFER_OUT: 'TRANSFER_OUT', TRANSFER_IN: 'TRANSFER_IN', COUNT_ADJUSTMENT: 'COUNT_ADJUSTMENT',
  PREP_PRODUCTION: 'PREP_PRODUCTION', PREP_CONSUMPTION: 'PREP_CONSUMPTION',
} as const;
export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;
export const DEFAULT_PAGE = 1;
export const SALES_IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const SALES_IMPORT_ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/csv',
] as const;
