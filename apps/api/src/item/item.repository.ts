import { Injectable, Inject } from '@nestjs/common';
import { IItemRepository } from './interfaces/i-item.repository';
import { Kysely, sql } from 'kysely';
import { Database, ItemWithOverride, ItemId, RestaurantId, UomConversion, Category, ItemRestaurantOverride, Item, asRestaurantId, asItemId, asCategoryId, asFranchiseGroupId } from '@ims/types';
import { v4 as uuidv4 } from 'uuid';
import { CreateItemDto, UpdateItemDto, CreateCategoryDto, UpdateCategoryDto, CreateUomConversionDto, UpdateItemOverrideDto } from '@ims/validators';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  async findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride | null> {
    const item = await this.db
      .selectFrom('items')
      .leftJoin('item_restaurant_overrides', (join) =>
        join.onRef('item_restaurant_overrides.item_id', '=', 'items.id')
            .on('item_restaurant_overrides.restaurant_id', '=', sql`${restaurantId}`)
      )
      .select([
        'items.id as id',
        'items.franchise_group_id as franchiseGroupId',
        'items.restaurant_id as itemRestaurantId',
        'items.category_id as categoryId',
        'items.name as name',
        'items.sku as sku',
        'items.type as type',
        'items.purchasing_uom as purchasingUom',
        'items.inventory_uom as inventoryUom',
        'items.recipe_uom as recipeUom',
        'items.inv_to_recipe_ratio as invToRecipeRatio',
        'items.is_active as itemIsActive',
        'items.created_at as itemCreatedAt',
        'items.updated_at as itemUpdatedAt',
        'item_restaurant_overrides.id as overrideId',
        'item_restaurant_overrides.par_level as overrideParLevel',
        'item_restaurant_overrides.is_active as overrideIsActive',
      ])
      .where('items.id', '=', itemId)
      .executeTakeFirst();

    if (!item) {
      return null;
    }

    const hasOverride = item.overrideId != null;

    const result: ItemWithOverride = {
      id: asItemId(item.id as string),
      franchiseGroupId: item.franchiseGroupId ? asFranchiseGroupId(item.franchiseGroupId as string) : null,
      restaurantId: item.itemRestaurantId ? asRestaurantId(item.itemRestaurantId as string) : null,
      categoryId: asCategoryId(item.categoryId as string),
      name: item.name as string,
      sku: item.sku as string,
        type: item.type as import('@ims/types').ItemType,
      purchasingUom: item.purchasingUom as string,
      inventoryUom: item.inventoryUom as string,
      recipeUom: item.recipeUom,
      invToRecipeRatio: Number(item.invToRecipeRatio),
      isActive: Boolean(item.itemIsActive),
      createdAt: item.itemCreatedAt as string,
      updatedAt: item.itemUpdatedAt as string,
      ...(hasOverride
        ? {
            override: {
              id: item.overrideId as string,
              itemId: asItemId(item.id as string),
              restaurantId: restaurantId,
              parLevel: Number(item.overrideParLevel),
              isActive: Boolean(item.overrideIsActive),
              createdAt: item.itemUpdatedAt as string,
              updatedAt: item.itemUpdatedAt as string,
            }
          }
        : {}),
      effectiveParLevel: hasOverride ? Number(item.overrideParLevel) : 0,
      effectiveIsActive: hasOverride ? Boolean(item.overrideIsActive) : Boolean(item.itemIsActive),
    };

    return result;
  }

  async getUomConversion(itemId: ItemId, fromUom: string, toUom: string): Promise<UomConversion | null> {
    const conversion = await this.db
      .selectFrom('uom_conversions')
      .selectAll()
      .where('item_id', '=', itemId)
      .where('from_uom', '=', fromUom)
      .where('to_uom', '=', toUom)
      .executeTakeFirst();

    if (!conversion) return null;

    return {
      id: conversion.id,
      itemId: asItemId(conversion.item_id as string),
      fromUom: conversion.from_uom,
      toUom: conversion.to_uom,
      multiplierFactor: Number(conversion.multiplier_factor),
      createdAt: conversion.created_at as string,
      updatedAt: conversion.updated_at as string,
    };
  }

  async listParLevels(restaurantId: RestaurantId, page = 1, limit = 50): Promise<{ data: ItemWithOverride[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const offset = (page - 1) * limit;

    const [{ count }] = await this.db
      .selectFrom('items')
      .select(({ fn }) => fn.count<number>('id').as('count'))
      .execute();

    const total = Number(count);
    const totalPages = Math.ceil(total / limit);

    const rawItems = await this.db
      .selectFrom('items')
      .leftJoin('item_restaurant_overrides', (join) =>
        join.onRef('item_restaurant_overrides.item_id', '=', 'items.id')
            .on('item_restaurant_overrides.restaurant_id', '=', sql`${restaurantId}`)
      )
      .leftJoin('categories', 'categories.id', 'items.category_id')
      .select([
        'items.id as id',
        'items.franchise_group_id as franchiseGroupId',
        'items.restaurant_id as itemRestaurantId',
        'items.category_id as categoryId',
        'categories.name as categoryName',
        'items.name as name',
        'items.sku as sku',
        'items.type as type',
        'items.purchasing_uom as purchasingUom',
        'items.inventory_uom as inventoryUom',
        'items.recipe_uom as recipeUom',
        'items.inv_to_recipe_ratio as invToRecipeRatio',
        'items.is_active as itemIsActive',
        'items.created_at as itemCreatedAt',
        'items.updated_at as itemUpdatedAt',
        'item_restaurant_overrides.id as overrideId',
        'item_restaurant_overrides.par_level as overrideParLevel',
        'item_restaurant_overrides.is_active as overrideIsActive',
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    const data = rawItems.map((item) => {
      const hasOverride = item.overrideId != null;
      return {
        id: asItemId(item.id as string),
        franchiseGroupId: item.franchiseGroupId ? asFranchiseGroupId(item.franchiseGroupId as string) : null,
        restaurantId: item.itemRestaurantId ? asRestaurantId(item.itemRestaurantId as string) : null,
        categoryId: asCategoryId(item.categoryId as string),
        categoryName: item.categoryName as string | undefined,
        name: item.name as string,
        sku: item.sku as string,
      type: item.type as import('@ims/types').ItemType,
        purchasingUom: item.purchasingUom as string,
        inventoryUom: item.inventoryUom as string,
        recipeUom: item.recipeUom as string,
        invToRecipeRatio: Number(item.invToRecipeRatio),
        isActive: Boolean(item.itemIsActive),
        createdAt: item.itemCreatedAt as string,
        updatedAt: item.itemUpdatedAt as string,
      ...(hasOverride
        ? {
            override: {
              id: item.overrideId as string,
              itemId: asItemId(item.id as string),
              restaurantId: restaurantId,
              parLevel: Number(item.overrideParLevel),
              isActive: Boolean(item.overrideIsActive),
              createdAt: item.itemUpdatedAt as string,
              updatedAt: item.itemUpdatedAt as string,
            }
          }
        : {}),
        effectiveParLevel: hasOverride ? Number(item.overrideParLevel) : 0,
        effectiveIsActive: hasOverride ? Boolean(item.overrideIsActive) : Boolean(item.itemIsActive),
      };
    });

    return {
      data,
      meta: { total, page, limit, totalPages }
    };
  }

  async createItem(data: CreateItemDto): Promise<Item> {
    const [item] = await this.db
      .insertInto('items')
      .values({
        id: uuidv4() as ItemId,
        franchise_group_id: data.franchiseGroupId ? asFranchiseGroupId(data.franchiseGroupId) : null,
        restaurant_id: data.restaurantId ? asRestaurantId(data.restaurantId) : null,
        category_id: asCategoryId(data.categoryId),
        name: data.name,
        sku: data.sku,
        type: data.type,
        purchasing_uom: data.purchasingUom,
        inventory_uom: data.inventoryUom,
        recipe_uom: data.recipeUom ?? null,
        inv_to_recipe_ratio: data.invToRecipeRatio,
        is_active: data.isActive,
      })
      .returningAll()
      .execute();

    if (!item) throw new Error('Failed to create item');
    return this.mapItemRecord(item);
  }

  async updateItem(itemId: ItemId, data: UpdateItemDto): Promise<Item> {
    const updateData: Record<string, unknown> = {};
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.purchasingUom !== undefined) updateData.purchasing_uom = data.purchasingUom;
    if (data.inventoryUom !== undefined) updateData.inventory_uom = data.inventoryUom;
    if (data.recipeUom !== undefined) updateData.recipe_uom = data.recipeUom;
    if (data.invToRecipeRatio !== undefined) updateData.inv_to_recipe_ratio = data.invToRecipeRatio;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    updateData.updated_at = new Date().toISOString();

    const [item] = await this.db
      .updateTable('items')
      .set(updateData)
      .where('id', '=', itemId)
      .returningAll()
      .execute();

    if (!item) throw new Error('Failed to update item');
    return this.mapItemRecord(item);
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    const [category] = await this.db
      .insertInto('categories')
      .values({
        id: uuidv4() as import('@ims/types').CategoryId,
        franchise_group_id: data.franchiseGroupId ? asFranchiseGroupId(data.franchiseGroupId) : null,
        restaurant_id: data.restaurantId ? asRestaurantId(data.restaurantId) : null,
        name: data.name,
        description: data.description,
      })
      .returningAll()
      .execute();
    if (!category) throw new Error('Failed to create category');
    return this.mapCategoryRecord(category);
  }

  async updateCategory(categoryId: string, data: UpdateCategoryDto): Promise<Category> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    updateData.updated_at = new Date().toISOString();

    const [category] = await this.db
      .updateTable('categories')
      .set(updateData)
      .where('id', '=', asCategoryId(categoryId))
      .returningAll()
      .execute();
    if (!category) throw new Error('Failed to update category');
    return this.mapCategoryRecord(category);
  }

  async upsertUomConversion(data: CreateUomConversionDto): Promise<UomConversion> {
    const [conversion] = await this.db
      .insertInto('uom_conversions')
      .values({
        id: uuidv4(),
        item_id: asItemId(data.itemId),
        from_uom: data.fromUom,
        to_uom: data.toUom,
        multiplier_factor: data.multiplierFactor,
      })
      .onConflict((oc) => oc
        .columns(['item_id', 'from_uom', 'to_uom'])
        .doUpdateSet({
          multiplier_factor: data.multiplierFactor,
          updated_at: new Date().toISOString()
        })
      )
      .returningAll()
      .execute();
    
    return {
      id: conversion.id,
      itemId: asItemId(conversion.item_id as string),
      fromUom: conversion.from_uom,
      toUom: conversion.to_uom,
      multiplierFactor: Number(conversion.multiplier_factor),
      createdAt: conversion.created_at as string,
      updatedAt: conversion.updated_at as string,
    };
  }

  async upsertItemOverride(itemId: ItemId, restaurantId: RestaurantId, data: UpdateItemOverrideDto): Promise<ItemRestaurantOverride> {
    const existing = await this.db
      .selectFrom('item_restaurant_overrides')
      .selectAll()
      .where('item_id', '=', itemId)
      .where('restaurant_id', '=', restaurantId)
      .executeTakeFirst();

    if (existing) {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.parLevel !== undefined) updateData.par_level = data.parLevel;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const [updated] = await this.db
        .updateTable('item_restaurant_overrides')
        .set(updateData)
        .where('id', '=', existing.id)
        .returningAll()
        .execute();
      return this.mapOverrideRecord(updated);
    } else {
      const [inserted] = await this.db
        .insertInto('item_restaurant_overrides')
        .values({
          id: uuidv4(),
          item_id: itemId,
          restaurant_id: restaurantId,
          par_level: data.parLevel ?? 0,
          is_active: data.isActive ?? true,
        })
        .returningAll()
        .execute();
      return this.mapOverrideRecord(inserted);
    }
  }

  private mapItemRecord(row: Record<string, unknown>): Item {
    return {
      id: asItemId(row.id as string),
      franchiseGroupId: row.franchise_group_id ? asFranchiseGroupId(row.franchise_group_id as string) : null,
      restaurantId: row.restaurant_id ? asRestaurantId(row.restaurant_id as string) : null,
      categoryId: asCategoryId(row.category_id as string),
      name: row.name as string,
      sku: row.sku as string,
      type: row.type as import('@ims/types').ItemType,
      purchasingUom: row.purchasing_uom as string,
      inventoryUom: row.inventory_uom as string,
      recipeUom: row.recipe_uom as string | null,
      invToRecipeRatio: Number(row.inv_to_recipe_ratio),
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapCategoryRecord(row: Record<string, unknown>): Category {
    if (!row) throw new Error('Failed to map category record');
    return {
      id: asCategoryId(row.id as string),
      franchiseGroupId: row.franchise_group_id ? asFranchiseGroupId(row.franchise_group_id as string) : null,
      restaurantId: row.restaurant_id ? asRestaurantId(row.restaurant_id as string) : null,
      name: row.name as string,
      description: row.description as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapOverrideRecord(row: Record<string, unknown>): ItemRestaurantOverride {
    if (!row) throw new Error('Failed to map override record');
    return {
      id: row.id as string,
      itemId: asItemId(row.item_id as string),
      restaurantId: asRestaurantId(row.restaurant_id as string),
      parLevel: Number(row.par_level),
      isActive: Boolean(row.is_active),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
