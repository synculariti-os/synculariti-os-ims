// @immutable-test
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from '../sales.service';
import { ISalesRepository, SALES_REPOSITORY_TOKEN } from '../interfaces/i-sales.repository';
import { getQueueToken } from '@nestjs/bullmq';
import { SupabaseClient } from '@supabase/supabase-js';

describe('SalesService', () => {
  let service: SalesService;
  let repoMock: any;
  let queueMock: any;
  let supabaseMock: any;

  beforeEach(async () => {
    repoMock = {
      createBatch: vi.fn(),
      updateBatchStatus: vi.fn(),
    } as any;

    queueMock = {
      add: vi.fn(),
    };

    supabaseMock = {
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: SALES_REPOSITORY_TOKEN, useValue: repoMock },
        { provide: getQueueToken('sales_import'), useValue: queueMock },
        { provide: 'SUPABASE_ADMIN_CLIENT', useValue: supabaseMock },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should upload file, create batch, and enqueue job', async () => {
    const file = { buffer: Buffer.from('test'), originalname: 'sales.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as Express.Multer.File;
    const dto = { businessDate: '2023-10-01' };
    
    supabaseMock.storage.upload.mockResolvedValue({ data: { path: 'sales.xlsx' }, error: null });
    supabaseMock.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://fake-url.com/sales.xlsx' } });
    repoMock.createBatch.mockResolvedValue({ id: 'batch-123', status: 'PENDING' } as any);

    const result = await service.uploadSalesFile(file, dto, 'restaurant-1', 'franchise-1', 'user-1');

    expect(supabaseMock.storage.upload).toHaveBeenCalled();
    expect(repoMock.createBatch).toHaveBeenCalledWith(expect.objectContaining({
      restaurantId: 'restaurant-1',
      businessDate: '2023-10-01',
      fileUrl: 'https://fake-url.com/sales.xlsx',
    }));
    expect(queueMock.add).toHaveBeenCalledWith('process-sales', { 
      batchId: 'batch-123',
      restaurantId: 'restaurant-1',
      franchiseId: 'franchise-1',
      filePath: expect.any(String)
    });
    expect(result.batchId).toEqual('batch-123');
  });

  it('should throw an error if supabase upload fails', async () => {
    const file = { buffer: Buffer.from('test'), originalname: 'sales.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } as Express.Multer.File;
    const dto = { businessDate: '2023-10-01' };
    
    supabaseMock.storage.upload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });

    await expect(service.uploadSalesFile(file, dto, 'restaurant-1', 'franchise-1', 'user-1')).rejects.toThrow('Upload failed');
  });

  describe('listBatches', () => {
    it('should return paginated batches with meta envelope', async () => {
      const mockBatches = [
        { id: 'b1', status: 'COMPLETED' },
        { id: 'b2', status: 'PENDING' }
      ];
      repoMock.listBatches = vi.fn().mockResolvedValue({ data: mockBatches, total: 2 });

      const result = await service.listBatches('rest-1', 1, 50);

      expect(repoMock.listBatches).toHaveBeenCalledWith('rest-1', 1, 50);
      expect(result).toEqual({
        data: mockBatches,
        meta: {
          total: 2,
          page: 1,
          limit: 50,
          totalPages: 1
        }
      });
    });
  });
});
