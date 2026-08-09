export function buildSsoProviderConfig(provider = 'google') {
  return {
    provider,
    enabled: true,
    saml: provider === 'saml',
    oidc: provider === 'oidc'
  };
}
