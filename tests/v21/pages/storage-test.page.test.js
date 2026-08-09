import { describe, it, expect, beforeEach } from 'vitest';
import { initStorageTestPage } from '../../../js/v21/pages/storage-test.page.js';

describe('storage test page', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="storage-test-form">
        <input id="storage-file" type="file" />
      </form>
      <button id="storage-delete-last"></button>
      <pre id="storage-test-output"></pre>
    `;
  });

  it('initialise la page test Storage', () => {
    initStorageTestPage();
    expect(document.querySelector('#storage-test-output')).toBeTruthy();
  });
});
