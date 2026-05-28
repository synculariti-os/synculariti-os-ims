import { z } from 'zod';

const baseItemSchema = z.object({
  // Owner fields — the controller will inject from JWT if not provided by client.
  // Both default to null so the XOR refine can catch the missing-owner case.
  franchiseGroupId: z.string().uuid().nullable().default(null),
  restaurantId: z.string().uuid().nullable().default(null),
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

/**
 * Mirrors the DB `item_owner_xor` CHECK constraint:
 * Exactly ONE of franchiseGroupId or restaurantId must be non-null.
 */
export const createItemSchema = baseItemSchema.refine(
  (data) =>
    (data.franchiseGroupId !== null && data.restaurantId === null) ||
    (data.franchiseGroupId === null && data.restaurantId !== null),
  { message: 'Exactly one of franchiseGroupId or restaurantId must be provided (not both, not neither)' },
);

export const updateItemSchema = baseItemSchema.partial();

export const createUomConversionSchema = z.object({
  itemId: z.string().uuid(),
  fromUom: z.string().min(1),
  toUom: z.string().min(1),
  multiplierFactor: z.number().positive(),
});

const baseCategorySchema = z.object({
  franchiseGroupId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createCategorySchema = baseCategorySchema.refine(data => 
  (data.franchiseGroupId !== null && data.restaurantId === null) ||
  (data.franchiseGroupId === null && data.restaurantId !== null),
  { message: 'Must specify exactly one of franchiseGroupId or restaurantId' }
);

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

