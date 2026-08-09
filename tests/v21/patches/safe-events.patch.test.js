import { describe, it, expect } from 'vitest';
import { emitAppEvent, listenAppEvent } from '../../../js/v21/patches/safe-events.patch.js';

describe('safe events patch', () => {
  it('émet et écoute un événement applicatif', () => {
    let received = null;

    const off = listenAppEvent('gp:test-event', (event) => {
      received = event.detail;
    });

    expect(emitAppEvent('gp:test-event', { ok: true })).toBe(true);
    expect(received).toEqual({ ok: true });

    off();
  });
});
