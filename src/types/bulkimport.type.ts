export type BulkImportColumnFormat =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'email'
  | 'select';

export interface BulkImportColumn {
  order: number;
  name: string;
  label: string;
  required?: boolean;
  format: BulkImportColumnFormat;
  options?: Record<string, any>;
  example?: string;
  instructions?: string[];
  mappedHeader?: string;
  validate?: (value: any) => string | boolean;
}

export interface BulkImportConfig {
  columns: BulkImportColumn[];
  allowPartialImport?: boolean;
}

export interface MapperData {
  extractedColumns: string[];
  columns: BulkImportColumn[];
  data: Record<string, any>[];
}

export interface ClientBulkImportRow {
  name: string;
  mobile?: string;
  email?: string;
}
