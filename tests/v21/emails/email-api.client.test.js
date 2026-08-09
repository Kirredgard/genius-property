import { describe, it, expect } from 'vitest';
import { getEmailApiBaseUrl } from '../../../js/v21/emails/email-api.client.js';

describe('email api client', () => {
  it('retourne une base URL email', () => {
    expect(getEmailApiBaseUrl()).toBeTruthy();
  });
});
