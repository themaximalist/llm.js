import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        testTimeout: 20000,
        slowTestThreshold: 10000,
        setupFiles: ["./test/setup.ts"],
        bail: 1,
        retry: 0,
        reporters: ["dot"],
        printConsoleTrace: true,
    },
  })
