export { AUDIT_SERVICE_TOKEN } from '../../core/core.symbols';
import type { AuditEntryDto } from '@ims/types';


export interface IAuditService {
  log(params: AuditEntryDto): Promise<void>;
  listLogs(restaurantId: string, limit: number, offset: number): Promise<any[]>;
  findLogById(id: string): Promise<any | null>;
}
