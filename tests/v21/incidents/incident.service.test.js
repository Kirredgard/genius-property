import { describe, it, expect, beforeEach } from 'vitest';
import { persistLocalIncident, readLocalIncidents } from '../../../js/v21/incidents/incident.service.js';

describe('incident service', () => {
  beforeEach(() => localStorage.clear());

  it('persiste un incident local', () => {
    persistLocalIncident({ title: 'Test', severity: 'low' });
    expect(readLocalIncidents()[0].title).toBe('Test');
  });
});
