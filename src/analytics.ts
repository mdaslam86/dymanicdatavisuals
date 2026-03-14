import type { ParsedData, Insight, ChartConfig } from './types';
import {
  getColumnStats,
  getTopCategoriesByValue,
  formatNumber,
  formatColumnName,
} from './dataParser';
import { CHART_COLORS, getChartColor, getChartColorAlpha } from './colors';

export function generateInsights(data: ParsedData): Insight[] {
  const insights: Insight[] = [];

  // Total rows
  insights.push({
    title: 'Total Records',
    value: data.rows.length.toLocaleString(),
    subtitle: `Across ${data.headers.length} columns`,
    icon: '📊',
    trend: 'neutral',
  });

  // Numeric column summaries (top 3)
  const topNumeric = data.numericColumns.slice(0, 3);
  for (const col of topNumeric) {
    const stats = getColumnStats(data.rows, col);
    if (stats.count === 0) continue;
    insights.push({
      title: `Total ${formatColumnName(col)}`,
      value: formatNumber(stats.sum),
      subtitle: `Avg: ${formatNumber(stats.avg)} · Max: ${formatNumber(stats.max)}`,
      icon: '📈',
      trend: 'up',
      trendValue: `Max ${formatNumber(stats.max)}`,
    });
  }

  // Unique categories for first categorical column
  if (data.categoricalColumns.length > 0) {
    const catCol = data.categoricalColumns[0];
    const uniqueVals = new Set(data.rows.map((r) => r[catCol]));
    insights.push({
      title: `Unique ${formatColumnName(catCol)}`,
      value: uniqueVals.size.toLocaleString(),
      subtitle: `Distinct categories`,
      icon: '🏷️',
      trend: 'neutral',
    });
  }

  // Data completeness
  const totalCells = data.rows.length * data.headers.length;
  const nullCells = data.rows.reduce(
    (acc, row) => acc + data.headers.filter((h) => row[h] === null).length,
    0
  );
  const completeness = ((totalCells - nullCells) / totalCells) * 100;
  insights.push({
    title: 'Data Completeness',
    value: `${completeness.toFixed(1)}%`,
    subtitle: `${nullCells} empty cells found`,
    icon: '✅',
    trend: completeness > 90 ? 'up' : 'down',
  });

  return insights;
}

export function generateCharts(data: ParsedData): ChartConfig[] {
  const charts: ChartConfig[] = [];

  const { numericColumns, categoricalColumns, rows } = data;

  if (numericColumns.length === 0) return charts;

  const primaryNumCol = numericColumns[0];
  const primaryCatCol = categoricalColumns[0] ?? data.headers[0];

  // 1. Bar chart – top categories by first numeric column
  {
    const { labels, values } = getTopCategoriesByValue(
      rows,
      primaryCatCol,
      primaryNumCol,
      12
    );
    if (labels.length > 0) {
      charts.push({
        type: 'bar',
        title: `${formatColumnName(primaryNumCol)} by ${formatColumnName(primaryCatCol)}`,
        description: `Comparing ${formatColumnName(primaryNumCol)} across different ${formatColumnName(primaryCatCol)} categories`,
        xLabel: formatColumnName(primaryCatCol),
        yLabel: formatColumnName(primaryNumCol),
        labels,
        datasets: [
          {
            label: formatColumnName(primaryNumCol),
            data: values,
            backgroundColor: labels.map((_, i) => getChartColorAlpha(i)),
            borderColor: labels.map((_, i) => getChartColor(i)),
            borderWidth: 2,
          },
        ],
      });
    }
  }

  // 2. Line chart – numeric columns over index (or date/order column)
  if (numericColumns.length >= 1) {
    const lineNumCols = numericColumns.slice(0, 3);
    const lineLabels = rows.map((r, i) => {
      if (categoricalColumns.length > 0) {
        return String(r[categoricalColumns[0]] ?? i + 1);
      }
      return String(i + 1);
    });
    const truncatedLabels =
      lineLabels.length > 30
        ? lineLabels.filter((_, i) => i % Math.ceil(lineLabels.length / 30) === 0)
        : lineLabels;
    const sampleRows =
      rows.length > 30
        ? rows.filter((_, i) => i % Math.ceil(rows.length / 30) === 0)
        : rows;

    charts.push({
      type: 'line',
      title: `Trend Analysis — ${lineNumCols.map(formatColumnName).join(', ')}`,
      description: `Line trends for numeric metrics across the dataset`,
      labels: truncatedLabels.slice(0, sampleRows.length),
      datasets: lineNumCols.map((col, i) => ({
        label: formatColumnName(col),
        data: sampleRows
          .map((r) => (typeof r[col] === 'number' ? (r[col] as number) : 0))
          .slice(0, truncatedLabels.length),
        backgroundColor: getChartColorAlpha(i),
        borderColor: getChartColor(i),
        borderWidth: 2.5,
        tension: 0.4,
        fill: false,
        pointRadius: sampleRows.length <= 20 ? 4 : 2,
      })),
    });
  }

  // 3. Pie / Doughnut chart – distribution of first categorical column
  if (categoricalColumns.length > 0) {
    const catCol = categoricalColumns[0];
    const valueCol = primaryNumCol;
    const { labels, values } = getTopCategoriesByValue(rows, catCol, valueCol, 8);

    if (labels.length > 1) {
      charts.push({
        type: 'doughnut',
        title: `${formatColumnName(valueCol)} Distribution by ${formatColumnName(catCol)}`,
        description: `Proportional breakdown of ${formatColumnName(valueCol)} across ${formatColumnName(catCol)}`,
        labels,
        datasets: [
          {
            label: formatColumnName(valueCol),
            data: values,
            backgroundColor: CHART_COLORS.slice(0, labels.length),
            borderColor: '#ffffff',
            borderWidth: 3,
          },
        ],
      });
    }
  }

  // 4. Area chart – second numeric column if available
  if (numericColumns.length >= 2) {
    const areaCol = numericColumns[1];
    const sampleRows =
      rows.length > 40
        ? rows.filter((_, i) => i % Math.ceil(rows.length / 40) === 0)
        : rows;
    const areaLabels = sampleRows.map((r, i) => {
      if (categoricalColumns.length > 0) {
        return String(r[categoricalColumns[0]] ?? i + 1);
      }
      return String(i + 1);
    });

    charts.push({
      type: 'area',
      title: `${formatColumnName(areaCol)} Area Trend`,
      description: `Area chart showing the spread and trend of ${formatColumnName(areaCol)}`,
      labels: areaLabels,
      datasets: [
        {
          label: formatColumnName(areaCol),
          data: sampleRows.map((r) =>
            typeof r[areaCol] === 'number' ? (r[areaCol] as number) : 0
          ),
          backgroundColor: getChartColorAlpha(3),
          borderColor: getChartColor(3),
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }

  // 5. Scatter plot – two numeric columns
  if (numericColumns.length >= 2) {
    const xCol = numericColumns[0];
    const yCol = numericColumns[1];
    const sampleRows =
      rows.length > 100
        ? rows.filter((_, i) => i % Math.ceil(rows.length / 100) === 0)
        : rows;

    charts.push({
      type: 'scatter',
      title: `${formatColumnName(xCol)} vs ${formatColumnName(yCol)}`,
      description: `Correlation scatter plot between ${formatColumnName(xCol)} and ${formatColumnName(yCol)}`,
      xLabel: formatColumnName(xCol),
      yLabel: formatColumnName(yCol),
      labels: [],
      datasets: [
        {
          label: `${formatColumnName(xCol)} vs ${formatColumnName(yCol)}`,
          data: sampleRows
            .filter(
              (r) =>
                typeof r[xCol] === 'number' && typeof r[yCol] === 'number'
            )
            .map((r) => ({ x: r[xCol] as number, y: r[yCol] as number })) as unknown as number[],
          backgroundColor: getChartColorAlpha(0),
          borderColor: getChartColor(0),
          borderWidth: 1,
          pointRadius: 5,
        },
      ],
    });
  }

  // 6. Horizontal bar – if we have many categories, show a ranked bar
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const catCol =
      categoricalColumns.length > 1
        ? categoricalColumns[1]
        : categoricalColumns[0];
    const valCol =
      numericColumns.length > 1 ? numericColumns[1] : numericColumns[0];
    const { labels, values } = getTopCategoriesByValue(rows, catCol, valCol, 10);

    if (labels.length > 1 && (catCol !== primaryCatCol || valCol !== primaryNumCol)) {
      charts.push({
        type: 'bar',
        title: `Top 10 — ${formatColumnName(valCol)} by ${formatColumnName(catCol)}`,
        description: `Ranked comparison of the top 10 ${formatColumnName(catCol)} by ${formatColumnName(valCol)}`,
        xLabel: formatColumnName(valCol),
        yLabel: formatColumnName(catCol),
        labels,
        datasets: [
          {
            label: formatColumnName(valCol),
            data: values,
            backgroundColor: CHART_COLORS.slice(0, labels.length).map(
              (c) => `${c}bb`
            ),
            borderColor: CHART_COLORS.slice(0, labels.length),
            borderWidth: 2,
          },
        ],
      });
    }
  }

  return charts;
}
