import { Module } from '@nestjs/common';
import { TENANT_SERVICE_TOKEN } from './interfaces/i-tenant.service';
import { TENANT_REPOSITORY_TOKEN } from './interfaces/i-tenant.repository';
import { TenantService } from './tenant.service';
import { TenantRepository } from './tenant.repository';
import { TenantController } from './tenant.controller';

@Module({
  controllers: [TenantController],
  providers: [
    {
      provide: TENANT_SERVICE_TOKEN,
      useClass: TenantService,
    },
    {
      provide: TENANT_REPOSITORY_TOKEN,
      useClass: TenantRepository,
    },
  ],
  exports: [TENANT_SERVICE_TOKEN],
})
export class TenantModule {}
