import { z } from 'zod';

export const UploadSalesFileDtoSchema = z.object({
  businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
});

export type UploadSalesFileDto = z.infer<typeof UploadSalesFileDtoSchema>;
