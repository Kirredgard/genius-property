import { renderHealthReport } from '../monitoring/health-report.js';

export function initHealthPage() {
  renderHealthReport('#health-report-root');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHealthPage, { once: true });
  } else {
    initHealthPage();
  }
}
