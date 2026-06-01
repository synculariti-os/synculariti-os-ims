const fs = require('fs');
const file = 'apps/api/src/recipe/recipe.service.ts';
let code = fs.readFileSync(file, 'utf8');

const importAdd = `import type { BomExpansion, Recipe, RecipeIngredient, RecipeNutritionReport } from '@ims/types';`;
code = code.replace(/import type { BomExpansion, Recipe, RecipeIngredient } from '@ims\/types';/, importAdd);

const method = `
  async getNutrition(recipeId: RecipeId, restaurantId: RestaurantId): Promise<RecipeNutritionReport> {
    // 1. Expand BOM for 1 yield of the recipe
    // Note: expandBOM uses soldQty = 1. Wait, expandBOM parameter is 'soldQty' but for a PREP recipe it might mean 1 yield quantity.
    // Actually, expandBOM scales by yield percent.
    // Let's expand for 1 base yield.
    const recipe = await this.recipeRepo.findById(recipeId);
    if (!recipe) throw new BadRequestException('Recipe not found');
    
    // expandBOM expects soldQty. If soldQty = 1, it expands 1 unit of the recipe's output item.
    // So to get the nutrition for 1 yield quantity (e.g. 1 batch), we should pass recipe.yieldQuantity.
    const expansion = await this.expandBOM(recipeId, recipe.yieldQuantity);
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    const allergens = new Set<string>();

    // 2. Fetch nutritional info for each raw ingredient
    for (const line of expansion) {
      const itemWithOverride = await this.itemService.findById(line.itemId, restaurantId);
      const item = itemWithOverride;
      
      if (!item) continue;
      
      const qty = line.consumedQty;
      totalCalories += qty * (item.caloriesPerUom || 0);
      totalProtein += qty * (item.proteinGrams || 0);
      totalFat += qty * (item.fatGrams || 0);
      totalCarbs += qty * (item.carbsGrams || 0);
      
      if (item.allergens) {
        for (const allergen of item.allergens) {
          allergens.add(allergen.trim());
        }
      }
    }

    return {
      calories: Number(totalCalories.toFixed(2)),
      proteinGrams: Number(totalProtein.toFixed(2)),
      fatGrams: Number(totalFat.toFixed(2)),
      carbsGrams: Number(totalCarbs.toFixed(2)),
      allergens: Array.from(allergens).sort(),
    };
  }
`;

code = code.replace(/async getRecipeByProducesItemId/, method + '\n  async getRecipeByProducesItemId');

fs.writeFileSync(file, code);
