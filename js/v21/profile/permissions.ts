export type Role = 'viewer' | 'agent' | 'admin' | 'owner' | 'superAdmin' | string;

const ROLE_LEVELS: Record<string, number> = {
  viewer: 1,
  agent: 2,
  admin: 3,
  owner: 4,
  superAdmin: 5
};

export function canRead(role: Role): boolean {
  return roleLevel(role) >= ROLE_LEVELS.viewer;
}

export function canWrite(role: Role): boolean {
  return roleLevel(role) >= ROLE_LEVELS.agent;
}

export function canAdmin(role: Role): boolean {
  return roleLevel(role) >= ROLE_LEVELS.admin;
}

export function canManageBilling(role: Role): boolean {
  return roleLevel(role) >= ROLE_LEVELS.owner;
}

export function roleLevel(role: Role): number {
  return ROLE_LEVELS[String(role || 'viewer')] || 0;
}
