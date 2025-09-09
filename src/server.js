import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { fetchCopilotUsage } from './api.js';
import { formatUsageInfo, createUsageSummary } from './formatter.js';

const errorResponse = (message) => ({
  content: [{ type: 'text', text: `❌ ${message}` }],
  isError: true
});

export const listToolsHandler = async () => ({
  tools: [
    {
      name: 'get_copilot_usage',
      description: 'Obtém informações de uso atual do GitHub Copilot, incluindo cotas e limites, dados originais da API',
      inputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
      name: 'get_copilot_usage_formatted',
      description: 'Obtém informações de uso do GitHub Copilot formatado humanizado',
      inputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
      name: 'get_copilot_usage_summary',
      description: 'Obtém um resumo conciso do uso do GitHub Copilot com informações principais, como o restante da quota premium (economiza tokens)',
      inputSchema: { type: 'object', properties: {}, required: [] }
    }
  ]
});

export const callToolHandler = async (request) => {
  const { name } = request.params;
  const token = (process.env.COPILOT_TOKEN || '').trim();

  if (!token) {
    return errorResponse('Erro: Token do GitHub Copilot ausente. Defina a variável de ambiente COPILOT_TOKEN.');
  }

  try {
    const usageData = await fetchCopilotUsage(token);
    if (name === 'get_copilot_usage') {
      return { content: [{ type: 'text', text: JSON.stringify(usageData, null, 2) }] };
    }
    if (name === 'get_copilot_usage_formatted') {
      const formatted = formatUsageInfo(usageData);
      return { content: [{ type: 'text', text: formatted }] };
    }
    if (name === 'get_copilot_usage_summary') {
      const summary = createUsageSummary(usageData);
      return { content: [{ type: 'text', text: summary }] };
    }
  } catch (error) {
    return errorResponse('Erro ao obter informações de uso do Copilot: ' + error.message);
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
};

export async function initialize() {
  const server = new Server(
    { name: 'copilot-usage-mcp', version: '2.1.4' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, listToolsHandler);
  server.setRequestHandler(CallToolRequestSchema, callToolHandler);

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('Copilot Usage MCP Server iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor MCP:', error.message);
    process.exit(1);
  }
}
