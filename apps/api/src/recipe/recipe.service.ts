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

export const RECIPE_REPOSITORY_TOKEN = Symbol('IRecipeRepository');

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
        } catch (e) {
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
        } catch (e) {
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
        } catch (e) {
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
