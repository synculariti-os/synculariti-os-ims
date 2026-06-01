import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_SERVICE_TOKEN, IAuditService } from '../../audit/interfaces/i-audit.service';
import { getAuditBeforeState } from '../utils/audit.utils';
import type { Json } from '@ims/types';

function resolveRequestPayload(request: any): Json {
  const beforeState = getAuditBeforeState(request);
  if (beforeState !== undefined) return beforeState as Json;
  return (request.body as Json) || null;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUDIT_SERVICE_TOKEN) private readonly auditService: IAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only intercept mutating methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response: any) => {
          const duration = Date.now() - startTime;
          void this.auditService.log({
            userId: request.user?.sub ?? null,
            userEmail: request.user?.email ?? null,
            action: `${method} ${request.route?.path || request.url}`,
            entityType: request.route?.path?.split('/')[1] ?? 'unknown',
            entityId: request.params?.id ?? 'unknown',
            requestPayload: resolveRequestPayload(request),
            responsePayload: response || null,
            success: true,
            sourceIp: request.ip,
            userAgent: request.headers?.['user-agent'],
            restaurantId: request.user?.restaurantId,
            franchiseGroupId: request.user?.franchiseGroupId,
          });
        },
        error: (error: Error) => {
          void this.auditService.log({
            userId: request.user?.sub ?? null,
            userEmail: request.user?.email ?? null,
            action: `${method} ${request.route?.path || request.url}`,
            entityType: request.route?.path?.split('/')[1] ?? 'unknown',
            entityId: request.params?.id ?? 'unknown',
            requestPayload: resolveRequestPayload(request),
            responsePayload: null,
            success: false,
            errorMessage: error.message,
            sourceIp: request.ip,
            userAgent: request.headers?.['user-agent'],
            restaurantId: request.user?.restaurantId,
            franchiseGroupId: request.user?.franchiseGroupId,
          });
        },
      }),
    );
  }
}
