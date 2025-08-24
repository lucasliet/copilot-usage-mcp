import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listToolsHandler, callToolHandler } from './server.js';
import * as api from './api.js';
import * as formatter from './formatter.js';

vi.mock('./api.js');
vi.mock('./formatter.js');

describe('Server Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.COPILOT_TOKEN = 'test-token';
  });

  describe('listToolsHandler', () => {
    it('should return the list of tools', async () => {
      const result = await listToolsHandler();
      expect(result.tools).toHaveLength(3);
      expect(result.tools[0].name).toBe('get_copilot_usage');
    });
  });

  describe('callToolHandler', () => {
    const mockUsageData = { plan: 'test' };

    beforeEach(() => {
      api.fetchCopilotUsage.mockResolvedValue(mockUsageData);
      formatter.formatUsageInfo.mockReturnValue('formatted-info');
      formatter.createUsageSummary.mockReturnValue('summary-info');
    });

    it('should return error if token is missing', async () => {
      process.env.COPILOT_TOKEN = '';
      const response = await callToolHandler({ params: { name: 'any' } });
      expect(response.isError).toBe(true);
    });

    it('should call get_copilot_usage', async () => {
      const response = await callToolHandler({ params: { name: 'get_copilot_usage' } });
      expect(api.fetchCopilotUsage).toHaveBeenCalledOnce();
      expect(response.content[0].text).toBe(JSON.stringify(mockUsageData, null, 2));
    });

    it('should call get_copilot_usage_formatted', async () => {
        const response = await callToolHandler({ params: { name: 'get_copilot_usage_formatted' } });
        expect(formatter.formatUsageInfo).toHaveBeenCalledWith(mockUsageData);
        expect(response.content[0].text).toBe('formatted-info');
    });

    it('should call get_copilot_usage_summary', async () => {
        const response = await callToolHandler({ params: { name: 'get_copilot_usage_summary' } });
        expect(formatter.createUsageSummary).toHaveBeenCalledWith(mockUsageData);
        expect(response.content[0].text).toBe('summary-info');
    });

    it('should handle API errors', async () => {
        api.fetchCopilotUsage.mockRejectedValue(new Error('API Down'));
        const response = await callToolHandler({ params: { name: 'get_copilot_usage' } });
        expect(response.isError).toBe(true);
        expect(response.content[0].text).toContain('API Down');
    });

    it('should throw for unknown tool', async () => {
        await expect(callToolHandler({ params: { name: 'unknown' } })).rejects.toThrow('Ferramenta desconhecida: unknown');
    });
  });
});