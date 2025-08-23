#!/usr/bin/env node

import { initialize } from './src/server.js';

// Tratar sinais de encerramento gracefully
const shutdownHandler = (signal) => {
  console.log(`\n🔄 Encerrando Copilot Usage MCP Server... (sinal: ${signal})`);
  process.exit(0);
};

process.on('SIGINT', () => shutdownHandler('SIGINT'));
process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

initialize().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});