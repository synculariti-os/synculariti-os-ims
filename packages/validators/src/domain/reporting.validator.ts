import { z } from 'zod';

export const vendorPriceHistoryQuerySchema = z.object({
  itemId: z.string().uuid('Invalid item ID format'),
});

export type VendorPriceHistoryQueryDto = z.infer<typeof vendorPriceHistoryQuerySchema>;
