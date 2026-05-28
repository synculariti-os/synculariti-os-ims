import { z } from 'zod';

export const recipeIngredientSchema = z.object({
  ingredientItemId: z.string().uuid(),
  quantityRequired: z.number().positive(),
});
export type RecipeIngredientDto = z.infer<typeof recipeIngredientSchema>;

export const createRecipeSchema = z.object({
  producesItemId: z.string().uuid(),
  yieldQuantity: z.number().positive(),
  ingredients: z.array(recipeIngredientSchema).min(1),
});
export type CreateRecipeDto = z.infer<typeof createRecipeSchema>;

export const updateRecipeSchema = z.object({
  yieldQuantity: z.number().positive().optional(),
  ingredients: z.array(recipeIngredientSchema).min(1).optional(),
});
export type UpdateRecipeDto = z.infer<typeof updateRecipeSchema>;

export const menuItemMappingSchema = z.object({
  rawExcelString: z.string().min(1),
  recipeId: z.string().uuid(),
});
export type MenuItemMappingDto = z.infer<typeof menuItemMappingSchema>;
