import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, Recipe, RecipeIngredient, RecipeId, ItemId, RestaurantId, RecipeIngredientId, MenuItemMappingId, asRecipeId, asItemId, asFranchiseGroupId, asRestaurantId, asRecipeIngredientId, asMenuItemMappingId } from '@ims/types';
import { CreateRecipeDto, UpdateRecipeDto } from '@ims/validators';
import { v4 as uuidv4 } from 'uuid';
import type { IRecipeRepository } from './interfaces/i-recipe.repository';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  async findById(recipeId: RecipeId): Promise<Recipe | null> {
    const row = await this.db
      .selectFrom('recipes')
      .selectAll()
      .where('id', '=', recipeId)
      .executeTakeFirst();

    return row ? this.mapRecipeRow(row) : null;
  }

  async findByProducesItemId(itemId: string): Promise<Recipe | null> {
    const row = await this.db
      .selectFrom('recipes')
      .selectAll()
      .where('produces_item_id', '=', asItemId(itemId))
      .executeTakeFirst();

    return row ? this.mapRecipeRow(row) : null;
  }

  async findIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]> {
    const rows = await this.db
      .selectFrom('recipe_ingredients')
      .selectAll()
      .where('recipe_id', '=', recipeId)
      .execute();

    return rows.map((r: Record<string, unknown>) => this.mapIngredientRow(r));
  }

  /**
   * Resolves a POS excel string to a recipe by joining through menu_item_mappings.
   * Matches on restaurant_id + raw_excel_string (case-insensitive trim).
   */
  async resolveByPosString(restaurantId: RestaurantId, rawString: string): Promise<Recipe | null> {
    const row = await this.db
      .selectFrom('menu_item_mappings')
      .innerJoin('recipes', 'recipes.id', 'menu_item_mappings.recipe_id')
      .select([
        'recipes.id as id',
        'recipes.franchise_group_id as franchise_group_id',
        'recipes.restaurant_id as restaurant_id',
        'recipes.produces_item_id as produces_item_id',
        'recipes.yield_quantity as yield_quantity',
        'recipes.created_at as created_at',
        'recipes.updated_at as updated_at',
      ])
      .where('menu_item_mappings.restaurant_id', '=', restaurantId)
      .where('menu_item_mappings.raw_excel_string', '=', rawString.trim())
      .executeTakeFirst();

    return row ? this.mapRecipeRow(row) : null;
  }

  async resolveRecipesByPosStrings(
    restaurantId: RestaurantId,
    rawStrings: string[],
  ): Promise<import('@ims/types').MenuItemMapping[]> {
    if (rawStrings.length === 0) return [];
    
    const rows = await this.db
      .selectFrom('menu_item_mappings')
      .selectAll()
      .where('restaurant_id', '=', restaurantId)
      .where('raw_excel_string', 'in', rawStrings.map(s => s.trim()))
      .execute();
      
    return rows.map((r: Record<string, unknown>) => ({
      id: asMenuItemMappingId(r.id as string),
      restaurantId: asRestaurantId(r.restaurant_id as string),
      rawExcelString: r.raw_excel_string as string,
      recipeId: asRecipeId(r.recipe_id as string),
      createdAt: r.created_at as string,
    }));
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  async create(dto: CreateRecipeDto, restaurantId: RestaurantId): Promise<Recipe> {
    return await this.db.transaction().execute(async (trx) => {
      const [recipe] = await trx
        .insertInto('recipes')
        .values({
          id: uuidv4() as RecipeId,
          produces_item_id: asItemId(dto.producesItemId),
          yield_quantity: dto.yieldQuantity,
          franchise_group_id: dto.franchiseGroupId ? asFranchiseGroupId(dto.franchiseGroupId) : null,
          restaurant_id: dto.restaurantId ? asRestaurantId(dto.restaurantId) : null,
        })
        .returningAll()
        .execute();

      if (dto.ingredients && dto.ingredients.length > 0) {
        await trx
          .insertInto('recipe_ingredients')
          .values(
            dto.ingredients.map((ing) => ({
              id: uuidv4() as RecipeIngredientId,
              recipe_id: recipe.id,
              ingredient_item_id: asItemId(ing.ingredientItemId),
              quantity_required: ing.quantityRequired,
            })),
          )
          .execute();
      }

      return this.mapRecipeRow(recipe);
    });
  }

  async update(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe> {
    return await this.db.transaction().execute(async (trx) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.yieldQuantity !== undefined) {
        updateData['yield_quantity'] = dto.yieldQuantity;
      }

      const [recipe] = await trx
        .updateTable('recipes')
        .set(updateData)
        .where('id', '=', recipeId)
        .returningAll()
        .execute();

      if (dto.ingredients !== undefined) {
        // Replace all ingredients atomically
        await trx
          .deleteFrom('recipe_ingredients')
          .where('recipe_id', '=', recipeId)
          .execute();

        if (dto.ingredients.length > 0) {
          await trx
            .insertInto('recipe_ingredients')
            .values(
              dto.ingredients.map((ing) => ({
                id: uuidv4() as RecipeIngredientId,
                recipe_id: recipeId,
                ingredient_item_id: asItemId(ing.ingredientItemId),
                quantity_required: ing.quantityRequired,
              })),
            )
            .execute();
        }
      }

      return this.mapRecipeRow(recipe);
    });
  }

  async upsertMapping(
    restaurantId: RestaurantId,
    rawString: string,
    recipeId: RecipeId,
  ): Promise<void> {
    await this.db
      .insertInto('menu_item_mappings')
      .values({
        id: uuidv4() as MenuItemMappingId,
        restaurant_id: restaurantId,
        raw_excel_string: rawString.trim(),
        recipe_id: recipeId,
      })
      .onConflict((oc) =>
        oc
          .columns(['restaurant_id', 'raw_excel_string'])
          .doUpdateSet({ recipe_id: recipeId }),
      )
      .execute();
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapRecipeRow(row: Record<string, unknown>): Recipe {
    return {
      id: asRecipeId(row.id as string),
      franchiseGroupId: row.franchise_group_id ? asFranchiseGroupId(row.franchise_group_id as string) : null,
      restaurantId: row.restaurant_id ? (row.restaurant_id as RestaurantId) : null,
      producesItemId: asItemId(row.produces_item_id as string),
      yieldQuantity: Number(row.yield_quantity),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapIngredientRow(row: Record<string, unknown>): RecipeIngredient {
    return {
      id: asRecipeIngredientId(row.id as string),
      recipeId: asRecipeId(row.recipe_id as string),
      ingredientItemId: asItemId(row.ingredient_item_id as string),
      quantityRequired: Number(row.quantity_required),
      createdAt: row.created_at as string,
    };
  }
}
