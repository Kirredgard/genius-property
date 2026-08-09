export type RootSelector = string | undefined;

export interface RenderableEntity {
  id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface EmptyStateOptions {
  title: string;
  message: string;
}
