import { validateRuntimeConfig } from '../config/config-validation.service.js';
import { buildSmokeTestReport } from './smoke-tests.service.js';

export function buildFinalQualityReport() {
  return {
    generatedAt: new Date().toISOString(),
    config: validateRuntimeConfig(),
    smokeTests: buildSmokeTestReport(),
    status: 'ready-for-beta-validation'
  };
}
