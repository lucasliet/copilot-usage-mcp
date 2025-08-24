import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.doMock to hoist the mock before imports
const mockInitialize = vi.fn();
vi.doMock('./src/server.js', () => ({ initialize: mockInitialize }));

// Dynamically import the module to be tested after mocks are set up
const { main, shutdownHandler } = await import('./index.js');

describe('index.js', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const mockProcessOn = vi.spyOn(process, 'on').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('main should call initialize and set up signal handlers', async () => {
    await main();
    expect(mockInitialize).toHaveBeenCalledOnce();
    expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
  });

  it('main should handle fatal error on initialize', async () => {
    mockInitialize.mockRejectedValue(new Error('Init Error'));
    await main();
    expect(mockConsoleError).toHaveBeenCalledWith('❌ Erro fatal:', 'Init Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('shutdownHandler should exit the process', () => {
    shutdownHandler('TEST');
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});