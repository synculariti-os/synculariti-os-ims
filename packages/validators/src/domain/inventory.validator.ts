import { z } from 'zod';

export const createTransferSchema = z.object({
  originRestaurantId: z.string().uuid(),
  destinationRestaurantId: z.string().uuid(),
  itemId: z.string().uuid(),
  qty: z.number().positive(),
});

export const submitCountRowSchema = z.object({
  itemId: z.string().uuid(),
  actualQty: z.number().min(0),
});

export const closeCountBatchSchema = z.object({
  batchId: z.string().uuid(),
  version: z.number().int().nonnegative(),
  rows: z.array(submitCountRowSchema).min(1),
});

export const createWasteLogSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().optional().nullable(),
});

export const createPrepLogSchema = z.object({
  prepItemId: z.string().uuid(),
  yieldQtyProduced: z.number().positive(),
});

export const planPrepSchema = z.object({
  itemId: z.string().uuid(),
  targetYield: z.number().positive(),
});

export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type SubmitCountRowDto = z.infer<typeof submitCountRowSchema>;
export type CloseCountBatchDto = z.infer<typeof closeCountBatchSchema>;
export type CreateWasteLogDto = z.infer<typeof createWasteLogSchema>;
export type CreatePrepLogDto = z.infer<typeof createPrepLogSchema>;
export type PlanPrepDto = z.infer<typeof planPrepSchema>;
