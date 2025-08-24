import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.js', 'index.js'],
      exclude: [
        'src/mocks/**',
        '**/*.test.js',
        'vitest.config.js'
      ],
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
});
