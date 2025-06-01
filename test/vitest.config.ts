import { defineConfig } from "vitest/config";


export default defineConfig({
    test: {
        testTimeout: 12500,
        slowTestThreshold: 7500,
    },
  })