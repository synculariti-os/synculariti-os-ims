import { z } from 'zod';

export const uploadSalesFileDtoSchema = z.object({
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export const salesImportFileSchema = z.object({
  mimetype: z.enum([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'text/csv'
  ]),
  size: z.number().max(10 * 1024 * 1024), // 10MB
});

export type UploadSalesFileDto = z.infer<typeof uploadSalesFileDtoSchema>;

export const listBatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type ListBatchesQueryDto = z.infer<typeof listBatchesQuerySchema>;
