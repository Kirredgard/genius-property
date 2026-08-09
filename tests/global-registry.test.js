import { describe, expect, it } from 'vitest';
import { exposeGlobal, getGlobalReport } from '../js/v21/core/global-registry.js';

describe('global registry', () => {
  it('expose un global de façon contrôlée', () => {
    exposeGlobal('__GP_TEST_GLOBAL__', 123, { overwrite: true });
    expect(globalThis.__GP_TEST_GLOBAL__).toBe(123);
    expect(getGlobalReport().some((item) => item.name === '__GP_TEST_GLOBAL__')).toBe(true);
  });
});
