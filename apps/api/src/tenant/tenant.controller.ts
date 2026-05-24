import { Controller, Get, Inject } from '@nestjs/common';
import { ITenantService, TENANT_SERVICE_TOKEN } from './interfaces/i-tenant.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TokenOnly } from '../common/decorators/token-only.decorator';
import type { UserId } from '@ims/types';

@Controller('tenant')
export class TenantController {
  constructor(
    @Inject(TENANT_SERVICE_TOKEN) private readonly tenantService: ITenantService,
  ) {}

  @Get('context')
  @TokenOnly()
  async getContext(@CurrentUser() user: { sub: UserId }) {
    const restaurants = await this.tenantService.listRestaurantsForUser(user.sub);
    return restaurants;
  }
}
