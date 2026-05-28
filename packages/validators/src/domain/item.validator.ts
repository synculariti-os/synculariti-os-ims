import { z } from 'zod';

/**
 * Client-facing schema for item creation.
 * Ownership (franchiseGroupId / restaurantId) is intentionally EXCLUDED —
 * it is resolved server-side from the authenticated JWT context (R-ARCH-02).
 * The DB `item_owner_xor` constraint is enforced in ItemService, not here.
 */
export const createItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  type: z.enum(['RAW', 'PREP']),
  purchasingUom: z.string().min(1),
  inventoryUom: z.string().min(1),
  recipeUom: z.string().min(1).nullable().default(null),
  invToRecipeRatio: z.number().positive().default(1.0),
  isActive: z.boolean().default(true),
});

export const updateItemSchema = createItemSchema.partial();

export const createUomConversionSchema = z.object({
  itemId: z.string().uuid(),
  fromUom: z.string().min(1),
  toUom: z.string().min(1),
  multiplierFactor: z.number().positive(),
});

const baseCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createCategorySchema = baseCategorySchema;
export const updateCategorySchema = baseCategorySchema.partial();

export const updateItemOverrideSchema = z.object({
  parLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type CreateUomConversionDto = z.infer<typeof createUomConversionSchema>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type UpdateItemOverrideDto = z.infer<typeof updateItemOverrideSchema>;

