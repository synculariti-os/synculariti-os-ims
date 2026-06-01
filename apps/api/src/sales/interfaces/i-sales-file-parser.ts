export const SALES_FILE_PARSER_FACTORY_TOKEN = 'SALES_FILE_PARSER_FACTORY_TOKEN';

export interface ParsedSalesRow {
  rawItemName: string;
  quantitySold: number;
}

export interface ISalesFileParser {
  parse(filePath: string): Promise<ParsedSalesRow[]>;
}

export interface ISalesFileParserFactory {
  getParser(extension: string): ISalesFileParser;
}
