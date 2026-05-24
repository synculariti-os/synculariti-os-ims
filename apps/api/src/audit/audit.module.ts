import { Module } from '@nestjs/common';
import { AUDIT_SERVICE_TOKEN } from './interfaces/i-audit.service';
import { AuditService } from './audit.service';

@Module({
  providers: [
    {
      provide: AUDIT_SERVICE_TOKEN,
      useClass: AuditService,
    }
  ],
  exports: [AUDIT_SERVICE_TOKEN],
})
export class AuditModule {}
