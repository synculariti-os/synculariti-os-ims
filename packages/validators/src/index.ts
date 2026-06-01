export * from './domain/sales.validator';
export * from './domain/item.validator';
export * from './domain/recipe.validator';
export * from './domain/auth.validator';
export * from './domain/procurement.validator';
export * from './domain/inventory.validator';
export * from './domain/reporting.validator';

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: any;
  }
};

