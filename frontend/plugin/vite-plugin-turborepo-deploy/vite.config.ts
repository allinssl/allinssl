import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VitePluginTurborepoDeploy",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      external: [
        "vite",
        "fs-extra",
        "simple-git",
        "chalk",
        "ora",
        "zod",
        "path",
        "os",
        "crypto",
        "child_process",
        "util",
        "fs",
        "picomatch",
      ],
      output: {
        globals: {
          vite: "Vite",
          "fs-extra": "fsExtra",
          "simple-git": "simpleGit",
          chalk: "Chalk",
          ora: "Ora",
          zod: "Zod",
          path: "path",
          os: "os",
          crypto: "crypto",
          child_process: "childProcess",
          util: "util",
          fs: "fs",
          picomatch: "picomatch",
        },
      },
    },
    sourcemap: true,
    minify: false, // Easier debugging for the plugin itself
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      outputDir: "dist",
      staticImport: true,
      skipDiagnostics: false,
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