import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        testTimeout: 60000,
        slowTestThreshold: 15000,
        globalSetup: "./test/globalSetup.ts",
        setupFiles: ["./test/setup.ts"],
        bail: 1,
        retry: 5,
        // reporters: ["dot"],
        printConsoleTrace: true,
    },
  })
