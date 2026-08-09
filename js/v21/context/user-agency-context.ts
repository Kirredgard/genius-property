import { getPersistedSession, type AuthSession } from '../auth/auth.service.js';
import { getCurrentAgencyId, setCurrentAgencyId } from '../data/agency-context.js';

export interface UserAgencyContext {
  user: AuthSession | null;
  userId: string;
  email: string;
  agencyId: string;
  role: string;
  environment: string;
}

export function getCurrentRole(): string {
  if (typeof window === 'undefined') return '';

  try {
    return localStorage.getItem('gp:v21:role') || (window as any).GPV21CurrentRole || '';
  } catch (_) {
    return (window as any).GPV21CurrentRole || '';
  }
}

export function setCurrentRole(role: string): boolean {
  if (typeof window === 'undefined') return false;

  (window as any).GPV21CurrentRole = role;

  try {
    localStorage.setItem('gp:v21:role', role);
  } catch (_) {
    return false;
  }

  return true;
}

export function buildUserAgencyContext(overrides: Partial<UserAgencyContext> = {}): UserAgencyContext {
  const user = overrides.user || getPersistedSession();

  return {
    user,
    userId: overrides.userId || user?.uid || '',
    email: overrides.email || user?.email || '',
    agencyId: overrides.agencyId || getCurrentAgencyId(),
    role: overrides.role || getCurrentRole() || 'viewer',
    environment: overrides.environment || import.meta.env.MODE || 'development'
  };
}

export function persistUserAgencyContext(context: Partial<UserAgencyContext>): UserAgencyContext {
  if (context.agencyId) setCurrentAgencyId(context.agencyId);
  if (context.role) setCurrentRole(context.role);

  return buildUserAgencyContext(context);
}

if (typeof window !== 'undefined') {
  (window as any).GPV21Context = {
    build: buildUserAgencyContext,
    persist: persistUserAgencyContext,
    getRole: getCurrentRole,
    setRole: setCurrentRole,
    getAgencyId: getCurrentAgencyId,
    setAgencyId: setCurrentAgencyId
  };
}
