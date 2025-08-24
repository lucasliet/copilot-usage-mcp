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

/**
 * Creates the MCP server instance.
 * The server is configured with a name, version, and capabilities.
 * In this case, it declares support for 'tools'.
 * @type {Server}
 */
const server = new Server(
  {
    name: 'copilot-usage-mcp',
    version: '2.1.2'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * Sets up the request handler for listing available tools.
 * This handler responds to `ListToolsRequestSchema` by providing a list of tools
 * that the server exposes, along with their descriptions and input schemas.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
}));

/**
 * Creates an error response object for tool calls.
 * @param {string} message - The error message to be displayed.
 * @returns {object} An object formatted as an MCP tool response indicating an error.
 */
const errorResponse = (message) => ({
  content: [{ type: 'text', text: `❌ ${message}` }],
  isError: true
});

/**
 * Handles incoming tool call requests.
 * It retrieves the GitHub Copilot token from environment variables, fetches usage data,
 * and returns formatted or raw usage information based on the tool name.
 * @param {object} request - The tool call request object, containing the tool 'name' in its params.
 */
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

/**
 * Initializes the MCP server, connecting it to a StdioServerTransport.
 * Logs success or error messages to the console and exits the process on failure.
 */
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
