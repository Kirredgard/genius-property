export const V21_PAGES = {
  dashboard: () => import('../pages/dashboard.page.js'),
  properties: () => import('../pages/properties.page.js'),
  tenants: () => import('../pages/tenants.page.js'),
  owners: () => import('../pages/owners.page.js'),
  contracts: () => import('../pages/contracts.page.js'),
  documents: () => import('../pages/documents.page.js')
};

export async function preloadV21Page(name: keyof typeof V21_PAGES): Promise<boolean> {
  const loader = V21_PAGES[name];
  if (!loader) return false;

  await loader();
  return true;
}

export function setupLinkPreload(selector = 'a[href$=".v21.html"]'): void {
  if (typeof document === 'undefined') return;

  document.querySelectorAll<HTMLAnchorElement>(selector).forEach((link) => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href') || '';
      const pageName = href.replace('./', '').replace('.v21.html', '') as keyof typeof V21_PAGES;
      if (pageName in V21_PAGES) preloadV21Page(pageName);
    }, { once: true });
  });
}
