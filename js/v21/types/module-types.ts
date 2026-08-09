export interface ModuleInitResult {
  ready: boolean;
  count?: number;
  unread?: number;
}

export interface ModuleSaveResult<T> {
  ok: boolean;
  errors?: string[];
  tenant?: T;
  property?: T;
  contract?: T;
  notification?: T;
}

export interface ModuleState<T> {
  initialized: boolean;
  [key: string]: T[] | boolean | number | string | undefined;
}
