// Green-themed color palette
export const COLORS = {
  primary: '#10b981',      // emerald-500
  primaryDark: '#059669',  // emerald-600
  primaryLight: '#34d399', // emerald-400
  accent1: '#6ee7b7',      // emerald-300
  accent2: '#a7f3d0',      // emerald-200
  teal: '#14b8a6',
  cyan: '#06b6d4',
  lime: '#84cc16',
  green: '#22c55e',
  sky: '#38bdf8',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
};

export const CHART_COLORS = [
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#22c55e',
  '#84cc16',
  '#38bdf8',
  '#6ee7b7',
  '#a7f3d0',
  '#059669',
  '#0d9488',
];

export const CHART_COLORS_ALPHA = CHART_COLORS.map((c) => `${c}99`);

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function getChartColorAlpha(index: number): string {
  return CHART_COLORS_ALPHA[index % CHART_COLORS_ALPHA.length];
}
