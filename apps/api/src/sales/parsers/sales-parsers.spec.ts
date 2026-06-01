/* eslint-disable @typescript-eslint/no-explicit-any */
import { XlsxSalesParser } from './xlsx-sales.parser';
import { PdfSalesParser } from './pdf-sales.parser';
import * as path from 'path';

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
