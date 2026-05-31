import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database, RestaurantId, PrepProductionLog, LEDGER_REASON_CODES } from '@ims/types';
import { CreatePrepLogDto } from '@ims/validators';
import { IPrepService } from './interfaces/i-prep.service';
import { IPrepRepository } from './interfaces/i-prep.repository';
import { ILedgerService, LEDGER_SERVICE_TOKEN } from './interfaces/i-ledger.service';
import { IRecipeService, RECIPE_SERVICE_TOKEN } from '../recipe/interfaces/i-recipe.service';

export const PREP_REPOSITORY_TOKEN = Symbol('IPrepRepository');

@Injectable()
export class PrepService implements IPrepService {
  constructor(
    @Inject('DB_CLIENT') private readonly db: Kysely<Database>,
    @Inject(PREP_REPOSITORY_TOKEN) private readonly prepRepo: IPrepRepository,
    @Inject(LEDGER_SERVICE_TOKEN) private readonly ledgerService: ILedgerService,
    @Inject(RECIPE_SERVICE_TOKEN) private readonly recipeService: IRecipeService,
  ) {}

  async logPrepProduction(restaurantId: RestaurantId, dto: CreatePrepLogDto): Promise<PrepProductionLog> {
    // 1. Get the recipe for this prep item
    const recipe = await this.recipeService.getRecipeByProducesItemId(dto.prepItemId);
    if (!recipe) {
      throw new NotFoundException(`No recipe found that produces item ${dto.prepItemId}`);
    }

    // 2. Expand BOM based on yield produced
    // The recipe yieldQuantity corresponds to what the ingredients produce. 
    // Wait, expandBOM scales ingredients based on the requested produced quantity.
    const consumedIngredients = await this.recipeService.expandBOM(recipe.id, dto.yieldQtyProduced);

    return this.db.transaction().execute(async (trx) => {
      // 3. Create the prep log
      const log = await this.prepRepo.createPrepLog(trx, restaurantId, dto);
      
      // 4. Record yield (+ qty)
      await this.ledgerService.record(trx, {
        restaurantId,
        itemId: dto.prepItemId as any,
        changeAmount: dto.yieldQtyProduced,
        reasonCode: LEDGER_REASON_CODES.PREP_PRODUCTION,
        referenceId: log.id,
      });

      // 5. Record consumption (- qty) for each ingredient
      for (const ing of consumedIngredients) {
        await this.ledgerService.record(trx, {
          restaurantId,
          itemId: ing.itemId as any,
          changeAmount: -ing.consumedQty,
          reasonCode: LEDGER_REASON_CODES.PREP_CONSUMPTION,
          referenceId: log.id,
        });
      }
      
      return log;
    });
  }

  async listPrepLogs(restaurantId: RestaurantId, limit: number = 50, offset: number = 0): Promise<PrepProductionLog[]> {
    return this.prepRepo.listPrepLogs(restaurantId, limit, offset);
  }
}
