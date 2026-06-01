import { Inject, Injectable } from '@nestjs/common';
import { IReportingCogsService } from './interfaces/i-reporting-cogs.service';
import { RECIPE_SERVICE_TOKEN } from '../recipe/interfaces/i-recipe.service';
import { PROCUREMENT_READ_SERVICE_TOKEN } from '../procurement/interfaces/i-procurement-read.service';
import { IRecipeService } from '../recipe/interfaces/i-recipe.service';
import { IProcurementReadService } from '../procurement/interfaces/i-procurement-read.service';
import { IItemReadService } from '../item/interfaces/i-item.service';
import { ITEM_READ_SERVICE_TOKEN } from '../item/interfaces/i-item.service';
import { RestaurantId, MenuItemCostReport, CostReportIngredient } from '@ims/types';

@Injectable()
export class ReportingCogsService implements IReportingCogsService {
  constructor(
    @Inject(RECIPE_SERVICE_TOKEN)
    private readonly recipeService: IRecipeService,
    @Inject(PROCUREMENT_READ_SERVICE_TOKEN)
    private readonly procurementReadService: IProcurementReadService,
    @Inject(ITEM_READ_SERVICE_TOKEN)
    private readonly itemReadService: IItemReadService,
  ) {}

  async getMenuCostingReport(restaurantId: RestaurantId): Promise<MenuItemCostReport[]> {
    const recipes = await this.recipeService.listMenuRecipes(restaurantId);
    if (!recipes.length) {
      return [];
    }

    const averageCosts = await this.procurementReadService.getAverageUnitCosts(restaurantId);

    const reports: MenuItemCostReport[] = [];

    for (const recipe of recipes) {
      const bom = await this.recipeService.expandBOM(recipe.id, 1);
      
      const ingredients: CostReportIngredient[] = await Promise.all(bom.map(async line => {
        const unitCost = averageCosts[line.itemId] || 0;
        const totalCost = unitCost * line.consumedQty;
        const item = await this.itemReadService.findById(line.itemId, restaurantId);

        return {
          itemId: line.itemId,
          itemName: item.name,
          qty: line.consumedQty,
          uom: item.inventoryUom,
          unitCost,
          totalCost,
        };
      }));

      const totalRecipeCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);

      reports.push({
        recipeId: recipe.id,
        recipeName: recipe.recipeName || 'Unknown Recipe',
        totalCost: totalRecipeCost,
        ingredients,
      });
    }

    return reports;
  }
}
