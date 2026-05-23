import { Module } from '@nestjs/common';
import { AUDIT_SERVICE_TOKEN } from './interfaces/i-audit.service';

@Module({
  providers: [
    {
      provide: AUDIT_SERVICE_TOKEN,
      useValue: {}, // Mock until implemented
    }
  ],
  exports: [AUDIT_SERVICE_TOKEN],
})
export class AuditModule {}
