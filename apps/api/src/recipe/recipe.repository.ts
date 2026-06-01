import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import {
  Database, Recipe, RecipeIngredient, RecipeId, ItemId, RestaurantId,
  RecipeIngredientId, MenuItemMappingId, MenuItemMapping,
  asRecipeId, asItemId, asFranchiseGroupId, asRestaurantId,
  asRecipeIngredientId, asMenuItemMappingId,
} from '@ims/types';
import { UpdateRecipeDto } from '@ims/validators';
import { v4 as uuidv4 } from 'uuid';
import type { IRecipeRepository } from './interfaces/i-recipe.repository';
import type { CreateRecipeCommand } from './interfaces/i-recipe.service';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  async findAllRecipes(restaurantId: RestaurantId): Promise<Recipe[]> {
    const rows = await this.db
      .selectFrom('recipes')
      .selectAll('recipes')
      .where('recipes.restaurant_id', '=', restaurantId)
      .execute();

    return rows.map((r: Record<string, unknown>) => this.mapRecipeRow(r));
  }

  async findMenuRecipes(restaurantId: RestaurantId): Promise<Recipe[]> {
    const rows = await this.db
      .selectFrom('recipes')
      .selectAll('recipes')
      .where('recipes.produces_item_id', 'is', null)
      .where('recipes.restaurant_id', '=', restaurantId)
      .execute();

    return rows.map((r: Record<string, unknown>) => this.mapRecipeRow(r));
  }

  async findAllMappings(restaurantId: RestaurantId): Promise<MenuItemMapping[]> {
    const rows = await this.db
      .selectFrom('menu_item_mappings')
      .leftJoin('recipes', 'recipes.id', 'menu_item_mappings.recipe_id')
      .selectAll('menu_item_mappings')
      .select([
        'recipes.produces_item_id as produces_item_id',
        'recipes.recipe_name as virtual_recipe_name',
      ])
      .where('menu_item_mappings.restaurant_id', '=', restaurantId)
      .execute();

    return rows.map((r: Record<string, unknown>) => ({
      id: asMenuItemMappingId(r.id as string),
      restaurantId: asRestaurantId(r.restaurant_id as string),
      rawExcelString: r.raw_excel_string as string,
      recipeId: asRecipeId(r.recipe_id as string),
      producesItemId: r.produces_item_id as string | undefined,
      targetRecipeName: r.virtual_recipe_name as string | undefined, // Note: For actual targetRecipeName (if produces_item_id is set), it will be hydrated by the service
      createdAt: r.created_at as string,
    }));
  }

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
      .leftJoin('recipes as sub', 'sub.id', 'recipe_ingredients.sub_recipe_id')
      .selectAll('recipe_ingredients')
      .select([
        'sub.recipe_name as sub_recipe_name_virtual',
      ])
      .where('recipe_ingredients.recipe_id', '=', recipeId)
      .execute();

    return rows.map((r: Record<string, unknown>) => this.mapIngredientRow(r));
  }

  async resolveByPosString(restaurantId: RestaurantId, rawString: string): Promise<Recipe | null> {
    const row = await this.db
      .selectFrom('menu_item_mappings')
      .innerJoin('recipes', 'recipes.id', 'menu_item_mappings.recipe_id')
      .select([
        'recipes.id as id',
        'recipes.franchise_group_id as franchise_group_id',
        'recipes.restaurant_id as restaurant_id',
        'recipes.produces_item_id as produces_item_id',
        'recipes.recipe_name as recipe_name',
        'recipes.yield_quantity as yield_quantity',
        'recipes.yield_percent as yield_percent',
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
  ): Promise<MenuItemMapping[]> {
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

  async create(command: CreateRecipeCommand, trx?: unknown): Promise<Recipe> {
    const db = trx ? (trx as Kysely<Database>) : this.db;
    
    const [recipe] = await db
      .insertInto('recipes')
      .values({
        id: uuidv4() as RecipeId,
        produces_item_id: command.producesItemId ? asItemId(command.producesItemId) : null,
        recipe_name: command.recipeName ? command.recipeName : null,
        yield_quantity: command.yieldQuantity,
        yield_percent: command.yieldPercent ?? 1.0,
        franchise_group_id: command.franchiseGroupId ? asFranchiseGroupId(command.franchiseGroupId) : null,
        restaurant_id: command.restaurantId ? asRestaurantId(command.restaurantId) : null,
      })
      .returningAll()
      .execute();

    if (command.ingredients && command.ingredients.length > 0) {
      await db
        .insertInto('recipe_ingredients')
        .values(
          command.ingredients.map((ing) => ({
            id: uuidv4() as RecipeIngredientId,
            recipe_id: recipe.id,
            ingredient_item_id: ing.lineType === 'ingredient' && ing.ingredientItemId
              ? asItemId(ing.ingredientItemId)
              : null,
            sub_recipe_id: ing.lineType === 'sub_recipe' && ing.subRecipeId
              ? asRecipeId(ing.subRecipeId)
              : null,
            quantity_required: ing.quantityRequired,
          })),
        )
        .execute();
    }

    return this.mapRecipeRow(recipe);
  }

  async update(recipeId: RecipeId, dto: UpdateRecipeDto): Promise<Recipe> {
    return await this.db.transaction().execute(async (trx) => {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (dto.yieldQuantity !== undefined) {
        updateData['yield_quantity'] = dto.yieldQuantity;
      }
      if (dto.yieldPercent !== undefined) {
        updateData['yield_percent'] = dto.yieldPercent;
      }

      const [recipe] = await trx
        .updateTable('recipes')
        .set(updateData)
        .where('id', '=', recipeId)
        .returningAll()
        .execute();

      if (dto.ingredients !== undefined) {
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
                ingredient_item_id: ing.lineType === 'ingredient' && ing.ingredientItemId
                  ? asItemId(ing.ingredientItemId)
                  : null,
                sub_recipe_id: ing.lineType === 'sub_recipe' && ing.subRecipeId
                  ? asRecipeId(ing.subRecipeId)
                  : null,
                quantity_required: ing.quantityRequired,
              })),
            )
            .execute();
        }
      }

      return this.mapRecipeRow(recipe);
    });
  }

  async deleteRecipe(recipeId: RecipeId, trx?: unknown): Promise<void> {
    const db = trx ? (trx as Kysely<Database>) : this.db;
    await db
      .deleteFrom('recipes')
      .where('id', '=', recipeId)
      .execute();
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

  async deleteMapping(mappingId: string): Promise<void> {
    await this.db
      .deleteFrom('menu_item_mappings')
      .where('id', '=', mappingId as MenuItemMappingId)
      .execute();
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapRecipeRow(row: Record<string, unknown>): Recipe {
    return {
      id: asRecipeId(row.id as string),
      franchiseGroupId: row.franchise_group_id ? asFranchiseGroupId(row.franchise_group_id as string) : null,
      restaurantId: row.restaurant_id ? (row.restaurant_id as RestaurantId) : null,
      producesItemId: row.produces_item_id ? asItemId(row.produces_item_id as string) : null,
      recipeName: row.recipe_name ? (row.recipe_name as string) : null,
      yieldQuantity: Number(row.yield_quantity),
      yieldPercent: Number(row.yield_percent ?? 1.0),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapIngredientRow(row: Record<string, unknown>): RecipeIngredient {
    return {
      id: asRecipeIngredientId(row.id as string),
      recipeId: asRecipeId(row.recipe_id as string),
      lineType: row.ingredient_item_id ? 'ingredient' : 'sub_recipe',
      ingredientItemId: row.ingredient_item_id ? asItemId(row.ingredient_item_id as string) : null,
      ingredientItemName: row.ingredient_item_name ? (row.ingredient_item_name as string) : undefined,
      subRecipeId: row.sub_recipe_id ? asRecipeId(row.sub_recipe_id as string) : null,
      subRecipeName: row.sub_recipe_name_virtual ? (row.sub_recipe_name_virtual as string) : undefined,
      quantityRequired: Number(row.quantity_required),
      createdAt: row.created_at as string,
    };
  }
}
