import type { ProcessingStep } from './types';

export const STEPS: { id: ProcessingStep; label: string; icon: string; description: string }[] = [
  {
    id: 'upload',
    label: 'Upload File',
    icon: '📂',
    description: 'Select your Excel spreadsheet',
  },
  {
    id: 'parsing',
    label: 'Parsing Data',
    icon: '⚙️',
    description: 'Reading rows and columns',
  },
  {
    id: 'detecting',
    label: 'Detecting Metrics',
    icon: '🔍',
    description: 'Identifying dimensions & measures',
  },
  {
    id: 'insights',
    label: 'Generating Insights',
    icon: '💡',
    description: 'Calculating key statistics',
  },
  {
    id: 'building',
    label: 'Building Visuals',
    icon: '📊',
    description: 'Rendering charts & dashboard',
  },
];

export function createWizardHTML(): string {
  return `
    <div id="wizard" class="wizard">
      <div class="wizard-header">
        <div class="wizard-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#10b981"/>
            <rect x="6" y="25" width="7" height="10" rx="1.5" fill="white"/>
            <rect x="16" y="16" width="7" height="19" rx="1.5" fill="white"/>
            <rect x="27" y="8" width="7" height="27" rx="1.5" fill="white"/>
            <polyline points="9.5,22 19.5,12 30.5,6" stroke="#d1fae5" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="wizard-title-group">
          <h1 class="wizard-title">DataVision</h1>
          <p class="wizard-subtitle">Smart Data Intelligence Dashboard</p>
        </div>
      </div>

      <div id="upload-screen" class="upload-screen active">
        <div class="upload-hero">
          <div class="upload-hero-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#d1fae5"/>
              <path d="M32 42V28M32 28L25 35M32 28L39 35" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 44H44" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
              <rect x="16" y="18" width="32" height="28" rx="4" stroke="#10b981" stroke-width="2" stroke-dasharray="4 3" fill="none"/>
            </svg>
          </div>
          <h2 class="upload-hero-title">Upload Your Excel File</h2>
          <p class="upload-hero-text">
            Drop an <strong>.xlsx</strong> file and DataVision will automatically
            analyze your data and generate beautiful, interactive visualizations — all in your browser.
          </p>
        </div>

        <div
          id="drop-zone"
          class="drop-zone"
          role="button"
          tabindex="0"
          aria-label="Upload Excel file"
        >
          <div class="drop-zone-content">
            <div class="drop-zone-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#ecfdf5"/>
                <path d="M24 14v14M24 14L18 20M24 14L30 20" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 34h24" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
                <rect x="10" y="22" width="28" height="14" rx="3" fill="none" stroke="#a7f3d0" stroke-width="2"/>
              </svg>
            </div>
            <p class="drop-zone-text">Drag &amp; drop your Excel file here</p>
            <p class="drop-zone-sub">or</p>
            <label class="btn-upload" for="file-input">
              Browse File
            </label>
            <input
              type="file"
              id="file-input"
              accept=".xlsx"
              class="file-input-hidden"
            />
            <p class="drop-zone-hint">Supports .xlsx files</p>
          </div>
        </div>

        <div id="file-info" class="file-info hidden">
          <div class="file-info-icon">📄</div>
          <div class="file-info-details">
            <span id="file-name" class="file-name"></span>
            <span id="file-size" class="file-size"></span>
          </div>
          <button id="btn-analyze" class="btn-primary">
            <span>Analyze Data</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div id="processing-screen" class="processing-screen hidden">
        <div class="processing-header">
          <h2 class="processing-title">Analyzing Your Data</h2>
          <p class="processing-subtitle">Please wait while DataVision processes your spreadsheet</p>
        </div>
        <div class="steps-container">
          ${STEPS.slice(1).map((step, i) => `
            <div class="step-item" id="step-${step.id}" data-index="${i}">
              <div class="step-icon-wrap">
                <span class="step-icon">${step.icon}</span>
                <div class="step-spinner hidden"></div>
                <div class="step-check hidden">✓</div>
              </div>
              <div class="step-body">
                <div class="step-label">${step.label}</div>
                <div class="step-desc">${step.description}</div>
              </div>
              <div class="step-status" id="step-status-${step.id}">Waiting</div>
            </div>
          `).join('')}
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar" id="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width:0%"></div>
          </div>
          <span id="progress-label" class="progress-label">0%</span>
        </div>
      </div>
    </div>
  `;
}
