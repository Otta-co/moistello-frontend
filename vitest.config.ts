import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    include: /\.tsx?$/,
  },
  // oxc: false is required because vitest v4's oxc parser does not
  // support the @/ path alias used by this project's tsconfig.
  oxc: false,
})
