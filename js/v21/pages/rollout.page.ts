import { buildUserAgencyContext } from '../context/user-agency-context.js';
import { loadRemoteFeatureFlags, saveRemoteFeatureFlags } from '../rollout/feature-flags.repository.js';
import { getFeatureFlags, setFeatureFlag, resetFeatureFlags, setRemoteFeatureFlags } from '../rollout/feature-flags.js';

const FLAG_LABELS: Record<string, string> = {
  v21Dashboard: 'Dashboard V21',
  v21Properties: 'Biens V21',
  v21Tenants: 'Locataires V21',
  v21Owners: 'Propriétaires V21',
  v21Contracts: 'Contrats V21',
  v21Documents: 'Documents V21',
  v21OwnerPayouts: 'Reversements propriétaires V21',
  v21ProductionIndex: 'Index production V21'
};

export async function initRolloutPage(): Promise<void> {
  const context = buildUserAgencyContext();

      try {
        setRemoteFeatureFlags(await loadRemoteFeatureFlags(context));
      } catch (error) {
        console.warn('[V21][Rollout] remote flags unavailable:', error);
      }

      render();

  document.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target?.matches('[data-feature-flag]')) return;

    setFeatureFlag(target.dataset.featureFlag as any, target.checked);
    render();
  });

  document.querySelector('#reset-flags')?.addEventListener('click', () => {
    resetFeatureFlags();
    render();
  });
}

function render(): void {
  const root = document.querySelector('#rollout-root');
  if (!root) return;

  const flags = getFeatureFlags();

  root.innerHTML = `
    <section class="v21-form-card">
      <h2>Feature Flags V21</h2>
      <p>Active/désactive progressivement les domaines V21.</p>

      <div class="v21-table">
        ${Object.entries(flags).map(([key, value]) => `
          <label class="v21-table-row">
            <strong>${FLAG_LABELS[key] || key}</strong>
            <input data-feature-flag="${key}" type="checkbox" ${value ? 'checked' : ''} />
          </label>
        `).join('')}
      </div>

      <div class="v21-form-actions">
        <button id="reset-flags" type="button">Réinitialiser</button>
      </div>
    </section>
  `;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRolloutPage, { once: true });
  } else {
    initRolloutPage();
  }
}
