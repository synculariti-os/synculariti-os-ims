import { Controller, Post, UseInterceptors, UploadedFile, Body, Req, Inject, ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SALES_SERVICE_TOKEN, ISalesService } from './interfaces/i-sales.service';
import { uploadSalesFileDtoSchema, UploadSalesFileDto } from '@ims/validators';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSION_CODES, JwtPayload } from '@ims/types';

@Controller('sales-imports')
export class SalesController {
  constructor(
    @Inject(SALES_SERVICE_TOKEN) private readonly salesService: ISalesService,
  ) {}

  @Post('upload')
  @RequirePermission(PERMISSION_CODES.SALES_IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(csv|xlsx|xls|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-excel)$/i,
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
}
