import { describe, it, expect } from 'vitest';
import { formatUsageInfo, createUsageSummary } from './formatter.js';

const mockData = {
  copilot_plan: 'Business',
  access_type_sku: 'copilot_business_seat',
  chat_enabled: true,
  assigned_date: '2025-01-01T12:00:00Z',
  quota_reset_date: '2025-09-01T00:00:00Z',
  organization_list: ['MyOrg'],
  quota_snapshots: {
    chat: {
      unlimited: true,
      overage_permitted: false,
      overage_count: 0,
    },
    completions: {
      unlimited: true,
      overage_permitted: false,
      overage_count: 0,
    },
    premium_interactions: {
      unlimited: false,
      overage_permitted: true,
      overage_count: 5,
      remaining: 95,
      entitlement: 100,
      percent_remaining: 95.0,
    },
  },
};

describe('formatter', () => {
  it('formatUsageInfo should format the usage data correctly', () => {
    const formatted = formatUsageInfo(mockData);
    expect(formatted).toMatch(/Plano: Business/);
    expect(formatted).toMatch(/Chat habilitado: Sim/);
    expect(formatted).toMatch(/Status: 95\/100 \(95.0% restante\)/);
    expect(formatted).toMatch(/Organizações:/);
  });

  it('createUsageSummary should create a concise summary', () => {
    const summary = createUsageSummary(mockData);
    expect(summary).toMatch(/📊 \*\*Resumo GitHub Copilot\*\* \(Business\)/);
    expect(summary).toMatch(/⭐ \*\*Interações Premium\*\*: 95\/100 restantes \(95.0%\)/);
    expect(summary).toMatch(/🗨️ \*\*Chat\*\*: Ilimitado/);
    expect(summary).toMatch(/💡 \*\*Completions\*\*: Ilimitado/);
    expect(summary).toMatch(/📅 \*\*Renovação\*\*:/);
  });
});