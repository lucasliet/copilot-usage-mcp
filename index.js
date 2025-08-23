#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Importar fetch de forma compatível
let fetch;
try {
  // Tenta usar fetch nativo (Node.js 18+)
  fetch = globalThis.fetch;
} catch (error) {
  // Fallback para node-fetch se necessário
  console.error('Fetch nativo não disponível, será necessário instalar node-fetch se o Node.js for < 18');
  process.exit(1);
}

// Verificar se fetch está disponível
if (!fetch) {
  console.error('Erro: fetch não está disponível. Por favor, atualize para Node.js 18+');
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
      return new Date(dateStr).toLocaleString('pt-BR');
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

  let formatted = `🤖 **GitHub Copilot - Status de Uso**\n\n`;
  formatted += `📋 **Informações Gerais:**\n`;
  formatted += `• Plano: ${data.copilot_plan}\n`;
  formatted += `• Tipo de acesso: ${data.access_type_sku}\n`;
  formatted += `• Chat habilitado: ${data.chat_enabled ? 'Sim' : 'Não'}\n`;
  formatted += `• Data de atribuição: ${formatDate(data.assigned_date)}\n`;
  formatted += `• Próxima renovação de cota: ${formatDate(data.quota_reset_date)}\n\n`;

  formatted += `📊 **Cotas de Uso:**\n`;

  const quotas = data.quota_snapshots;

  formatted += `\n🗨️ **Chat:**\n`;
  formatted += `• Status: ${formatQuota(quotas.chat)}\n`;
  formatted += `• Overage permitido: ${quotas.chat.overage_permitted ? 'Sim' : 'Não'}\n`;
  formatted += `• Contador de overage: ${quotas.chat.overage_count}\n`;

  formatted += `\n💡 **Completions (Autocompletar):**\n`;
  formatted += `• Status: ${formatQuota(quotas.completions)}\n`;
  formatted += `• Overage permitido: ${quotas.completions.overage_permitted ? 'Sim' : 'Não'}\n`;
  formatted += `• Contador de overage: ${quotas.completions.overage_count}\n`;

  formatted += `\n⭐ **Interações Premium:**\n`;
  formatted += `• Status: ${formatQuota(quotas.premium_interactions)}\n`;
  formatted += `• Overage permitido: ${quotas.premium_interactions.overage_permitted ? 'Sim' : 'Não'}\n`;
  formatted += `• Contador de overage: ${quotas.premium_interactions.overage_count}\n`;

  if (data.organization_list && data.organization_list.length > 0) {
    formatted += `\n🏢 **Organizações:**\n`;
    data.organization_list.forEach(org => {
      formatted += `• ${org}\n`;
    });
  }

  return formatted;
}

// Função para criar um resumo conciso
function createUsageSummary(data) {
  const quotas = data.quota_snapshots;
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  let summary = `📊 **Resumo GitHub Copilot** (${data.copilot_plan})\n\n`;

  // Status mais importante - interações premium
  if (!quotas.premium_interactions.unlimited) {
    const remaining = quotas.premium_interactions.remaining;
    const total = quotas.premium_interactions.entitlement;
    const percent = quotas.premium_interactions.percent_remaining.toFixed(1);
    summary += `⭐ **Interações Premium**: ${remaining}/${total} restantes (${percent}%)\n`;
  }

  // Chat e Completions (geralmente ilimitados)
  summary += `🗨️ **Chat**: ${quotas.chat.unlimited ? 'Ilimitado' : quotas.chat.remaining + '/' + quotas.chat.entitlement}\n`;
  summary += `💡 **Completions**: ${quotas.completions.unlimited ? 'Ilimitado' : quotas.completions.remaining + '/' + quotas.completions.entitlement}\n`;

  summary += `\n📅 **Renovação**: ${formatDate(data.quota_reset_date)}`;

  return summary;
}

// Manipular chamadas de ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const token = (process.env.COPILOT_TOKEN || '').trim();

  if (!token) {
    return {
      content: [{
        type: 'text',
        text: '❌ Erro: Token do GitHub Copilot ausente. Defina a variável de ambiente COPILOT_TOKEN.'
      }],
      isError: true
    };
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
      return {
        content: [{
          type: 'text',
          text: `❌ Erro ao obter informações de uso do Copilot: ${error.message}`
        }],
        isError: true
      };
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
      return {
        content: [{
          type: 'text',
          text: `❌ Erro ao obter informações de uso do Copilot: ${error.message}`
        }],
        isError: true
      };
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
      return {
        content: [{
          type: 'text',
          text: `❌ Erro ao obter informações de uso do Copilot: ${error.message}`
        }],
        isError: true
      };
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
