import { describe, it, expect, beforeEach } from 'vitest';
import { applyPermissionUI } from '../../../js/v21/permissions/permission-ui.js';

describe('permission UI', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<button data-requires-permission="write">Save</button>';
  });

  it('désactive une action write pour viewer', () => {
    localStorage.setItem('gp:v21:role', 'viewer');
    applyPermissionUI(document);

    expect(document.querySelector('button').disabled).toBe(true);
  });

  it('autorise une action write pour agent', () => {
    localStorage.setItem('gp:v21:role', 'agent');
    applyPermissionUI(document);

    expect(document.querySelector('button').disabled).toBe(false);
  });
});
