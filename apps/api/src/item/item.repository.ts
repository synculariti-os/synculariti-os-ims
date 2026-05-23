import { Injectable, Inject } from '@nestjs/common';
import { IItemRepository } from './interfaces/i-item.repository';
import { Kysely } from 'kysely';
import { Database, ItemWithOverride, ItemId, RestaurantId, UomConversion } from '@ims/types';

@Injectable()
export class ItemRepository implements IItemRepository {
  constructor(@Inject('DB_CLIENT') private readonly db: Kysely<Database>) {}

  async findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride | null> {
    const item = await (this.db as Kysely<any>)
      .selectFrom('items')
      .leftJoin('item_restaurant_overrides', (join: any) =>
        join.onRef('item_restaurant_overrides.item_id', '=', 'items.id')
            .on('item_restaurant_overrides.restaurant_id', '=', restaurantId)
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
      id: item.id as ItemId,
      franchiseGroupId: item.franchiseGroupId as any,
      restaurantId: item.itemRestaurantId as RestaurantId | null,
      categoryId: item.categoryId as any,
      name: item.name,
      sku: item.sku,
      type: item.type as any,
      purchasingUom: item.purchasingUom,
      inventoryUom: item.inventoryUom,
      recipeUom: item.recipeUom,
      invToRecipeRatio: Number(item.invToRecipeRatio),
      isActive: item.itemIsActive,
      createdAt: item.itemCreatedAt,
      updatedAt: item.itemUpdatedAt,
      ...(hasOverride
        ? {
            override: {
              id: item.overrideId,
              itemId: item.id as ItemId,
              restaurantId: restaurantId,
              parLevel: Number(item.overrideParLevel),
              isActive: item.overrideIsActive,
              createdAt: item.itemUpdatedAt,
              updatedAt: item.itemUpdatedAt,
            }
          }
        : {}),
      effectiveParLevel: hasOverride ? Number(item.overrideParLevel) : 0,
      effectiveIsActive: hasOverride ? item.overrideIsActive : item.itemIsActive,
    };

    return result;
  }

  async getUomConversion(itemId: ItemId, fromUom: string, toUom: string): Promise<UomConversion | null> {
    const conversion = await (this.db as Kysely<any>)
      .selectFrom('uom_conversions')
      .selectAll()
      .where('item_id', '=', itemId)
      .where('from_uom', '=', fromUom)
      .where('to_uom', '=', toUom)
      .executeTakeFirst();

    if (!conversion) return null;

    return {
      id: conversion.id,
      itemId: conversion.item_id as ItemId,
      fromUom: conversion.from_uom,
      toUom: conversion.to_uom,
      multiplierFactor: Number(conversion.multiplier_factor),
      createdAt: conversion.created_at,
      updatedAt: conversion.updated_at,
    };
  }

  async listParLevels(restaurantId: RestaurantId): Promise<ItemWithOverride[]> {
    const items = await (this.db as Kysely<any>)
      .selectFrom('items')
      .leftJoin('item_restaurant_overrides', (join: any) =>
        join.onRef('item_restaurant_overrides.item_id', '=', 'items.id')
            .on('item_restaurant_overrides.restaurant_id', '=', restaurantId)
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
      .execute();

    return items.map((item: any) => {
      const hasOverride = item.overrideId != null;
      return {
        id: item.id as ItemId,
        franchiseGroupId: item.franchiseGroupId as any,
        restaurantId: item.itemRestaurantId as RestaurantId | null,
        categoryId: item.categoryId as any,
        name: item.name,
        sku: item.sku,
        type: item.type as any,
        purchasingUom: item.purchasingUom,
        inventoryUom: item.inventoryUom,
        recipeUom: item.recipeUom,
        invToRecipeRatio: Number(item.invToRecipeRatio),
        isActive: item.itemIsActive,
        createdAt: item.itemCreatedAt,
        updatedAt: item.itemUpdatedAt,
      ...(hasOverride
        ? {
            override: {
              id: item.overrideId,
              itemId: item.id as ItemId,
              restaurantId: restaurantId,
              parLevel: Number(item.overrideParLevel),
              isActive: item.overrideIsActive,
              createdAt: item.itemUpdatedAt,
              updatedAt: item.itemUpdatedAt,
            }
          }
        : {}),
        effectiveParLevel: hasOverride ? Number(item.overrideParLevel) : 0,
        effectiveIsActive: hasOverride ? item.overrideIsActive : item.itemIsActive,
      };
    });
  }

  async createItem(data: any): Promise<any> {
    const [item] = await (this.db as Kysely<any>)
      .insertInto('items')
      .values({
        franchise_group_id: data.franchiseGroupId,
        restaurant_id: data.restaurantId,
        category_id: data.categoryId,
        name: data.name,
        sku: data.sku,
        type: data.type,
        purchasing_uom: data.purchasingUom,
        inventory_uom: data.inventoryUom,
        recipe_uom: data.recipeUom,
        inv_to_recipe_ratio: data.invToRecipeRatio,
        is_active: data.isActive,
      })
      .returningAll()
      .execute();

    return this.mapItemRecord(item);
  }

  async updateItem(itemId: ItemId, data: any): Promise<any> {
    const updateData: any = {};
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

    const [item] = await (this.db as Kysely<any>)
      .updateTable('items')
      .set(updateData)
      .where('id', '=', itemId)
      .returningAll()
      .execute();

    return this.mapItemRecord(item);
  }

  async createCategory(data: any): Promise<any> {
    const [category] = await (this.db as Kysely<any>)
      .insertInto('categories')
      .values({
        franchise_group_id: data.franchiseGroupId,
        restaurant_id: data.restaurantId,
        name: data.name,
        description: data.description,
      })
      .returningAll()
      .execute();
    return this.mapCategoryRecord(category);
  }

  async updateCategory(categoryId: string, data: any): Promise<any> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    updateData.updated_at = new Date().toISOString();

    const [category] = await (this.db as Kysely<any>)
      .updateTable('categories')
      .set(updateData)
      .where('id', '=', categoryId)
      .returningAll()
      .execute();
    return this.mapCategoryRecord(category);
  }

  async upsertUomConversion(data: any): Promise<any> {
    const [conversion] = await (this.db as Kysely<any>)
      .insertInto('uom_conversions')
      .values({
        item_id: data.itemId,
        from_uom: data.fromUom,
        to_uom: data.toUom,
        multiplier_factor: data.multiplierFactor,
      })
      .onConflict((oc: any) => oc
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
      itemId: conversion.item_id as ItemId,
      fromUom: conversion.from_uom,
      toUom: conversion.to_uom,
      multiplierFactor: Number(conversion.multiplier_factor),
      createdAt: conversion.created_at,
      updatedAt: conversion.updated_at,
    };
  }

  async upsertItemOverride(itemId: ItemId, restaurantId: RestaurantId, data: any): Promise<any> {
    const existing = await (this.db as Kysely<any>)
      .selectFrom('item_restaurant_overrides')
      .selectAll()
      .where('item_id', '=', itemId)
      .where('restaurant_id', '=', restaurantId)
      .executeTakeFirst();

    if (existing) {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (data.parLevel !== undefined) updateData.par_level = data.parLevel;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const [updated] = await (this.db as Kysely<any>)
        .updateTable('item_restaurant_overrides')
        .set(updateData)
        .where('id', '=', existing.id)
        .returningAll()
        .execute();
      return this.mapOverrideRecord(updated);
    } else {
      const [inserted] = await (this.db as Kysely<any>)
        .insertInto('item_restaurant_overrides')
        .values({
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

  private mapItemRecord(item: any) {
    if (!item) return null;
    return {
      id: item.id as ItemId,
      franchiseGroupId: item.franchise_group_id as any,
      restaurantId: item.restaurant_id as RestaurantId | null,
      categoryId: item.category_id as any,
      name: item.name,
      sku: item.sku,
      type: item.type as any,
      purchasingUom: item.purchasing_uom,
      inventoryUom: item.inventory_uom,
      recipeUom: item.recipe_uom,
      invToRecipeRatio: Number(item.inv_to_recipe_ratio),
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  private mapCategoryRecord(category: any) {
    if (!category) return null;
    return {
      id: category.id,
      franchiseGroupId: category.franchise_group_id,
      restaurantId: category.restaurant_id,
      name: category.name,
      description: category.description,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }

  private mapOverrideRecord(override: any) {
    if (!override) return null;
    return {
      id: override.id,
      itemId: override.item_id,
      restaurantId: override.restaurant_id,
      parLevel: Number(override.par_level),
      isActive: override.is_active,
      createdAt: override.created_at,
      updatedAt: override.updated_at,
    };
  }
}
