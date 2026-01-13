import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["packages/**/test/*.spec.ts"],
    setupFiles: ["./.test/setup.ts"],
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
