import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({
    insertTypesEntry: true,
    exclude: ['test/**']
  })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LLM',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      // Externalize deps that shouldn't be bundled into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {}
      }
    },
    sourcemap: true,
    // Generate type declarations
    emptyOutDir: true
  },
  // Ensure TypeScript declarations are generated
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  test: {
    // Projects configuration replaces the deprecated workspace file
    projects: [
      // Browser tests project (migrated from vitest.workspace.ts)
      {
        test: {
          testTimeout: 40000,
          name: 'browser',
          setupFiles: ["./test/setup.ts"],
          bail: 1,
          retry: 3,
          printConsoleTrace: true,
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
                headless: false,
              },
            ],
          },
        }
      },
    ]
  }
}) 