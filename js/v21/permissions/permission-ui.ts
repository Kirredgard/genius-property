import { buildUserAgencyContext } from '../context/user-agency-context.js';
import { canWrite, canAdmin, canManageBilling } from '../profile/permissions.js';

export type PermissionRequirement = 'write' | 'admin' | 'billing';

export function hasPermission(requirement: PermissionRequirement): boolean {
  const context = buildUserAgencyContext();

  if (requirement === 'write') return canWrite(context.role);
  if (requirement === 'admin') return canAdmin(context.role);
  if (requirement === 'billing') return canManageBilling(context.role);

  return false;
}

export function applyPermissionUI(root: ParentNode = document): void {
  if (typeof document === 'undefined') return;

  root.querySelectorAll<HTMLElement>('[data-requires-permission]').forEach((element) => {
    const requirement = element.dataset.requiresPermission as PermissionRequirement;
    const allowed = hasPermission(requirement);

    if (allowed) {
      element.removeAttribute('disabled');
      element.removeAttribute('aria-disabled');
      element.classList.remove('v21-permission-disabled');
      return;
    }

    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
      element.disabled = true;
    }

    element.setAttribute('aria-disabled', 'true');
    element.classList.add('v21-permission-disabled');
  });
}

export function markWriteAction(html: string): string {
  return html.replace('<button ', '<button data-requires-permission="write" ');
}

if (typeof window !== 'undefined') {
  (window as any).GPV21PermissionUI = {
    apply: applyPermissionUI,
    has: hasPermission
  };
}
