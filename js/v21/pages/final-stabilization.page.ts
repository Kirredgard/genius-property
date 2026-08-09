import { buildFinalQualityReport } from '../qa/quality-final-report.service.js';
import { installBetaSeedLocalStorage } from '../seed/beta-seed.service.js';
import { enableGlobalDemoMode } from '../demo/global-demo-mode.js';
import { renderQuickLinks } from '../navigation/quick-links.service.js';

export function initFinalStabilizationPage(): void {
  const root = document.querySelector('#final-stabilization-root');
  if (!root) return;

  const report = buildFinalQualityReport();

  root.innerHTML = `
    <section id="quick-links-root"></section>

    <section class="v21-form-card">
      <h2>Final Stabilization</h2>
      <div class="v21-form-actions">
        <button id="enable-demo" type="button">Activer démo globale</button>
        <button id="install-seed" type="button">Installer seed beta</button>
      </div>

      <h3>Rapport qualité</h3>
      <pre id="final-report">${escapeHtml(JSON.stringify(report, null, 2))}</pre>
    </section>
  `;

  renderQuickLinks('#quick-links-root');

  document.querySelector('#enable-demo')?.addEventListener('click', () => {
    enableGlobalDemoMode();
    alert('Démo globale activée.');
  });

  document.querySelector('#install-seed')?.addEventListener('click', () => {
    const seed = installBetaSeedLocalStorage();
    const output = document.querySelector('#final-report');
    if (output) output.textContent = JSON.stringify({ seed, report }, null, 2);
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinalStabilizationPage, { once: true });
  } else {
    initFinalStabilizationPage();
  }
}
