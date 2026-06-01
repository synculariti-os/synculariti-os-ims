import { SUPABASE_ADMIN_CLIENT } from '../core/core.symbols';
import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { ISalesService } from './interfaces/i-sales.service';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from './interfaces/i-sales.repository';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SalesService implements ISalesService {
  constructor(
    @Inject(SALES_REPOSITORY_TOKEN) private readonly repo: ISalesRepository,
    @Inject(getQueueToken('sales_import')) private readonly salesQueue: Queue,
    @Inject(SUPABASE_ADMIN_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async uploadSalesFile(file: Express.Multer.File, dto: { businessDate: string }, restaurantId: string, franchiseId: string, userId: string): Promise<{ batchId: string }> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${restaurantId}/${dto.businessDate}-${uuidv4()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('sales_raw_uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const { data: urlData } = this.supabase.storage
      .from('sales_raw_uploads')
      .getPublicUrl(fileName);

    const batch = await this.repo.createBatch({
      restaurantId,
      businessDate: dto.businessDate,
      fileUrl: urlData.publicUrl,
      uploadedBy: userId,
    });

    await this.salesQueue.add('process-sales', { batchId: batch.id, restaurantId, franchiseId, filePath: fileName });

    return { batchId: batch.id };
  }

  async listBatches(restaurantId: string, page: number, limit: number): Promise<{ data: import('@ims/types').SalesImportBatch[], meta: import('@ims/types').PaginationMeta }> {
    const { data, total } = await this.repo.listBatches(restaurantId, page, limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUnmappedRows(
    restaurantId: string,
    batchId: string,
  ): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>> {
    return this.repo.getUnmappedRows(restaurantId, batchId);
  }
}
