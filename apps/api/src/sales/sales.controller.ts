import { Controller, Post, UseInterceptors, UploadedFile, Body, Req, Inject } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SALES_SERVICE_TOKEN, ISalesService } from './interfaces/i-sales.service';
import { UploadSalesFileDtoSchema, UploadSalesFileDto } from '@ims/validators';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('sales')
export class SalesController {
  constructor(
    @Inject(SALES_SERVICE_TOKEN) private readonly salesService: ISalesService,
  ) {}

  @Post('upload')
  @RequirePermission('SALES.IMPORT')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    const dto = UploadSalesFileDtoSchema.parse(body);
    const { restaurantId, sub } = req.user;

    const batch = await this.salesService.uploadSalesFile(file, dto, restaurantId, sub);
    
    return {
      success: true,
      data: batch,
    };
  }
}
