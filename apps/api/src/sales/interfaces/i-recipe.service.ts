export const RECIPE_SERVICE_TOKEN = Symbol('RECIPE_SERVICE_TOKEN');

export interface IRecipeService {
  expandBOM(recipeId: string, soldQty: number): Promise<{ itemId: string; consumedQty: number }[]>;
}
