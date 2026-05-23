import { z } from 'zod';

export const CreateItemSchema = z.object({
  franchiseGroupId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  type: z.enum(['RAW', 'PREP']),
  purchasingUom: z.string().min(1),
  inventoryUom: z.string().min(1),
  recipeUom: z.string().min(1).nullable(),
  invToRecipeRatio: z.number().positive().default(1.0),
  isActive: z.boolean().default(true),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateUomConversionSchema = z.object({
  itemId: z.string().uuid(),
  fromUom: z.string().min(1),
  toUom: z.string().min(1),
  multiplierFactor: z.number().positive(),
});

const BaseCategorySchema = z.object({
  franchiseGroupId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const CreateCategorySchema = BaseCategorySchema.refine(data => 
  (data.franchiseGroupId !== null && data.restaurantId === null) ||
  (data.franchiseGroupId === null && data.restaurantId !== null),
  { message: 'Must specify exactly one of franchiseGroupId or restaurantId' }
);

export const UpdateCategorySchema = BaseCategorySchema.partial();

export const UpdateItemOverrideSchema = z.object({
  parLevel: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateItemDto = z.infer<typeof CreateItemSchema>;
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;
export type CreateUomConversionDto = z.infer<typeof CreateUomConversionSchema>;
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
export type UpdateItemOverrideDto = z.infer<typeof UpdateItemOverrideSchema>;
