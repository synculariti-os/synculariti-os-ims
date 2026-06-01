import type { AuditEntryDto } from '@ims/types';

export const AUDIT_SERVICE_TOKEN = Symbol('AUDIT_SERVICE_TOKEN');

export interface IAuditService {
  log(params: AuditEntryDto): Promise<void>;
}
