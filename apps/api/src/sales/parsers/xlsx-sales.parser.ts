import * as xlsx from 'xlsx';
import { ISalesFileParser, ParsedSalesRow } from '../interfaces/i-sales-file-parser';
import { InvalidSalesFormatError } from '../errors/invalid-sales-format.error';

export class XlsxSalesParser implements ISalesFileParser {
  async parse(filePath: string): Promise<ParsedSalesRow[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows: Record<string, string | number>[] = xlsx.utils.sheet_to_json(sheet);
    
    if (rows.length === 0) {
      throw new InvalidSalesFormatError('The uploaded XLSX file is empty.');
    }

    // Pre-flight validation: check for expected headers
    const firstRow = rows[0];
    if (!('Názov' in firstRow) || !('Množstvo' in firstRow) || !('PLU' in firstRow)) {
      throw new InvalidSalesFormatError('Invalid XLSX format: Missing required headers (PLU, Názov, Množstvo). This does not appear to be a valid "Prehľad predaja" export.');
    }

    const parsedRows = rows
      .map(row => {
        const rawItemName = row['Názov'];
        const quantitySold = Number(row['Množstvo']);
        
        if (!rawItemName || typeof rawItemName !== 'string') return null;
        if (isNaN(quantitySold) || quantitySold < 0) return null;
        
        return { rawItemName, quantitySold };
      })
      .filter((row): row is ParsedSalesRow => row !== null);

    if (parsedRows.length === 0) {
      throw new Error('No valid sales rows found in the uploaded XLSX file');
    }

    return parsedRows;
  }
}
