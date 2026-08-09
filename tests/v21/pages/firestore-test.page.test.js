import { describe, it, expect, beforeEach } from 'vitest';
import { initFirestoreTestPage } from '../../../js/v21/pages/firestore-test.page.js';

describe('firestore test page', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="firestore-test-form">
        <input name="firstName" value="Test" />
        <input name="lastName" value="Firestore" />
        <input name="phone" value="770000000" />
      </form>
      <pre id="firestore-test-output"></pre>
    `;
  });

  it('initialise la page test Firestore', async () => {
    await initFirestoreTestPage();
    expect(document.querySelector('#firestore-test-output')).toBeTruthy();
  });
});
