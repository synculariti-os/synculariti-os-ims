import { Controller, Post, Patch, Get, Query, Body, Param, Inject, UseGuards, UseInterceptors, Req, UploadedFile, ParseFilePipeBuilder, BadRequestException, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantContextInterceptor } from '../common/interceptors/tenant-context.interceptor';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { setAuditBeforeState } from '../common/utils/audit.utils';

import { INVENTORY_COUNT_SERVICE_TOKEN } from './interfaces/i-inventory-count.service';
import type { IInventoryCountService } from './interfaces/i-inventory-count.service';
import { JwtPayload, PERMISSION_CODES } from '@ims/types';
import type { CountBatchId, CountRowId } from '@ims/types';
import { submitCountRowSchema, closeCountBatchSchema } from '@ims/validators';
import type { SubmitCountRowDto, CloseCountBatchDto } from '@ims/validators';

@Controller('inventory/counts')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
@UseInterceptors(TenantContextInterceptor)
export class InventoryCountController {
  constructor(
    @Inject(INVENTORY_COUNT_SERVICE_TOKEN)
    private readonly countService: IInventoryCountService,
  ) {}

  @Get()
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async listBatches(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string | number,
    @Query('offset') offset?: string | number,
  ) {
    const limitNum = limit ? typeof limit === 'number' ? limit : parseInt(limit as string, 10) : 50;
    const offsetNum = offset ? typeof offset === 'number' ? offset : parseInt(offset as string, 10) : 0;
    const data = await this.countService.listBatches(user.restaurantId, limitNum, offsetNum);
    return { data, meta: { limit: limitNum, offset: offsetNum } };
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async getBatchById(
    @Param('id') id: string,
  ) {
    const batchId = id as CountBatchId;
    const data = await this.countService.getBatchById(batchId);
    return data;
  }

  @Post('start')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async startBatch(@CurrentUser() user: JwtPayload) {
    return this.countService.startBatch(user.restaurantId);
  }

  @Patch(':batchId/rows/:rowId')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async submitActualCount(
    @Req() req: Request,
    @Param('batchId') batchId: string,
    @Param('rowId') rowId: string,
    @Body(new ZodValidationPipe(submitCountRowSchema)) dto: SubmitCountRowDto,
  ) {
    const existing = await this.countService.getBatchById(batchId as CountBatchId);
    const row = existing?.rows?.find((r: any) => r.id === rowId);
    if (row) {
      setAuditBeforeState(req, { actualQty: row.actualQty });
    }

    return this.countService.submitActualCount(
      batchId as CountBatchId,
      rowId as CountRowId,
      dto,
    );
  }

  @Post(':batchId/close')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  async closeBatch(
    @Param('batchId') batchId: string,
    @Body(new ZodValidationPipe(closeCountBatchSchema)) dto: CloseCountBatchDto,
  ) {
    await this.countService.closeBatch(batchId as CountBatchId, dto);
    return { success: true };
  }

  @Get(':batchId/export')
  @RequirePermission(PERMISSION_CODES.INVENTORY_READ)
  async exportBatch(@Param('batchId') batchId: string) {
    const rows = await this.countService.exportBatch(batchId as CountBatchId);
    let csv = 'itemId,itemName,expectedQty,actualQty\n';
    for (const row of rows) {
      csv += `"${row.itemId}","${row.itemName.replace(/"/g, '""')}",${row.expectedQty},${row.actualQty ?? ''}\n`;
    }
    return csv;
  }

  @Post(':batchId/import')
  @RequirePermission(PERMISSION_CODES.INVENTORY_WRITE)
  @UseInterceptors(FileInterceptor('file'))
  async importBatch(
    @Param('batchId') batchId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(csv|xlsx|xls|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/i,
          skipMagicNumbersValidation: true,
        })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    ) file: Express.Multer.File,
  ) {
    const xlsx = await import('xlsx');
    let buf = file.buffer;
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      buf = buf.subarray(3);
    }
    const workbook = xlsx.read(buf, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('Uploaded file contains no sheets');
    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, string | number | undefined>[] = xlsx.utils.sheet_to_json(sheet);

    const rowsToImport: { itemId: string; actualQty: number }[] = [];
    for (const row of rawRows) {
      const itemId = String(row['itemId'] ?? '').trim();
      const actualQty = row['actualQty'];
      if (itemId && actualQty !== undefined && actualQty !== null && actualQty !== '') {
        rowsToImport.push({ itemId, actualQty: Number(actualQty) });
      }
    }

    const updated = await this.countService.importBatch(batchId as CountBatchId, rowsToImport);
    return { success: true, updated };
  }
}
