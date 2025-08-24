/**
 * Formats a date string into a short Brazilian Portuguese date and time format.
 * If the date string is invalid, it returns the original string.
 *
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date string or the original string if formatting fails.
 */
function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr));
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formats the raw Copilot usage data into a human-readable string.
 * This function provides a detailed breakdown of Copilot plan, access type,
 * chat enablement, assignment date, quota reset date, and specific quotas
 * for chat, completions, and premium interactions.
 *
 * @param {object} data - The raw usage data object obtained from the Copilot API.
 * @param {string} data.copilot_plan - The Copilot plan name (e.g., "Business").
 * @param {string} data.access_type_sku - The SKU for the access type.
 * @param {boolean} data.chat_enabled - Indicates if chat is enabled.
 * @param {string} data.assigned_date - The date when Copilot was assigned.
 * @param {string} data.quota_reset_date - The date when the quota resets.
 * @param {object} data.quota_snapshots - An object containing quota details for different features (chat, completions, premium_interactions).
 * @param {Array<string>} [data.organization_list] - An optional list of organizations associated with the Copilot usage.
 * @returns {string} A formatted string containing the detailed Copilot usage information.
 */
export function formatUsageInfo(data) {
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

/**
 * Creates a concise summary of the Copilot usage data.
 * This function focuses on the most important quota information, especially
 * premium interactions, and provides a quick overview of chat and completions quotas,
 * along with the next quota reset date.
 *
 * @param {object} data - The raw usage data object obtained from the Copilot API.
 * @param {string} data.copilot_plan - The Copilot plan name (e.g., "Business").
 * @param {object} data.quota_snapshots - An object containing quota details for different features (chat, completions, premium_interactions).
 * @param {string} data.quota_reset_date - The date when the quota resets.
 * @returns {string} A concise formatted string summarizing the Copilot usage.
 */
export function createUsageSummary(data) {
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
