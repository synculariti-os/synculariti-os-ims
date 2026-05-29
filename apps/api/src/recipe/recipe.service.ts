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
} from '@ims/types';
import { asItemId } from '@ims/types';
import type { IRecipeService, CreateRecipeCommand } from './interfaces/i-recipe.service';
import type { CreateRecipeDto, UpdateRecipeDto, MenuItemMappingDto } from '@ims/validators';
import type { IRecipeRepository } from './interfaces/i-recipe.repository';
import type { IItemReadService } from '../item/interfaces/i-item.service';
import { ITEM_READ_SERVICE_TOKEN } from '../item/interfaces/i-item.service';

export const RECIPE_REPOSITORY_TOKEN = Symbol('IRecipeRepository');

@Injectable()
export class RecipeService implements IRecipeService {
  constructor(
    @Inject(RECIPE_REPOSITORY_TOKEN) private readonly recipeRepo: IRecipeRepository,
    @Inject(ITEM_READ_SERVICE_TOKEN) private readonly itemService: IItemReadService,
  ) {}

  async listRecipes(restaurantId: RestaurantId): Promise<Recipe[]> {
    return this.recipeRepo.findAllRecipes(restaurantId);
  }

  async listMappings(restaurantId: RestaurantId): Promise<import('@ims/types').MenuItemMapping[]> {
    return this.recipeRepo.findAllMappings(restaurantId);
  }

  async expandBOM(recipeId: RecipeId, soldQty: number): Promise<BomExpansion> {
    if (soldQty <= 0) {
      throw new BadRequestException('soldQty must be positive');
    }

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
        const subExpansion = await this.expandBOM(ing.subRecipeId, ing.quantityRequired * scaleFactor);
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
    return this.recipeRepo.findIngredients(recipeId);
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
      franchiseGroupId: resolvedFranchiseGroupId ? (resolvedFranchiseGroupId as any) : null,
    };

    return this.recipeRepo.create(command);
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
    await this.recipeRepo.deleteRecipe(recipeId);
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

  async getUnmappedRows(
    restaurantId: RestaurantId,
    batchId: string,
  ): Promise<Array<{ id: string; rawItemName: string; quantitySold: number }>> {
    return this.recipeRepo.getUnmappedRows(restaurantId, batchId);
  }
}
