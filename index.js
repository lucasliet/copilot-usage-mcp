#!/usr/bin/env node

import { initialize } from './src/server.js';

/**
 * Handles shutdown signals (SIGINT, SIGTERM) to gracefully terminate the server.
 * Logs a message indicating the shutdown and exits the process.
 *
 * @param {string} signal - The name of the signal received (e.g., 'SIGINT', 'SIGTERM').
 */
const shutdownHandler = (signal) => {
  console.log(`\n🔄 Encerrando Copilot Usage MCP Server... (sinal: ${signal})`);
  process.exit(0);
};

/**
 * Listens for the SIGINT signal (Ctrl+C) to trigger a graceful shutdown.
 */
process.on('SIGINT', () => shutdownHandler('SIGINT'));

/**
 * Listens for the SIGTERM signal to trigger a graceful shutdown.
 */
process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

/**
 * Initializes the MCP server and handles any fatal errors during startup.
 * If an error occurs, it logs the error and exits the process with a non-zero status code.
 */
initialize().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});