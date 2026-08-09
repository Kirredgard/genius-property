export function buildHealthReport() {
  const report = {
    checkedAt: new Date().toISOString(),
    runtime: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof location !== 'undefined' ? location.href : '',
      online: typeof navigator !== 'undefined' ? navigator.onLine : true
    },
    v21: {
      bootstrapped: Boolean((window as any).GPV21_BOOTSTRAPPED),
      firebase: Boolean((window as any).GPV21Firebase),
      auth: Boolean((window as any).GPV21Auth),
      dashboard: Boolean((window as any).GPV21Dashboard),
      properties: Boolean((window as any).GPV21Properties),
      tenants: Boolean((window as any).GPV21Tenants),
      owners: Boolean((window as any).GPV21Owners),
      contracts: Boolean((window as any).GPV21Contracts),
      documents: Boolean((window as any).GPV21Documents)
    },
    errors: (window as any).GPV21Errors?.list?.() || []
  };

  return report;
}

export function renderHealthReport(rootSelector = '#health-report-root'): void {
  const root = document.querySelector(rootSelector);
  if (!root) return;

  const report = buildHealthReport();
  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Health Report V21</h2>
      <pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>
    </section>
  `;
}

function escapeHtml(value = ''): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof window !== 'undefined') {
  (window as any).GPV21Health = {
    build: buildHealthReport,
    render: renderHealthReport
  };
}
