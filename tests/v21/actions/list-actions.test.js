import { describe, it, expect, beforeEach } from 'vitest';
import { bindArchiveActions, createActionButton } from '../../../js/v21/actions/list-actions.js';

describe('list actions', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"><article data-row-id="x1">' + createActionButton('x1') + '</article></div>';
  });

  it('crée un bouton action', () => {
    expect(createActionButton('a1')).toContain('data-id="a1"');
  });

  it('bind archive action and removes row', async () => {
    let called = '';
    bindArchiveActions('#root', '.v21-action-button', async (id) => { called = id; });
    document.querySelector('.v21-action-button').click();
    await Promise.resolve();

    expect(called).toBe('x1');
  });
});
