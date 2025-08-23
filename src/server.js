
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { fetchCopilotUsage } from './api.js';
import { formatUsageInfo, createUsageSummary } from './formatter.js';

const fetch = globalThis.fetch;
if (typeof fetch !== 'function') {
  console.error('❌ Erro: fetch não está disponível. Atualize para Node.js 18+ ou superior.');
  process.exit(1);
}

// Criar o servidor MCP
const server = new Server(
  {
    name: 'copilot-usage-mcp',
    version: '2.1.0'
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
      description: 'Obtém informações de uso atual do GitHub Copilot, incluindo cotas e limites, dados puros a API',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_copilot_usage_formatted',
      description: 'Obtém informações de uso do GitHub Copilot formatadas de forma legível',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_copilot_usage_summary',
      description: 'Obtém um resumo conciso do uso do GitHub Copilot com informações principais, como o restante da quota premium (economiza tokens)',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ]
}));

const errorResponse = (message) => ({
  content: [{ type: 'text', text: `❌ ${message}` }],
  isError: true
});

// Manipular chamadas de ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  // Permitir token via argumento ou variável de ambiente
  const token = (process.env.COPILOT_TOKEN || '').trim();

  if (!token) {
    return errorResponse('Erro: Token do GitHub Copilot ausente. Defina a variável de ambiente COPILOT_TOKEN.');
  }

  try {
    const usageData = await fetchCopilotUsage(token);

    if (name === 'get_copilot_usage') {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(usageData, null, 2)
        }]
      };
    }

    if (name === 'get_copilot_usage_formatted') {
      const formatted = formatUsageInfo(usageData);
      return {
        content: [{
          type: 'text',
          text: formatted
        }]
      };
    }

    if (name === 'get_copilot_usage_summary') {
      const summary = createUsageSummary(usageData);
      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }

  } catch (error) {
    return errorResponse('Erro ao obter informações de uso do Copilot: ' + error.message);
  }

  throw new Error(`Ferramenta desconhecida: ${name}`);
});

// Inicializar o servidor
export async function initialize() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('✅ Copilot Usage MCP Server iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor MCP:', error.message);
    process.exit(1);
  }
}
