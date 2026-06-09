import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import type { ItemWithOverride, ItemId, RestaurantId, Item, Category, UomConversion, ItemRestaurantOverride } from '@ims/types';
import { asFranchiseGroupId } from '@ims/types';
import type { IItemWriteService, CreateItemCommand, CreateCategoryCommand } from './interfaces/i-item.service';
import { IItemRepository } from './interfaces/i-item.repository';
import { ITEM_REPOSITORY_TOKEN } from './interfaces/i-item.repository';
import type { 
  CreateItemDto, 
  UpdateItemDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateUomConversionDto, 
  UpdateItemOverrideDto 
} from '@ims/validators';

@Injectable()
export class ItemService implements IItemWriteService {
  constructor(
    @Inject(ITEM_REPOSITORY_TOKEN) private readonly itemRepo: IItemRepository,
  ) {}

  async findById(itemId: ItemId, restaurantId: RestaurantId): Promise<ItemWithOverride> {
    const item = await this.itemRepo.findById(itemId, restaurantId);
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found for restaurant ${restaurantId}`);
    }
    return item;
  }

  async convertUom(itemId: ItemId, qty: number, fromUom: string, toUom: string): Promise<number> {
    if (fromUom === toUom) {
      return qty;
    }

    const conversion = await this.itemRepo.getUomConversion(itemId, fromUom, toUom);
    if (!conversion) {
      throw new BadRequestException(`UOM conversion not found from ${fromUom} to ${toUom} for item ${itemId}`);
    }

    return qty * conversion.multiplierFactor;
  }

  async getUomConversions(itemId: ItemId): Promise<UomConversion[]> {
    return this.itemRepo.getUomConversions(itemId);
  }

  async listParLevels(restaurantId: RestaurantId, page?: number, limit?: number): Promise<{ data: ItemWithOverride[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    return this.itemRepo.listParLevels(restaurantId, page, limit);
  }

  async createItem(
    dto: CreateItemDto,
    restaurantId: RestaurantId | null,
    franchiseGroupId: string | null,
  ): Promise<Item> {
    // Business rule: enforce item_owner_xor — exactly one owner must be set.
    // Restaurant scope takes priority when both are somehow provided.
    const resolvedRestaurantId = restaurantId ?? null;
    const resolvedFranchiseGroupId = resolvedRestaurantId ? null : (franchiseGroupId ?? null);

    if (!resolvedRestaurantId && !resolvedFranchiseGroupId) {
      throw new BadRequestException(
        'Cannot create item: authenticated user has no restaurant or franchise group context assigned.',
      );
    }

    const command: CreateItemCommand = {
      ...dto,
      restaurantId: resolvedRestaurantId,
      franchiseGroupId: resolvedFranchiseGroupId ? asFranchiseGroupId(resolvedFranchiseGroupId) : null,
    };

    return this.itemRepo.createItem(command);
  }

  async listCategories(restaurantId: RestaurantId, franchiseGroupId: string | null, itemType?: string): Promise<Category[]> {
    return this.itemRepo.listCategories(restaurantId, franchiseGroupId, itemType);
  }

  async updateItem(itemId: ItemId, dto: UpdateItemDto, trx?: unknown): Promise<Item> {
    const updated = await this.itemRepo.updateItem(itemId, dto, trx);
    if (!updated) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }
    return updated;
  }

  async createCategory(
    dto: CreateCategoryDto,
    restaurantId: RestaurantId | null,
    franchiseGroupId: string | null,
  ): Promise<Category> {
    const resolvedRestaurantId = restaurantId ?? null;
    const resolvedFranchiseGroupId = resolvedRestaurantId ? null : (franchiseGroupId ?? null);

    if (!resolvedRestaurantId && !resolvedFranchiseGroupId) {
      throw new BadRequestException(
        'Cannot create category: authenticated user has no restaurant or franchise group context assigned.',
      );
    }

    const command: CreateCategoryCommand = {
      ...dto,
      restaurantId: resolvedRestaurantId,
      franchiseGroupId: resolvedFranchiseGroupId ? asFranchiseGroupId(resolvedFranchiseGroupId) : null,
    };

    return this.itemRepo.createCategory(command);
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto): Promise<Category> {
    const updated = await this.itemRepo.updateCategory(categoryId, dto);
    if (!updated) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
    return updated;
  }

  async upsertUomConversion(dto: CreateUomConversionDto): Promise<UomConversion> {
    return this.itemRepo.upsertUomConversion(dto);
  }

  async updateOverride(itemId: ItemId, restaurantId: RestaurantId, dto: UpdateItemOverrideDto): Promise<ItemRestaurantOverride> {
    return this.itemRepo.upsertItemOverride(itemId, restaurantId, dto);
  }

  async deleteItem(itemId: ItemId, trx?: unknown): Promise<void> {
    await this.itemRepo.deleteItem(itemId, trx);
  }

  async deleteItemsBulk(itemIds: ItemId[], trx?: unknown): Promise<void> {
    await this.itemRepo.deleteItemsBulk(itemIds, trx);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.itemRepo.deleteCategory(categoryId);
  }

  async deleteCategoriesBulk(categoryIds: string[]): Promise<void> {
    await this.itemRepo.deleteCategoriesBulk(categoryIds);
  }

  async generateSku(categoryId: string): Promise<string> {
    return this.itemRepo.generateSku(categoryId);
  }

  async findBySku(sku: string, restaurantId: RestaurantId): Promise<Item | null> {
    return this.itemRepo.findBySku(sku, restaurantId);
  }

  async ensureItemDependencies(
    dto: { sku: string; name: string; categoryName: string; type: import('@ims/types').ItemType; uom?: string },
    restaurantId: RestaurantId | null,
    franchiseGroupId: string | null,
  ): Promise<string | null> {
    if (!dto.sku) return null;

    // Check if item already exists
    const resolvedRestaurantIdForLookup = restaurantId ?? ('00000000-0000-0000-0000-000000000000' as RestaurantId);
    const existingItem = await this.itemRepo.findBySku(dto.sku, resolvedRestaurantIdForLookup);
    if (existingItem) {
      return existingItem.id;
    }

    // Item does not exist, so let's get or create the category first
    let categoryId: string;
    const catName = dto.categoryName || 'General';
    
    // Check if category exists
    const categories = await this.itemRepo.listCategories(resolvedRestaurantIdForLookup, franchiseGroupId);
    const existingCategory = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    
    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const newCategory = await this.createCategory(
        { name: catName, description: `Automatically created during recipe upload` },
        restaurantId,
        franchiseGroupId
      );
      categoryId = newCategory.id;
    }

    // Now create the item
    const uomVal = dto.uom || 'unit';
    const newItem = await this.createItem(
      {
        name: dto.name || `Item ${dto.sku}`,
        sku: dto.sku,
        categoryId,
        type: dto.type,
        purchasingUom: uomVal,
        inventoryUom: uomVal,
        recipeUom: uomVal,
        invToRecipeRatio: 1.0,
        isActive: true,
        allergens: [],
        caloriesPerUom: 0,
        proteinGrams: 0,
        fatGrams: 0,
        carbsGrams: 0,
      },
      restaurantId,
      franchiseGroupId
    );

    return newItem.id;
  }
}
