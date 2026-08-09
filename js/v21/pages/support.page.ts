import { renderSupportCenter } from '../support/support.view.js';

export function initSupportPage(): void {
  renderSupportCenter('#support-root');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupportPage, { once: true });
  } else {
    initSupportPage();
  }
}
