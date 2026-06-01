import { Injectable } from '@nestjs/common';
import { ISalesFileParser, ISalesFileParserFactory } from '../interfaces/i-sales-file-parser';
import { XlsxSalesParser } from './xlsx-sales.parser';
import { PdfSalesParser } from './pdf-sales.parser';

@Injectable()
export class SalesParserFactory implements ISalesFileParserFactory {
  getParser(extension: string): ISalesFileParser {
    const ext = extension.toLowerCase().replace('.', '');
    
    switch (ext) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        // For CSV, XLSX sheet_to_json handles it if parsed correctly by xlsx.readFile
        return new XlsxSalesParser();
      case 'pdf':
        return new PdfSalesParser();
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }
}
