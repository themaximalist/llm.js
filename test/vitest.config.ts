import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        testTimeout: 20000,
        slowTestThreshold: 15000,
        globalSetup: "./test/globalSetup.ts",
        setupFiles: ["./test/setup.ts"],
        bail: 1,
        retry: 0,
        // reporters: ["dot"],
        printConsoleTrace: true,
    },
  })
