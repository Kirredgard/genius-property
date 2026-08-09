export interface ServiceOptions {
  firestore?: unknown;
  rootSelector?: string;
  payments?: unknown[];
  contracts?: unknown[];
  tenants?: unknown[];
  properties?: unknown[];
}

export interface ServiceResult<T> {
  ok: boolean;
  errors?: string[];
  data?: T;
}

export interface PendingSync {
  _pendingSync?: boolean;
}
