import type { Json } from '../database.types';

export interface AuditEntryDto {
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  requestPayload: Json | null;
  responsePayload: Json | null;
  success: boolean;
  errorMessage?: string;
  sourceIp?: string;
  userAgent?: string;
  restaurantId?: string;
  franchiseGroupId?: string;
}
