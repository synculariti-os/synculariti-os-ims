import { Controller, Post, UseInterceptors, UploadedFile, Body, Req, Inject, ParseFilePipeBuilder, HttpStatus, Get, Query, HttpCode, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SALES_SERVICE_TOKEN, ISalesService } from './interfaces/i-sales.service';
import { uploadSalesFileDtoSchema, listBatchesQuerySchema } from '@ims/validators';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PERMISSION_CODES, JwtPayload } from '@ims/types';

@Controller('sales-imports')
export class SalesController {
  constructor(
    @Inject(SALES_SERVICE_TOKEN) private readonly salesService: ISalesService,
  ) {}

  @Post('upload')
  @HttpCode(201)
  @RequirePermission(PERMISSION_CODES.SALES_IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(csv|xlsx|xls|pdf|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    ) file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
    @Req() req: import('express').Request,
  ) {
    const dto = uploadSalesFileDtoSchema.parse(body);
    const { restaurantId, franchiseGroupId, sub } = (req as unknown as { user: JwtPayload }).user;

    const batch = await this.salesService.uploadSalesFile(file, dto, restaurantId, franchiseGroupId, sub);
    
    return batch;
  }

  /**
   * Upload a Slovak POS XLSX export (direct processing mode).
   * Returns a batchId in PENDING status. Call POST /:batchId/process to execute.
   */
  @Post('pos-upload')
  @HttpCode(201)
  @RequirePermission(PERMISSION_CODES.SALES_IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPosFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(xlsx|xls|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    ) file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
    @Req() req: import('express').Request,
  ) {
    const dto = uploadSalesFileDtoSchema.parse(body);
    const { restaurantId, sub } = (req as unknown as { user: JwtPayload }).user;

    return this.salesService.uploadPosFile(file, dto, restaurantId, sub);
  }

  /**
   * Process a POS batch synchronously: parse file from Supabase Storage,
   * insert raw rows, resolve recipes, expand BOM, and deplete inventory.
   */
  @Post(':batchId/process')
  @HttpCode(200)
  @RequirePermission(PERMISSION_CODES.SALES_IMPORT)
  async processPosBatch(
    @Param('batchId') batchId: string,
    @Req() req: import('express').Request,
  ) {
    const { restaurantId, franchiseGroupId } = (req as unknown as { user: JwtPayload }).user;
    return this.salesService.processPosBatch(batchId, restaurantId, franchiseGroupId);
  }

  @Get()
  @RequirePermission(PERMISSION_CODES.SALES_IMPORT)
  async listBatches(
    @Req() req: import('express').Request,
    @Query(new ZodValidationPipe(listBatchesQuerySchema)) query: import('@ims/validators').ListBatchesQueryDto
  ) {
    const { restaurantId } = (req as unknown as { user: JwtPayload }).user;
    return this.salesService.listBatches(restaurantId, query.page, query.limit);
  }

  @Get('unmapped-rows')
  @RequirePermission(PERMISSION_CODES.SALES_IMPORT)
  async getUnmappedRows(
    @Req() req: import('express').Request,
    @Query('batchId') batchId: string,
  ): Promise<{ data: Array<{ id: string; rawItemName: string; quantitySold: number }> }> {
    const { restaurantId } = (req as unknown as { user: JwtPayload }).user;
    const rows = await this.salesService.getUnmappedRows(restaurantId, batchId);
    return { data: rows };
  }
}
