import * as xlsx from 'xlsx';
import { ISalesFileParser, ParsedSalesRow } from '../interfaces/i-sales-file-parser';

export class XlsxSalesParser implements ISalesFileParser {
  async parse(filePath: string): Promise<ParsedSalesRow[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows: Record<string, string | number>[] = xlsx.utils.sheet_to_json(sheet);
    
    const parsedRows = rows
      .map(row => {
        const rawItemName = row['Názov'];
        const quantitySold = Number(row['Množstvo']);
        
        if (!rawItemName || typeof rawItemName !== 'string') return null;
        if (isNaN(quantitySold) || quantitySold <= 0) return null;
        
        return { rawItemName, quantitySold };
      })
      .filter((row): row is ParsedSalesRow => row !== null);

    if (parsedRows.length === 0) {
      throw new Error('No valid sales rows found in the uploaded XLSX file');
    }

    return parsedRows;
  }
}
