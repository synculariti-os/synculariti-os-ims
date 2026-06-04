import { describe, it, expect } from 'vitest';
import { XlsxSalesParser } from '../parsers/xlsx-sales.parser';
import { PdfSalesParser } from '../parsers/pdf-sales.parser';


describe('Sales Parsers', () => {
  describe('XlsxSalesParser', () => {
    it('should be defined', () => {
      expect(new XlsxSalesParser()).toBeDefined();
    });
  });

  describe('PdfSalesParser', () => {
    it('should be defined', () => {
      expect(new PdfSalesParser()).toBeDefined();
    });
  });
});
