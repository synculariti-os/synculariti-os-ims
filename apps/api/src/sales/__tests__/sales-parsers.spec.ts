// @immutable-test
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { XlsxSalesParser } from '../parsers/xlsx-sales.parser';
import { PdfSalesParser } from '../parsers/pdf-sales.parser';
import { InvalidSalesFormatError } from '../errors/invalid-sales-format.error';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import pdfParse from 'pdf-parse';

vi.mock('xlsx', () => {
  return {
    readFile: vi.fn(),
    utils: {
      sheet_to_json: vi.fn(),
    },
  };
});

vi.mock('fs', () => {
  return {
    readFileSync: vi.fn(),
  };
});

vi.mock('pdf-parse', () => {
  return {
    default: vi.fn(),
  };
});

describe('Sales Parsers Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('XlsxSalesParser', () => {
    it('should throw InvalidSalesFormatError if required headers are missing', async () => {
      const parser = new XlsxSalesParser();
      // Mock workbook and sheet
      (xlsx.readFile as any).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      // Mock sheet_to_json to return invalid data
      (xlsx.utils.sheet_to_json as any).mockReturnValue([
        { RandomHeader: 'Data', Amount: 5 }, // Missing PLU, Názov, Množstvo
      ]);

      await expect(parser.parse('dummy.xlsx')).rejects.toThrow(InvalidSalesFormatError);
      await expect(parser.parse('dummy.xlsx')).rejects.toThrow(/Missing required headers/);
    });

    it('should pass validation if headers exist', async () => {
      const parser = new XlsxSalesParser();
      (xlsx.readFile as any).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (xlsx.utils.sheet_to_json as any).mockReturnValue([
        { PLU: '123', Názov: 'Pizza', Množstvo: 1, 'Cena celkom': 10 },
      ]);

      const result = await parser.parse('dummy.xlsx');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ rawItemName: 'Pizza', quantitySold: 1 });
    });
  });

  describe('PdfSalesParser', () => {
    it('should throw InvalidSalesFormatError if expected keyword is missing', async () => {
      const parser = new PdfSalesParser();
      (fs.readFileSync as any).mockReturnValue(Buffer.from('dummy data'));
      (pdfParse as any).mockResolvedValue({ text: 'Some random restaurant receipt without the required keyword' });

      await expect(parser.parse('dummy.pdf')).rejects.toThrow(InvalidSalesFormatError);
    });

    it('should pass validation if expected keyword exists', async () => {
      const parser = new PdfSalesParser();
      (fs.readFileSync as any).mockReturnValue(Buffer.from('dummy data'));
      (pdfParse as any).mockResolvedValue({ 
        text: 'Tržby podľa produktov\nSome Item   1   5   10,00 €'
      });

      const result = await parser.parse('dummy.pdf');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ rawItemName: 'Some Item', quantitySold: 5 });
    });
  });
});

