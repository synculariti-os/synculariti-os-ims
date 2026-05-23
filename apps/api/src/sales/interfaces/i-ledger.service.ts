export const LEDGER_SERVICE_TOKEN = Symbol('LEDGER_SERVICE_TOKEN');

export interface ILedgerService {
  record(trx: any, entry: {
    restaurantId: string;
    itemId: string;
    changeAmount: number;
    reasonCode: 'SALES_DEPLETION' | 'PO_RECEIPT' | 'WASTE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'COUNT_ADJUSTMENT' | 'PREP_PRODUCTION' | 'PREP_CONSUMPTION';
    referenceId?: string;
  }): Promise<void>;
}
