import { hydrateContextFromUserProfile } from '../profile/user-profile.service.js';
import { loginWithEmail, logout, observeAuthState, getPersistedSession } from './auth.service.js';
import { registerLegacyGlobal } from '../legacy/legacy-registry.js';

export function initAuthModule() {
  const unsubscribe = observeAuthState(async (session) => {
    document.dispatchEvent(new CustomEvent('gp:v21-auth-state', {
      detail: { session, context: session ? await hydrateContextFromUserProfile(session) : null }
    }));
  });

  return {
    ready: true,
    session: getPersistedSession(),
    unsubscribe
  };
}

export const GPV21Auth = {
  init: initAuthModule,
  loginWithEmail,
  logout,
  getSession: getPersistedSession
};

registerLegacyGlobal('GPV21Auth', GPV21Auth);
