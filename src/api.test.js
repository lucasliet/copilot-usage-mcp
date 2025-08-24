import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { fetchCopilotUsage } from './api.js';
import { server } from './mocks/server.js';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchCopilotUsage', () => {
  it('should return usage data for a valid token', async () => {
    const data = await fetchCopilotUsage('valid-token');
    expect(data.copilot_plan).toBe('Business');
  });

  it('should throw an error for an invalid token', async () => {
    await expect(fetchCopilotUsage('invalid-token')).rejects.toThrow(
      'Erro na requisição: 401 Unauthorized'
    );
  });

  it('should throw a network error on fetch failure', async () => {
    await expect(fetchCopilotUsage('network-error')).rejects.toThrow(
      'Erro na requisição: 500 Internal Server Error'
    );
  });
});
