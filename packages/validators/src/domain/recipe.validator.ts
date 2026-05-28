import { z } from 'zod';

export const recipeIngredientSchema = z.object({
  ingredientItemId: z.string().uuid(),
  quantityRequired: z.number().positive(),
});
export type RecipeIngredientDto = z.infer<typeof recipeIngredientSchema>;

export const createRecipeSchema = z.object({
  producesItemId: z.string().uuid().nullable().optional(),
  recipeName: z.string().min(1).nullable().optional(),
  yieldQuantity: z.number().positive(),
  ingredients: z.array(recipeIngredientSchema).min(1),
}).refine(data => data.producesItemId || data.recipeName, {
  message: "Either a Produces Item or a Recipe Name must be provided",
  path: ["producesItemId"]
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
