import { DB_CLIENT } from '../core/core.symbols';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import type {
  Recipe,
  RecipeIngredient,
  BomExpansion,
  RecipeId,
  RestaurantId,
  FranchiseGroupId,
  RecipeNutritionReport
} from '@ims/types';
import { asItemId } from '@ims/types';
import type { Kysely } from 'kysely';
import type { Database } from '@ims/types';
import type { IRecipeService, CreateRecipeCommand } from './interfaces/i-recipe.service';
import type { CreateRecipeDto, UpdateRecipeDto, MenuItemMappingDto } from '@ims/validators';
import type { IRecipeRepository } from './interfaces/i-recipe.repository';
import type { IItemWriteService } from '../item/interfaces/i-item.service';
import { ITEM_WRITE_SERVICE_TOKEN } from '../item/interfaces/i-item.service';

import { RECIPE_REPOSITORY_TOKEN } from '../core/core.symbols';
export { RECIPE_REPOSITORY_TOKEN } from '../core/core.symbols';

@Injectable()
export class RecipeService implements IRecipeService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: Kysely<Database>,
    @Inject(RECIPE_REPOSITORY_TOKEN) private readonly recipeRepo: IRecipeRepository,
    @Inject(ITEM_WRITE_SERVICE_TOKEN) private readonly itemService: IItemWriteService,
  ) {}

  async listRecipes(restaurantId: RestaurantId): Promise<Recipe[]> {
    const recipes = await this.recipeRepo.findAllRecipes(restaurantId);
    await Promise.all(recipes.map(async (recipe) => {
      if (recipe.producesItemId) {
        try {
          const item = await this.itemService.findById(recipe.producesItemId, restaurantId);
          recipe.producesItemName = item.name;
        } catch (_e) {
          recipe.producesItemName = 'Unknown Item';
        }
      }
    }));
    return recipes;
  }

  async listMenuRecipes(restaurantId: RestaurantId): Promise<Recipe[]> {
    return this.recipeRepo.findMenuRecipes(restaurantId);
  }

  async listMappings(restaurantId: RestaurantId): Promise<import('@ims/types').MenuItemMapping[]> {
    const mappings = await this.recipeRepo.findAllMappings(restaurantId);
    await Promise.all(mappings.map(async (mapping: any) => {
      if (mapping.producesItemId) {
        try {
          const item = await this.itemService.findById(mapping.producesItemId, restaurantId);
          mapping.targetRecipeName = item.name;
        } catch (_e) {
          mapping.targetRecipeName = 'Unknown Item';
        }
      }
    }));
    return mappings;
  }

  async expandBOM(recipeId: RecipeId, soldQty: number): Promise<BomExpansion> {
    return this._expandBOMInternal(recipeId, soldQty, new Set<string>());
  }

  private async _expandBOMInternal(
    recipeId: RecipeId,
    soldQty: number,
    visited: Set<string>,
  ): Promise<BomExpansion> {
    if (soldQty <= 0) {
      throw new BadRequestException('soldQty must be positive');
    }

    if (visited.has(recipeId)) {
      throw new BadRequestException(
        `Circular sub-recipe reference detected at recipe ${recipeId}`,
      );
    }
    visited.add(recipeId);

    const recipe = await this.recipeRepo.findById(recipeId);
    if (!recipe) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    const ingredients = await this.recipeRepo.findIngredients(recipeId);

    if (ingredients.length === 0) {
      return [];
    }

    const scaleFactor = soldQty / recipe.yieldQuantity;
    const result: BomExpansion = [];

    for (const ing of ingredients) {
      if (ing.ingredientItemId) {
        // Raw ingredient
        result.push({
          itemId: ing.ingredientItemId,
          consumedQty: ing.quantityRequired * scaleFactor,
        });
      } else if (ing.subRecipeId) {
        // Sub-recipe: recursively expand it
        const subExpansion = await this._expandBOMInternal(
          ing.subRecipeId,
          ing.quantityRequired * scaleFactor,
          new Set(visited), // pass a copy so sibling branches don't block each other
        );
        result.push(...subExpansion);
      }
    }

    return result;
  }

  async resolveRecipeByPosString(
    restaurantId: RestaurantId,
    rawString: string,
  ): Promise<Recipe | null> {
    return this.recipeRepo.resolveByPosString(restaurantId, rawString);
  }

  async resolveRecipesByPosStrings(
    restaurantId: RestaurantId,
    rawStrings: string[],
  ): Promise<import('@ims/types').MenuItemMapping[]> {
    return this.recipeRepo.resolveRecipesByPosStrings(restaurantId, rawStrings);
  }

  async getIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]> {
    const ingredients = await this.recipeRepo.findIngredients(recipeId);
    
    // We need restaurantId to fetch item names, but we only have recipeId.
    // Let's fetch the recipe first.
    const recipe = await this.recipeRepo.findById(recipeId);
    if (!recipe || !recipe.restaurantId) return ingredients;

    await Promise.all(ingredients.map(async (ingredient) => {
      if (ingredient.ingredientItemId) {
        try {
          const item = await this.itemService.findById(ingredient.ingredientItemId, recipe.restaurantId as RestaurantId);
          ingredient.ingredientItemName = item.name;
        } catch (_e) {
          ingredient.ingredientItemName = 'Unknown Item';
        }
      }
    }));

    return ingredients;
  }

  
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

  async getUnmappedRows(
    restaurantId: RestaurantId,
    batchId: string,
  ): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>> {
    return this.recipeRepo.getUnmappedRows(restaurantId, batchId);
  }

  async bulkCreateRecipes(
    rows: Array<{
      producesItemSku: string;
      producesItemName: string | null;
      categoryName: string | null;
      recipeName: string | null;
      yieldQuantity: number;
      priceEur: number | null;
      vatRate: number | null;
      ingredientSku: string;
      ingredientName: string | null;
      quantityRequired: number;
      uom: string | null;
    }>,
    restaurantId: RestaurantId | null,
    franchiseGroupId: string | null,
  ): Promise<{ createdCount: number; skippedCount: number; errors: Array<{ row: number; message: string }> }> {
    const errors: Array<{ row: number; message: string }> = [];
    let createdCount = 0;
    let skippedCount = 0;

    const resolvedRestaurantId = restaurantId ?? null;

    // Group rows by recipe key (producesItemSku || recipeName)
    const groups = new Map<string, typeof rows>();
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key = row.producesItemSku || row.recipeName || `__row_${i}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    for (const [key, groupRows] of groups) {
      const firstRow = groupRows[0];
      try {
        let producesItemId: string | null = null;
        let recipeName: string | null = firstRow.recipeName;

        if (firstRow.producesItemSku) {
          producesItemId = await this.itemService.ensureItemDependencies(
            {
              sku: firstRow.producesItemSku,
              name: firstRow.producesItemName || firstRow.recipeName || firstRow.producesItemSku,
              categoryName: firstRow.categoryName || 'General',
              type: 'RAW',
              uom: firstRow.uom || undefined,
            },
            resolvedRestaurantId,
            franchiseGroupId,
          );

          if (!recipeName) {
            recipeName = firstRow.producesItemName || firstRow.producesItemSku;
          }
        }

        if (!recipeName) {
          errors.push({ row: 0, message: `Recipe "${key}" has no recipe name` });
          continue;
        }

        // Check for existing recipe to avoid duplicates
        const existingRecipe = producesItemId
          ? await this.recipeRepo.findByProducesItemId(producesItemId)
          : recipeName
            ? await this.recipeRepo.findByProducesItemId(recipeName) // Wait, findByRecipeName is not on IRecipeRepository
            : null;
        // The old code used findByRecipeName, but the current code only has findByProducesItemId. Let's list recipes to check by name if needed.
        if (!existingRecipe && !producesItemId && recipeName) {
           const existingList = await this.recipeRepo.findAllRecipes(resolvedRestaurantId as RestaurantId);
           const existsByName = existingList.find(r => r.recipeName === recipeName);
           if (existsByName) {
             skippedCount++;
             continue;
           }
        }

        if (existingRecipe) {
          skippedCount++;
          continue;
        }

        const ingredients: Array<{ lineType: 'ingredient'; ingredientItemId: string; quantityRequired: number }> = [];
        let hasIngredientError = false;

        for (const row of groupRows) {
          if (!row.ingredientSku) {
            errors.push({ row: 0, message: `Ingredient SKU is missing in recipe "${key}"` });
            hasIngredientError = true;
            continue;
          }

          // Ensure ingredient item exists (default is RAW)
          const ingredientItemId = await this.itemService.ensureItemDependencies(
            {
              sku: row.ingredientSku,
              name: row.ingredientName || row.ingredientSku,
              categoryName: firstRow.categoryName || 'General',
              type: 'RAW',
              uom: row.uom || undefined,
            },
            resolvedRestaurantId,
            franchiseGroupId,
          );

          if (!ingredientItemId) {
            errors.push({ row: 0, message: `Failed to resolve ingredient SKU: "${row.ingredientSku}" in recipe "${key}"` });
            hasIngredientError = true;
            continue;
          }

          ingredients.push({
            lineType: 'ingredient' as const,
            ingredientItemId,
            quantityRequired: row.quantityRequired,
          });
        }

        if (hasIngredientError) continue;
        if (ingredients.length === 0) {
          errors.push({ row: 0, message: `Recipe "${key}" has no valid ingredients` });
          continue;
        }

        const dto: CreateRecipeDto = {
          producesItemId,
          recipeName,
          yieldQuantity: firstRow.yieldQuantity,
          yieldPercent: 100,
          ingredients,
        };

        await this.createRecipe(dto, resolvedRestaurantId, franchiseGroupId);
        createdCount++;
      } catch (err) {
        errors.push({ row: 0, message: `Failed to create recipe "${key}": ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    return { createdCount, skippedCount, errors };
  }

  async getRecipeByProducesItemId(itemId: string): Promise<Recipe | null> {
    return this.recipeRepo.findByProducesItemId(itemId);
  }

  async createRecipe(
    dto: CreateRecipeDto,
    restaurantId: RestaurantId | null,
    franchiseGroupId: string | null
  ): Promise<Recipe> {
    const resolvedRestaurantId = restaurantId ?? null;
    const resolvedFranchiseGroupId = resolvedRestaurantId ? null : (franchiseGroupId ?? null);

    if (!resolvedRestaurantId && !resolvedFranchiseGroupId) {
      throw new BadRequestException(
        'Cannot create recipe: authenticated user has no restaurant or franchise group context assigned.',
      );
    }

    if (dto.producesItemId) {
      const item = await this.itemService.findById(
        asItemId(dto.producesItemId),
        resolvedRestaurantId as RestaurantId
      );
      if (!item) {
        throw new NotFoundException(`Item not found: ${dto.producesItemId}`);
      }
    }

    const command: CreateRecipeCommand = {
      ...dto,
      producesItemId: dto.producesItemId ?? null,
      recipeName: dto.recipeName ?? null,
      restaurantId: resolvedRestaurantId,
      franchiseGroupId: resolvedFranchiseGroupId as FranchiseGroupId | null,
    };

    return await this.db.transaction().execute(async (trx) => {
      const createdRecipe = await this.recipeRepo.create(command, trx);

      if (command.producesItemId) {
        await this.itemService.updateItem(asItemId(command.producesItemId), { type: 'PREP' }, trx);
      }

      return createdRecipe;
    });
  }

  async updateRecipe(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe> {
    const existing = await this.recipeRepo.findById(recipeId);
    if (!existing) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }

    return this.recipeRepo.update(recipeId, dto);
  }

  async deleteRecipe(recipeId: RecipeId): Promise<void> {
    const existing = await this.recipeRepo.findById(recipeId);
    if (!existing) {
      throw new NotFoundException(`Recipe ${recipeId} not found`);
    }
    
    return await this.db.transaction().execute(async (trx) => {
      if (existing.producesItemId) {
        const otherRecipe = await this.recipeRepo.findByProducesItemId(existing.producesItemId);
        const isOnlyProducer = !otherRecipe || otherRecipe.id === recipeId;
        
        await this.recipeRepo.deleteRecipe(recipeId, trx);
        
        if (isOnlyProducer) {
          await this.itemService.updateItem(existing.producesItemId, { type: 'RAW' }, trx);
        }
      } else {
        await this.recipeRepo.deleteRecipe(recipeId, trx);
      }
    });
  }

  async createMenuItemMapping(restaurantId: RestaurantId, dto: MenuItemMappingDto): Promise<void> {
    const existing = await this.recipeRepo.findById(dto.recipeId as RecipeId);
    if (!existing) {
      throw new NotFoundException(`Recipe ${dto.recipeId} not found`);
    }

    await this.recipeRepo.upsertMapping(restaurantId, dto.rawExcelString, dto.recipeId as RecipeId);
  }

  async deleteMapping(mappingId: string): Promise<void> {
    await this.recipeRepo.deleteMapping(mappingId);
  }
}
