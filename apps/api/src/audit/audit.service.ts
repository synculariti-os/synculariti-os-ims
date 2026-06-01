import { DB_CLIENT } from '../core/core.symbols';
import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import crypto from 'crypto';
import { Database, Json, UserId, RestaurantId, FranchiseGroupId } from '@ims/types';
import type { AuditEntryDto } from '@ims/types';
import { IAuditService } from './interfaces/i-audit.service';

@Injectable()
export class AuditService implements IAuditService {
  constructor(@Inject(DB_CLIENT) private readonly db: Kysely<Database>) {}

  async log(params: AuditEntryDto): Promise<void> {
    try {
      await this.db
        .insertInto('audit_log')
        .values({
          id: crypto.randomUUID(),
          user_id: params.userId as UserId | null,
          user_email: params.userEmail,
          action: params.action,
          entity_type: params.entityType,
          entity_id: params.entityId,
          request_payload: params.requestPayload,
          response_payload: params.responsePayload,
          success: params.success,
          error_message: params.errorMessage || null,
          source_ip: params.sourceIp || null,
          user_agent: params.userAgent || null,
          restaurant_id: (params.restaurantId as RestaurantId) || null,
          franchise_group_id: (params.franchiseGroupId as FranchiseGroupId) || null,
        })
        .execute();
    } catch (e) {
      console.error('Failed to write audit log:', e);
      // We don't throw here to avoid failing the business transaction if audit logging fails
    }
  }
}
