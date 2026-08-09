import { describe, it, expect, beforeEach } from 'vitest';
import { initLoginPage } from '../../../js/v21/pages/login.page.js';

describe('login page', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="login-form">
        <input name="email" />
        <input name="password" />
        <p id="login-message"></p>
      </form>
    `;
  });

  it('initialise la page login', () => {
    initLoginPage();
    expect(document.querySelector('#login-form')).toBeTruthy();
  });
});
