import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "app"),
      "~~": resolve(__dirname),
      "~~/": `${resolve(__dirname)}/`,
      "~/": `${resolve(__dirname, "app")}/`,
    },
  },
});
