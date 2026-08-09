export const MARKETPLACE_INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication'
  },
  {
    id: 'discord',
    name: 'Discord',
    category: 'communication'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'automation'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'storage'
  }
];

export function listMarketplaceIntegrations() {
  return MARKETPLACE_INTEGRATIONS;
}
