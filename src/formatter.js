// Função para formatar as informações de uso
export function formatUsageInfo(data) {
  const formatDate = (dateStr) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatQuota = (quota) => {
    if (quota.unlimited) {
      return 'Ilimitado';
    }
    return `${quota.remaining}/${quota.entitlement} (${quota.percent_remaining.toFixed(1)}% restante)`;
  };

  const formatted = `🤖 **GitHub Copilot - Status de Uso**\n\n` +
    `📋 **Informações Gerais:**\n` +
    `• Plano: ${data.copilot_plan}\n` +
    `• Tipo de acesso: ${data.access_type_sku}\n` +
    `• Chat habilitado: ${data.chat_enabled ? 'Sim' : 'Não'}\n` +
    `• Data de atribuição: ${formatDate(data.assigned_date)}\n` +
    `• Próxima renovação de cota: ${formatDate(data.quota_reset_date)}\n\n` +

    `📊 **Cotas de Uso:**\n` +

    `\n🗨️ **Chat:**\n` +
    `• Status: ${formatQuota(data.quota_snapshots.chat)}\n` +
    `• Overage permitido: ${data.quota_snapshots.chat.overage_permitted ? 'Sim' : 'Não'}\n` +
    `• Contador de overage: ${data.quota_snapshots.chat.overage_count}\n` +

    `\n💡 **Completions (Autocompletar):**\n` +
    `• Status: ${formatQuota(data.quota_snapshots.completions)}\n` +
    `• Overage permitido: ${data.quota_snapshots.completions.overage_permitted ? 'Sim' : 'Não'}\n` +
    `• Contador de overage: ${data.quota_snapshots.completions.overage_count}\n` +

    `\n⭐ **Interações Premium:**\n` +
    `• Status: ${formatQuota(data.quota_snapshots.premium_interactions)}\n` +
    `• Overage permitido: ${data.quota_snapshots.premium_interactions.overage_permitted ? 'Sim' : 'Não'}\n` +
    `• Contador de overage: ${data.quota_snapshots.premium_interactions.overage_count}\n`;

  if (data.organization_list && data.organization_list.length > 0) {
    return formatted + `\n🏢 **Organizações:**\n` + data.organization_list.map(org => `• ${org}`).join('\n') + '\n';
  }

  return formatted;
}

// Função para criar um resumo conciso
export function createUsageSummary(data) {
  const formatDate = (dateStr) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const quotas = data.quota_snapshots;

  const summaryLines = [];
  summaryLines.push(`📊 **Resumo GitHub Copilot** (${data.copilot_plan})\n`);

  // Status mais importante - interações premium
  if (!quotas.premium_interactions.unlimited) {
    const remaining = quotas.premium_interactions.remaining;
    const total = quotas.premium_interactions.entitlement;
    const percent = quotas.premium_interactions.percent_remaining.toFixed(1);
    summaryLines.push(`⭐ **Interações Premium**: ${remaining}/${total} restantes (${percent}%)`);
  }

  // Chat e Completions (geralmente ilimitados)
  summaryLines.push(`🗨️ **Chat**: ${quotas.chat.unlimited ? 'Ilimitado' : quotas.chat.remaining + '/' + quotas.chat.entitlement}`);
  summaryLines.push(`💡 **Completions**: ${quotas.completions.unlimited ? 'Ilimitado' : quotas.completions.remaining + '/' + quotas.completions.entitlement}`);

  summaryLines.push(`\n📅 **Renovação**: ${formatDate(data.quota_reset_date)}`);

  const summary = summaryLines.join('\n');
  return summary;
}
