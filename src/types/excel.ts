export type ExcelStyleCategory =
  | 'financial'
  | 'educational'
  | 'business'
  | 'inventory'
  | 'dashboard'
  | 'project'
  | 'analytical'
  | 'minimal';

export type ExcelColumnFormat =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'status';

export interface ExcelColumnSpec {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: ExcelColumnFormat;
}

export interface ExcelCellData {
  value: string | number;
  formula?: string; // e.g. "=SUM(D2:D8)" or "=C2*D2"
  format?: ExcelColumnFormat;
  bold?: boolean;
  highlight?: 'emerald' | 'rose' | 'amber' | 'blue' | null;
}

export interface ExcelRowData {
  id: string;
  isSummaryRow?: boolean;
  cells: Record<string, ExcelCellData>;
}

export interface ExcelChartSpec {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'column';
  sheetName: string;
  labelColumnKey: string;
  valueColumnKeys: string[];
}

export interface ExcelConditionalRule {
  columnKey: string;
  operator: 'lt' | 'gt' | 'eq' | 'contains';
  targetValue: number | string;
  color: 'rose' | 'emerald' | 'amber';
  label: string;
}

export interface ExcelSheetData {
  id: string;
  name: string;
  columns: ExcelColumnSpec[];
  rows: ExcelRowData[];
  freezeHeader?: boolean;
  conditionalRules?: ExcelConditionalRule[];
}

export interface ExcelThemePalette {
  id: ExcelStyleCategory;
  name: string;
  headerBg: string;
  headerText: string;
  accentHex: string;
  secondaryHex: string;
  summaryRowBg: string;
  borderHex: string;
}

export interface ExcelWorkbookData {
  id: string;
  title: string;
  subtitle: string;
  topic: string;
  styleCategory: ExcelStyleCategory;
  palette: ExcelThemePalette;
  currencySymbol: string;
  sheets: ExcelSheetData[];
  charts: ExcelChartSpec[];
  createdAt: string;
}
