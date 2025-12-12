import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VitePluginTurborepoDeploy",
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        // Vite
        "vite",
        // Node.js built-ins
        "path",
        "os",
        "crypto",
        "child_process",
        "util",
        "fs",
        "stream",
        "events",
        "zlib",
        "assert",
        "constants",
        "url",
        "buffer",
        "string_decoder",
        // Node.js prefixed modules
        "node:path",
        "node:os",
        "node:crypto",
        "node:child_process",
        "node:util",
        "node:fs",
        "node:fs/promises",
        "node:stream",
        "node:events",
        "node:zlib",
        "node:assert",
        "node:constants",
        "node:url",
        "node:buffer",
        "node:string_decoder",
        // Third-party dependencies
        "fs-extra",
        "simple-git",
        "chalk",
        "ora",
        "zod",
        "picomatch",
        "archiver",
        "yauzl",
      ],
      output: {
        globals: {
          vite: "Vite",
          path: "path",
          os: "os",
          crypto: "crypto",
          child_process: "childProcess",
          util: "util",
          fs: "fs",
          stream: "stream",
          events: "events",
          zlib: "zlib",
          assert: "assert",
          constants: "constants",
          url: "url",
          buffer: "buffer",
          string_decoder: "stringDecoder",
          "fs-extra": "fsExtra",
          "simple-git": "simpleGit",
          chalk: "Chalk",
          ora: "Ora",
          zod: "Zod",
          picomatch: "picomatch",
          archiver: "archiver",
          yauzl: "yauzl",
        },
      },
    },
    sourcemap: true,
    minify: false, // Easier debugging for the plugin itself
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: "dist",
      staticImport: true,
    }),
  ],
  // 优化构建过程中的代码分析
  optimizeDeps: {
    // 预构建这些依赖以提高开发模式下的性能
    include: ["fs-extra", "simple-git", "chalk", "ora", "zod", "picomatch"],
    // 告诉 Vite 这些是 ESM / CJS 依赖
    esbuildOptions: {
      // Node.js 全局变量定义
      define: {
        global: "globalThis",
      },
    },
  },
}); 