#!/usr/bin/env node

import { initialize } from './src/server.js';

export const shutdownHandler = (signal) => {
  console.log(`\n🔄 Encerrando Copilot Usage MCP Server... (sinal: ${signal})`);
  process.exit(0);
};

export const main = async () => {
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

  try {
    await initialize();
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
};

// Executa a função principal apenas se o módulo não for importado por um teste
if (process.env.NODE_ENV !== 'test') {
  main();
}
