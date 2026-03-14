export interface DataRow {
  [key: string]: string | number | null;
}

export interface ParsedData {
  headers: string[];
  rows: DataRow[];
  numericColumns: string[];
  categoricalColumns: string[];
  sheetName: string;
}

export interface Insight {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area';
  title: string;
  description: string;
  xLabel?: string;
  yLabel?: string;
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  borderWidth?: number;
}

export type ProcessingStep =
  | 'upload'
  | 'parsing'
  | 'detecting'
  | 'insights'
  | 'building'
  | 'done';
