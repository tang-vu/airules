import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./tests/build-cli.ts"],
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["tests/**", "dist/**", "node_modules/**", "**/*.config.ts", "**/*.d.ts"],
    },
  },
});
