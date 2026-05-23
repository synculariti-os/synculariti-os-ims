import { Module } from '@nestjs/common';
import { TENANT_SERVICE_TOKEN } from './interfaces/i-tenant.service';

@Module({
  providers: [
    {
      provide: TENANT_SERVICE_TOKEN,
      useValue: {}, // Mock for now until service is implemented
    },
  ],
  exports: [TENANT_SERVICE_TOKEN],
})
export class TenantModule {}
