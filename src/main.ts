import './style.css';
import { createWizardHTML, STEPS } from './wizard';
import { parseExcelFile, formatNumber } from './dataParser';
import { generateInsights, generateCharts } from './analytics';
import { createDashboardHTML, renderChart, destroyAllCharts } from './dashboard';
import type { ParsedData } from './types';

let parsedData: ParsedData | null = null;
let selectedFile: File | null = null;

function getEl<T extends Element>(id: string): T {
  return document.getElementById(id) as unknown as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runProcessingWizard(file: File): Promise<void> {
  const uploadScreen = getEl<HTMLElement>('upload-screen');
  const processingScreen = getEl<HTMLElement>('processing-screen');

  uploadScreen.classList.remove('active');
  uploadScreen.classList.add('hidden');
  processingScreen.classList.remove('hidden');
  processingScreen.classList.add('active');

  const stepIds = STEPS.slice(1).map((s) => s.id);
  let progress = 0;

  async function activateStep(stepId: string, stepProgress: number): Promise<void> {
    const stepEl = getEl<HTMLElement>(`step-${stepId}`);
    const spinner = stepEl.querySelector('.step-spinner') as HTMLElement;
    const check = stepEl.querySelector('.step-check') as HTMLElement;
    const icon = stepEl.querySelector('.step-icon') as HTMLElement;
    const statusEl = getEl<HTMLElement>(`step-status-${stepId}`);

    stepEl.classList.add('step-active');
    icon.classList.add('hidden');
    spinner.classList.remove('hidden');
    statusEl.textContent = 'Processing…';

    // Update progress bar smoothly
    const targetProgress = stepProgress;
    const startProgress = progress;
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      progress = startProgress + (targetProgress - startProgress) * (i / steps);
      updateProgress(progress);
      await delay(30);
    }

    await delay(600 + Math.random() * 400);

    spinner.classList.add('hidden');
    icon.classList.remove('hidden');
    check.classList.remove('hidden');
    stepEl.classList.remove('step-active');
    stepEl.classList.add('step-done');
    statusEl.textContent = 'Done';
  }

  function updateProgress(pct: number): void {
    const fill = getEl<HTMLElement>('progress-fill');
    const label = getEl<HTMLElement>('progress-label');
    fill.style.width = `${pct.toFixed(0)}%`;
    label.textContent = `${pct.toFixed(0)}%`;
  }

  // Step 1: Parsing
  await activateStep(stepIds[0], 25);
  parsedData = await parseExcelFile(file);

  // Step 2: Detecting metrics
  await activateStep(stepIds[1], 50);
  await delay(400);

  // Step 3: Generating insights
  await activateStep(stepIds[2], 75);
  await delay(300);

  // Step 4: Building visualizations
  await activateStep(stepIds[3], 100);
  await delay(400);

  updateProgress(100);
  await delay(300);
}

function renderDashboard(): void {
  if (!parsedData) return;

  const insights = generateInsights(parsedData);
  const charts = generateCharts(parsedData);

  const app = document.getElementById('app')!;
  destroyAllCharts();

  app.innerHTML = createDashboardHTML(
    insights,
    charts,
    parsedData.sheetName,
    parsedData.rows.length,
    parsedData.headers
  );

  // Render all charts after DOM is set
  requestAnimationFrame(() => {
    charts.forEach((config, i) => {
      renderChart(`chart-${i}`, config);
    });
  });

  // Wire up new upload button
  getEl<HTMLButtonElement>('btn-new-upload').addEventListener('click', () => {
    destroyAllCharts();
    parsedData = null;
    selectedFile = null;
    initApp();
  });

  // Wire up filters
  const filterColumn = getEl<HTMLSelectElement>('filter-column');
  const filterValue = getEl<HTMLInputElement>('filter-value');
  const filterCount = getEl<HTMLElement>('filter-count');

  function applyFilter(): void {
    if (!parsedData) return;
    const col = filterColumn.value;
    const val = filterValue.value.toLowerCase().trim();

    if (!col || !val) {
      filterCount.textContent = `${parsedData.rows.length.toLocaleString()} rows`;
      return;
    }

    const matched = parsedData.rows.filter((row) => {
      const cell = row[col];
      if (cell === null) return false;
      return String(cell).toLowerCase().includes(val);
    });

    filterCount.textContent = `${matched.length.toLocaleString()} / ${parsedData.rows.length.toLocaleString()} rows`;
  }

  filterColumn.addEventListener('change', applyFilter);
  filterValue.addEventListener('input', applyFilter);
}

function showError(message: string): void {
  const errEl = document.getElementById('upload-error');
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.remove('hidden');
    setTimeout(() => errEl.classList.add('hidden'), 5000);
  }
}

function initApp(): void {
  const app = document.getElementById('app')!;
  app.innerHTML = createWizardHTML();

  const dropZone = getEl<HTMLElement>('drop-zone');
  const fileInput = getEl<HTMLInputElement>('file-input');
  const fileInfo = getEl<HTMLElement>('file-info');
  const fileNameEl = getEl<HTMLElement>('file-name');
  const fileSizeEl = getEl<HTMLElement>('file-size');
  const btnAnalyze = getEl<HTMLButtonElement>('btn-analyze');

  // Add error element
  const errorEl = document.createElement('div');
  errorEl.id = 'upload-error';
  errorEl.className = 'upload-error hidden';
  dropZone.after(errorEl);

  function handleFile(file: File): void {
    if (!file.name.match(/\.xlsx$/i)) {
      showError('Please upload an Excel file (.xlsx)');
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatNumber(file.size / 1024) + ' KB';
    fileInfo.classList.remove('hidden');
    dropZone.classList.add('drop-zone--selected');
  }

  fileInput.addEventListener('change', (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drop-zone--over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drop-zone--over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-zone--over');
    const f = e.dataTransfer?.files[0];
    if (f) handleFile(f);
  });

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
  });

  btnAnalyze.addEventListener('click', async () => {
    if (!selectedFile) return;
    try {
      btnAnalyze.disabled = true;
      await runProcessingWizard(selectedFile);
      renderDashboard();
    } catch (err) {
      console.error(err);
      showError(
        err instanceof Error ? err.message : 'An error occurred during analysis.'
      );
      // Reset to upload
      const processingScreen = document.getElementById('processing-screen');
      const uploadScreen = document.getElementById('upload-screen');
      if (processingScreen && uploadScreen) {
        processingScreen.classList.add('hidden');
        uploadScreen.classList.remove('hidden');
        uploadScreen.classList.add('active');
      }
      btnAnalyze.disabled = false;
    }
  });
}

// Boot
initApp();
