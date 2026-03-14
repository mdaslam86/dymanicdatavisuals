import {
  Chart,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  ScatterController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title,
  type ChartConfiguration,
} from 'chart.js';

import type { ChartConfig, Insight } from './types';
import { formatNumber } from './dataParser';

// Register all needed Chart.js components
Chart.register(
  BarController,
  LineController,
  PieController,
  DoughnutController,
  ScatterController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  Title
);

// Global chart defaults
Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 16;

const activeCharts = new Map<string, Chart>();

export function destroyAllCharts(): void {
  activeCharts.forEach((chart) => chart.destroy());
  activeCharts.clear();
}

export function createInsightCards(insights: Insight[]): string {
  return insights
    .map(
      (ins, i) => `
    <div class="insight-card" style="animation-delay: ${i * 80}ms">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-body">
        <div class="insight-title">${ins.title}</div>
        <div class="insight-value">${ins.value}</div>
        <div class="insight-subtitle">${ins.subtitle}</div>
      </div>
      ${
        ins.trend
          ? `<div class="insight-trend insight-trend--${ins.trend}">
          ${ins.trend === 'up' ? '↑' : ins.trend === 'down' ? '↓' : '—'}
          ${ins.trendValue ?? ''}
        </div>`
          : ''
      }
    </div>
  `
    )
    .join('');
}

export function renderChart(canvasId: string, config: ChartConfig): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  // Destroy existing chart on this canvas
  if (activeCharts.has(canvasId)) {
    activeCharts.get(canvasId)!.destroy();
    activeCharts.delete(canvasId);
  }

  const chartType = config.type === 'area' ? 'line' : config.type;

  const chartConfig: ChartConfiguration = {
    type: chartType as ChartConfiguration['type'],
    data: {
      labels: config.labels,
      datasets: config.datasets as ChartConfiguration['data']['datasets'],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: 'easeInOutQuart',
      },
      plugins: {
        legend: {
          display: config.datasets.length > 1 || config.type === 'doughnut' || config.type === 'pie',
          position: 'bottom',
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#e2e8f0',
          bodyColor: '#cbd5e1',
          borderColor: '#10b981',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed?.y ?? ctx.parsed;
              if (typeof val === 'number') {
                return ` ${ctx.dataset.label}: ${formatNumber(val)}`;
              }
              return String(ctx.formattedValue);
            },
          },
        },
      },
      scales:
        config.type === 'pie' || config.type === 'doughnut'
          ? {}
          : config.type === 'scatter'
          ? {
              x: {
                title: {
                  display: !!config.xLabel,
                  text: config.xLabel ?? '',
                  color: '#64748b',
                  font: { size: 11 },
                },
                grid: { color: 'rgba(0,0,0,0.05)' },
              },
              y: {
                title: {
                  display: !!config.yLabel,
                  text: config.yLabel ?? '',
                  color: '#64748b',
                  font: { size: 11 },
                },
                grid: { color: 'rgba(0,0,0,0.05)' },
              },
            }
          : {
              x: {
                title: {
                  display: !!config.xLabel,
                  text: config.xLabel ?? '',
                  color: '#64748b',
                  font: { size: 11 },
                },
                grid: { color: 'rgba(0,0,0,0.04)' },
                ticks: {
                  maxRotation: 40,
                  font: { size: 10 },
                  maxTicksLimit: 15,
                },
              },
              y: {
                title: {
                  display: !!config.yLabel,
                  text: config.yLabel ?? '',
                  color: '#64748b',
                  font: { size: 11 },
                },
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                  font: { size: 10 },
                  callback: (val) =>
                    typeof val === 'number' ? formatNumber(val) : val,
                },
              },
            },
    },
  };

  const chart = new Chart(canvas, chartConfig);
  activeCharts.set(canvasId, chart);
}

export function createDashboardHTML(
  insights: Insight[],
  charts: ChartConfig[],
  sheetName: string,
  totalRows: number,
  headers: string[]
): string {
  const insightCards = createInsightCards(insights);

  const chartWidgets = charts
    .map(
      (chart, i) => `
    <div class="chart-card ${chart.type === 'doughnut' || chart.type === 'pie' ? 'chart-card--small' : ''}" style="animation-delay: ${i * 100}ms">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-card-title">${chart.title}</h3>
          <p class="chart-card-desc">${chart.description}</p>
        </div>
        <span class="chart-badge chart-badge--${chart.type}">${chart.type}</span>
      </div>
      <div class="chart-canvas-wrap">
        <canvas id="chart-${i}"></canvas>
      </div>
    </div>
  `
    )
    .join('');

  const filterOptions = headers
    .map((h) => `<option value="${h}">${h}</option>`)
    .join('');

  return `
    <div id="dashboard" class="dashboard">
      <header class="dashboard-header">
        <div class="dashboard-header-left">
          <div class="dashboard-logo">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#10b981"/>
              <rect x="6" y="25" width="7" height="10" rx="1.5" fill="white"/>
              <rect x="16" y="16" width="7" height="19" rx="1.5" fill="white"/>
              <rect x="27" y="8" width="7" height="27" rx="1.5" fill="white"/>
              <polyline points="9.5,22 19.5,12 30.5,6" stroke="#d1fae5" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 class="dashboard-title">DataVision</h1>
            <p class="dashboard-dataset">
              <span class="dataset-badge">📋 ${sheetName}</span>
              <span class="dataset-rows">${totalRows.toLocaleString()} records · ${headers.length} columns</span>
            </p>
          </div>
        </div>
        <div class="dashboard-header-right">
          <button class="btn-icon" id="btn-new-upload" title="Upload new file">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 14V6M10 6L6 10M10 6L14 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 16h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            New Upload
          </button>
        </div>
      </header>

      <div class="dashboard-controls">
        <div class="controls-inner">
          <label class="control-label">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="currentColor" stroke-width="2"/><path d="M15 15l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Filter by Column:
          </label>
          <select id="filter-column" class="filter-select">
            <option value="">— All Columns —</option>
            ${filterOptions}
          </select>
          <input type="text" id="filter-value" class="filter-input" placeholder="Search value..." />
          <span id="filter-count" class="filter-count">${totalRows.toLocaleString()} rows</span>
        </div>
      </div>

      <section class="insights-section">
        <h2 class="section-title">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.39 4.84L18 8.61l-4 3.9.94 5.49L10 15.27l-4.94 2.73L6 12.51 2 8.61l5.61-1.77L10 2z" fill="#10b981"/></svg>
          Key Insights
        </h2>
        <div class="insights-grid">
          ${insightCards}
        </div>
      </section>

      <section class="charts-section">
        <h2 class="section-title">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="10" width="4" height="8" rx="1" fill="#10b981"/><rect x="8" y="6" width="4" height="12" rx="1" fill="#10b981"/><rect x="14" y="2" width="4" height="16" rx="1" fill="#10b981"/></svg>
          Visualizations
        </h2>
        <div class="charts-grid">
          ${chartWidgets}
        </div>
      </section>

      <footer class="dashboard-footer">
        <p>DataVision · All processing happens locally in your browser · No data is uploaded to any server</p>
      </footer>
    </div>
  `;
}
