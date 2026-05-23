import type { Json } from '@ims/types';

export const AUDIT_SERVICE_TOKEN = Symbol('AUDIT_SERVICE_TOKEN');

export interface IAuditService {
  logAction(params: {
    userId: string | null;
    userEmail: string | null;
    action: string;
    entityType: string;
    entityId: string;
    oldValue: Json | null;
    newValue: Json | null;
    success: boolean;
    errorMessage?: string;
    sourceIp?: string;
    userAgent?: string;
    restaurantId?: string;
    franchiseGroupId?: string;
  }): Promise<void>;
}
