import { z } from 'zod';

export const recipeIngredientSchema = z.union([
  z.object({
    lineType: z.literal('ingredient'),
    ingredientItemId: z.string().uuid(),
    subRecipeId: z.null().optional(),
    quantityRequired: z.number().positive(),
  }),
  z.object({
    lineType: z.literal('sub_recipe'),
    subRecipeId: z.string().uuid(),
    ingredientItemId: z.null().optional(),
    quantityRequired: z.number().positive(),
  }),
]);
export type RecipeIngredientDto = z.infer<typeof recipeIngredientSchema>;

export const createRecipeSchema = z.object({
  producesItemId: z.string().uuid().nullable().optional(),
  recipeName: z.string().min(1).nullable().optional(),
  yieldQuantity: z.number().positive(),
  /** Cooking yield as decimal 0–1 (e.g. 0.8 = 80% yield). UI sends as %; backend divides by 100. */
  yieldPercent: z.number().gt(0).lte(1).default(1),
  ingredients: z.array(recipeIngredientSchema).min(1),
}).refine(data => data.producesItemId || data.recipeName, {
  message: "Either a Produces Item or a Recipe Name must be provided",
  path: ["producesItemId"]
});
export type CreateRecipeDto = z.infer<typeof createRecipeSchema>;

export const updateRecipeSchema = z.object({
  yieldQuantity: z.number().positive().optional(),
  yieldPercent: z.number().gt(0).lte(1).optional(),
  ingredients: z.array(recipeIngredientSchema).min(1).optional(),
});
export type UpdateRecipeDto = z.infer<typeof updateRecipeSchema>;

export const menuItemMappingSchema = z.object({
  rawExcelString: z.string().min(1),
  recipeId: z.string().uuid(),
});
export type MenuItemMappingDto = z.infer<typeof menuItemMappingSchema>;
