import type { Request } from 'express';

const AUDIT_BEFORE_STATE = '__auditBeforeState';

export function setAuditBeforeState(request: Request, entity: unknown): void {
  (request as any)[AUDIT_BEFORE_STATE] = entity;
}

export function getAuditBeforeState(request: Request): unknown {
  return (request as any)[AUDIT_BEFORE_STATE];
}
