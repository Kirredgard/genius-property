/**
 * Contexte agence V21.
 */

export function getCurrentAgencyId(explicitAgencyId?: string): string {
  if (explicitAgencyId) return explicitAgencyId;

  if (typeof window === 'undefined') return '';

  const fromGlobal = (window as any).currentAgencyId || (window as any).GPV21CurrentAgencyId;
  if (fromGlobal) return String(fromGlobal);

  try {
    return localStorage.getItem('currentAgencyId') || '';
  } catch (_) {
    return '';
  }
}

export function setCurrentAgencyId(agencyId: string): boolean {
  if (typeof window === 'undefined') return false;

  (window as any).GPV21CurrentAgencyId = agencyId;

  try {
    localStorage.setItem('currentAgencyId', agencyId);
  } catch (_) {
    return false;
  }

  return true;
}
