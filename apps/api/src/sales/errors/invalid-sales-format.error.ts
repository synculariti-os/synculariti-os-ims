export class InvalidSalesFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSalesFormatError';
  }
}
