import { Inject, Injectable } from '@nestjs/common';
import { IProcurementReadService } from './interfaces/i-procurement-read.service';
import { PROCUREMENT_REPOSITORY_TOKEN } from './procurement.service';
import { IProcurementRepository } from './interfaces/i-procurement.repository';
import { RestaurantId, VendorPriceHistoryRow } from '@ims/types';

@Injectable()
export class ProcurementReadService implements IProcurementReadService {
  constructor(
    @Inject(PROCUREMENT_REPOSITORY_TOKEN)
    private readonly procurementRepo: IProcurementRepository,
  ) {}

  async getAverageUnitCosts(restaurantId: RestaurantId): Promise<Record<string, number>> {
    // Requires expanding IProcurementRepository to have getAverageUnitCosts
    return this.procurementRepo.getAverageUnitCosts(restaurantId);
  }

  async getVendorPriceHistory(restaurantId: RestaurantId, itemId: string): Promise<VendorPriceHistoryRow[]> {
    return this.procurementRepo.getVendorPriceHistory(restaurantId, itemId);
  }
}
