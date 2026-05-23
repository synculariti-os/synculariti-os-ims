import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, Recipe, RecipeIngredient, RecipeId, RestaurantId, ItemId } from '@ims/types';
import type { IRecipeRepository } from './interfaces/i-recipe.repository';
import type { CreateRecipeDto, UpdateRecipeDto } from '@ims/validators';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  async findById(recipeId: RecipeId): Promise<Recipe | null> {
    const row = await (this.db as Kysely<any>)
      .selectFrom('recipes')
      .selectAll()
      .where('id', '=', recipeId)
      .executeTakeFirst();

    return row ? this.mapRecipeRow(row) : null;
  }

  async findByProducesItemId(itemId: string): Promise<Recipe | null> {
    const row = await (this.db as Kysely<any>)
      .selectFrom('recipes')
      .selectAll()
      .where('produces_item_id', '=', itemId)
      .executeTakeFirst();

    return row ? this.mapRecipeRow(row) : null;
  }

  async findIngredients(recipeId: RecipeId): Promise<RecipeIngredient[]> {
    const rows = await (this.db as Kysely<any>)
      .selectFrom('recipe_ingredients')
      .selectAll()
      .where('recipe_id', '=', recipeId)
      .execute();

    return rows.map((r: any) => this.mapIngredientRow(r));
  }

  /**
   * Resolves a POS excel string to a recipe by joining through menu_item_mappings.
   * Matches on restaurant_id + raw_excel_string (case-insensitive trim).
   */
  async resolveByPosString(restaurantId: RestaurantId, rawString: string): Promise<Recipe | null> {
    const row = await (this.db as Kysely<any>)
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

  // ── Write ─────────────────────────────────────────────────────────────────

  async create(dto: CreateRecipeDto, restaurantId: RestaurantId): Promise<Recipe> {
    const [recipe] = await (this.db as Kysely<any>)
      .insertInto('recipes')
      .values({
        produces_item_id: dto.producesItemId,
        yield_quantity: dto.yieldQuantity,
        franchise_group_id: dto.franchiseGroupId ?? null,
        restaurant_id: dto.restaurantId ?? null,
      })
      .returningAll()
      .execute();

    if (dto.ingredients && dto.ingredients.length > 0) {
      await (this.db as Kysely<any>)
        .insertInto('recipe_ingredients')
        .values(
          dto.ingredients.map((ing) => ({
            recipe_id: recipe.id,
            ingredient_item_id: ing.ingredientItemId,
            quantity_required: ing.quantityRequired,
          })),
        )
        .execute();
    }

    return this.mapRecipeRow(recipe);
  }

  async update(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe> {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.yieldQuantity !== undefined) {
      updateData['yield_quantity'] = dto.yieldQuantity;
    }

    const [recipe] = await (this.db as Kysely<any>)
      .updateTable('recipes')
      .set(updateData)
      .where('id', '=', recipeId)
      .returningAll()
      .execute();

    if (dto.ingredients !== undefined) {
      // Replace all ingredients atomically
      await (this.db as Kysely<any>)
        .deleteFrom('recipe_ingredients')
        .where('recipe_id', '=', recipeId)
        .execute();

      if (dto.ingredients.length > 0) {
        await (this.db as Kysely<any>)
          .insertInto('recipe_ingredients')
          .values(
            dto.ingredients.map((ing) => ({
              recipe_id: recipeId,
              ingredient_item_id: ing.ingredientItemId,
              quantity_required: ing.quantityRequired,
            })),
          )
          .execute();
      }
    }

    return this.mapRecipeRow(recipe);
  }

  async upsertMapping(
    restaurantId: RestaurantId,
    rawString: string,
    recipeId: RecipeId,
  ): Promise<void> {
    await (this.db as Kysely<any>)
      .insertInto('menu_item_mappings')
      .values({
        restaurant_id: restaurantId,
        raw_excel_string: rawString.trim(),
        recipe_id: recipeId,
      })
      .onConflict((oc: any) =>
        oc
          .columns(['restaurant_id', 'raw_excel_string'])
          .doUpdateSet({ recipe_id: recipeId, updated_at: new Date().toISOString() }),
      )
      .execute();
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapRecipeRow(row: any): Recipe {
    return {
      id: row.id as RecipeId,
      franchiseGroupId: row.franchise_group_id ?? null,
      restaurantId: row.restaurant_id as RestaurantId | null,
      producesItemId: row.produces_item_id as ItemId,
      yieldQuantity: Number(row.yield_quantity),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapIngredientRow(row: any): RecipeIngredient {
    return {
      id: row.id,
      recipeId: row.recipe_id as RecipeId,
      ingredientItemId: row.ingredient_item_id as ItemId,
      quantityRequired: Number(row.quantity_required),
      createdAt: row.created_at,
    };
  }
}
