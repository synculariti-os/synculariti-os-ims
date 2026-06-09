import { Controller, Get, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { AUDIT_SERVICE_TOKEN, IAuditService } from './interfaces/i-audit.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_CODES } from '@ims/types';
import type { JwtPayload } from '@ims/types';

@Controller('audit')
export class AuditController {
  constructor(
    @Inject(AUDIT_SERVICE_TOKEN) private readonly auditService: IAuditService,
  ) {}

  @Get('logs')
  @RequirePermission(PERMISSION_CODES.ADMIN_USERS)
  async listLogs(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? Number(limit) : 50;
    const offsetNum = offset ? Number(offset) : 0;
    const data = await this.auditService.listLogs(user.restaurantId, limitNum, offsetNum);
    return { data };
  }

  @Get('logs/:id')
  @RequirePermission(PERMISSION_CODES.ADMIN_USERS)
  async getLog(@Param('id') id: string) {
    const data = await this.auditService.findLogById(id);
    if (!data) throw new NotFoundException(`Audit log entry ${id} not found`);
    return { data };
  }
}
