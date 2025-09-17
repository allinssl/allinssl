import { defineConfig } from "vite";
import UnoCSS from "@unocss/vite";
import { resolve } from "path";
// import htmlToPhpTemplatePlugin from "@baota/vite-plugin-html-to-php-template";

/**
 * Vite配置文件
 * 支持UnoCSS和多页HTML应用，以及HTML到PHP模板的转换
 */
export default defineConfig({
  plugins: [
    UnoCSS(),
    // HTML到PHP模板转换插件配置
    // htmlToPhpTemplatePlugin({
    //   // 包含的文件模式（相对于dist目录）
    //   include: ["*.html"],

    //   // 排除的文件模式
    //   exclude: ["node_modules/**"],

    //   // PHP模板输出目录
    //   outputDir: "dist/",
    // }),
  ],
  resolve: {
    alias: {
      "@utils": resolve(__dirname, "src/utils"),
      "@utils/*": resolve(__dirname, "src/utils/*"),
      "@api": resolve(__dirname, "src/api"),
      "@api/*": resolve(__dirname, "src/api/*"),
      "@types": resolve(__dirname, "src/types"),
      "@types/*": resolve(__dirname, "src/types/*"),
    },
  },
  build: {
    minify: "terser", // 混淆器，terser构建后文件体积更小
    sourcemap: false,
    cssCodeSplit: true, // 不分割css代码
    reportCompressedSize: false, // 不统计gzip压缩后的文件大小
    chunkSizeWarningLimit: 800, // 警告阈值
    assetsInlineLimit: 2048, // 小于2kb的资源内联
    modulePreload: false, // 禁用预加载
    terserOptions: {
      // 打包后移除console和注释
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true, // 生产环境移除debugger
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        registration: resolve(__dirname, "domain-query-register.html"),
        whois: resolve(__dirname, "domain-whois.html"),
      },
      strictDeprecations: true, // 严格弃用
      output: {
        entryFileNames: `static/vite/js/[name].js`,
        chunkFileNames: `static/vite/js/[name].js`,
        assetFileNames: (chunkInfo) => {
          const { names } = chunkInfo;
          let ext = "[ext]";
          if (names && names.length > 0) {
            const name = names[0];
            const str = name.substring(name.lastIndexOf(".") + 1);
            if (str === "ttf" || str === "woff" || str === "woff2")
              ext = "font";
          }
          return `static/vite/${ext}/[name].[ext]`;
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    proxy: {
      "/proxy": {
        target: "http://192.168.77.150:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy/, ""),
      },
    },
  },
});
