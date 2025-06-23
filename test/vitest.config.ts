import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        testTimeout: 40000,
        slowTestThreshold: 15000,
        setupFiles: ["./test/setup.ts"],
        bail: 1,
        retry: 5,
        reporters: ["dot"],
        printConsoleTrace: true,
    },
  })
