import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "vite-plugin-turborepo-deploy",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        "fs",
        "path",
        "os",
        "child_process",
        "util",
        "fs-extra",
        "picomatch",
        "simple-git",
        "chalk",
        "zod",
        "vite",
      ],
      output: {
        globals: {
          vite: "vite",
          fs: "fs",
          path: "path",
          os: "os",
          child_process: "childProcess",
          util: "util",
          "fs-extra": "fse",
          picomatch: "picomatch",
          "simple-git": "simpleGit",
          chalk: "chalk",
          zod: "zod",
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
