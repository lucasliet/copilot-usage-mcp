#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const fetch = globalThis.fetch;
if (typeof fetch !== 'function') {
  console.error('❌ Erro: fetch não está disponível. Atualize para Node.js 18+ ou superior.');
  process.exit(1);
}

// Criar o servidor MCP
const server = new Server(
  {
    name: 'copilot-usage-mcp',
    version: '1.0.7'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Listar ferramentas disponíveis
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_copilot_usage',
      description: 'Obtém informações de uso atual do GitHub Copilot, incluindo cotas e limites (usa variável de ambiente COPILOT_TOKEN)'
    },
    {
      name: 'get_copilot_usage_formatted',
      description: 'Obtém informações de uso do GitHub Copilot formatadas de forma legível (usa variável de ambiente COPILOT_TOKEN)'
    },
    {
      name: 'get_copilot_usage_summary',
      description: 'Obtém um resumo conciso do uso do GitHub Copilot com informações principais (usa variável de ambiente COPILOT_TOKEN)'
    }
  ]
}));

// Função para fazer a requisição ao GitHub Copilot API
async function fetchCopilotUsage(token) {
  try {
    const response = await fetch('https://api.github.com/copilot_internal/user', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `token ${token}`,
        'Editor-Version': 'vscode/1.98.1',
        'Editor-Plugin-Version': 'copilot-chat/0.26.7',
        'User-Agent': 'GitHubCopilotChat/0.26.7',
        'X-Github-Api-Version': '2025-04-01'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}. Detalhes: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Erro de rede: Não foi possível conectar à API do GitHub. Verifique sua conexão com a internet.');
    }
    throw error;
  }
}

// Função para formatar as informações de uso
function formatUsageInfo(data) {
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
function createUsageSummary(data) {
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

const errorResponse = (message) => ({
  content: [{ type: 'text', text: `❌ ${message}` }],
  isError: true
});

// Manipular chamadas de ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const token = (process.env.COPILOT_TOKEN || '').trim();

  if (!token) {
    return errorResponse('Erro: Token do GitHub Copilot ausente. Defina a variável de ambiente COPILOT_TOKEN.');
  }

  if (name === 'get_copilot_usage') {
    try {
      const usageData = await fetchCopilotUsage(token);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(usageData, null, 2)
        }]
      };
    } catch (error) {
      return errorResponse('Erro ao obter informações de uso do Copilot: ' + error.message);
    }
  }

  if (name === 'get_copilot_usage_formatted') {
    try {
      const usageData = await fetchCopilotUsage(token);
      const formatted = formatUsageInfo(usageData);

      return {
        content: [{
          type: 'text',
          text: formatted
        }]
      };
    } catch (error) {
      return errorResponse('Erro ao obter informações de uso do Copilot: ' + error.message);
    }
  }

  if (name === 'get_copilot_usage_summary') {
    try {
      const usageData = await fetchCopilotUsage(token);
      const summary = createUsageSummary(usageData);

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    } catch (error) {
      return errorResponse('Erro ao obter informações de uso do Copilot: ' + error.message);
    }
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
});

// Inicializar o servidor
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✅ Copilot Usage MCP Server iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor MCP:', error.message);
    process.exit(1);
  }
}

// Tratar sinais de encerramento gracefully
process.on('SIGINT', () => {
  console.error('\n🔄 Encerrando Copilot Usage MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n🔄 Encerrando Copilot Usage MCP Server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});
