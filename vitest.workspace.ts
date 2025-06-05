import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // If you want to keep running your existing tests in Node.js, uncomment the next line.
  // 'vite.config.ts',
  {
    extends: 'vite.config.ts',
    test: {
      testTimeout: 40000,
      // slowTestThreshold: 15000,
      setupFiles: ["./test/setup.ts"],
      bail: 1,
      retry: 0,
      // reporters: ["dot"],
      printConsoleTrace: true,
      browser: {
        enabled: true,
        provider: 'playwright',
        // https://vitest.dev/guide/browser/playwright
        instances: [
          {
            browser: 'chromium',
            headless: true,
          },
        ],
      },
    },
  },
])
