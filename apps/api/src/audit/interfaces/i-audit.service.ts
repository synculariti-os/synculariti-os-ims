export { AUDIT_SERVICE_TOKEN } from '../../core/core.symbols';
import type { AuditEntryDto } from '@ims/types';


export interface IAuditService {
  log(params: AuditEntryDto): Promise<void>;
}
