import * as fs from 'fs';
const pdfParse = require('pdf-parse');
import { ISalesFileParser, ParsedSalesRow } from '../interfaces/i-sales-file-parser';

export class PdfSalesParser implements ISalesFileParser {
  async parse(filePath: string): Promise<ParsedSalesRow[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const lines = data.text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    const parsedRows: ParsedSalesRow[] = [];

    // The line format: [Optional Category] [Product Name] [Počet] [Množstvo] [Prices...]
    // We want to capture everything before the first standalone integer as rawItemName
    // and the SECOND standalone integer as quantitySold.
    // Example: "Double Blue heaven double 7 8 12,37 € 12,99 € 98,96 € 103,92 € 0,00 €"
    // -> rawItemName: "Double Blue heaven double", quantitySold: 8

    // Regex explanation:
    // ^(.+?)\s+                -> Capture group 1: item name (non-greedy, at least 1 char) followed by whitespace
    // (\d+)\s+                 -> Capture group 2: first standalone integer (receipts count)
    // (\d+)\s+                 -> Capture group 3: second standalone integer (quantity sold)
    // ([\d,]+\s*€.*)$          -> Capture group 4: price section (starts with number/comma, space, Euro sign)
    const lineRegex = /^(.+?)\s+(\d+)\s+(\d+)\s+([\d,]+\s*€.*)$/;

    for (const line of lines) {
      const match = line.match(lineRegex);
      if (match) {
        let rawItemName = match[1].trim();
        const quantitySold = Number(match[3]);

        if (rawItemName && !isNaN(quantitySold) && quantitySold >= 0) {
          // Some products might have category prefixed, but POS mappings handle it.
          parsedRows.push({ rawItemName, quantitySold });
        }
      }
    }

    if (parsedRows.length === 0) {
      throw new Error('No valid sales rows found in the uploaded PDF file');
    }

    return parsedRows;
  }
}
