// vite.config.ts
import { defineConfig } from "file:///E:/work/tools-monorepo/node_modules/.pnpm/vite@5.4.21_@types+node@24._822874a28f046f5c375b62e352491bb8/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///E:/work/tools-monorepo/node_modules/.pnpm/vite-plugin-dts@3.9.1_@type_4543bba22f44e4f7826d692025742a51/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "E:\\work\\tools-monorepo\\packages\\vue\\pinia";
var vite_config_default = defineConfig({
  plugins: [
    dts({
      include: ["*.ts"],
      beforeWriteFile: (filePath, content) => ({
        filePath: filePath.replace(/src/, ""),
        content
      })
    })
  ],
  build: {
    outDir: resolve(__vite_injected_original_dirname, "dist"),
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        utils: resolve(__vite_injected_original_dirname, "src/utils.ts")
      },
      name: "BaotaPinia",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "mjs" : "cjs"}`
    },
    rollupOptions: {
      external: ["pinia", "pinia-plugin-persistedstate"],
      output: {
        globals: {
          pinia: "Pinia",
          "pinia-plugin-persistedstate": "piniaPluginPersistedstate"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFx3b3JrXFxcXHRvb2xzLW1vbm9yZXBvXFxcXHBhY2thZ2VzXFxcXHZ1ZVxcXFxwaW5pYVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcd29ya1xcXFx0b29scy1tb25vcmVwb1xcXFxwYWNrYWdlc1xcXFx2dWVcXFxccGluaWFcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L3dvcmsvdG9vbHMtbW9ub3JlcG8vcGFja2FnZXMvdnVlL3BpbmlhL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdHBsdWdpbnM6IFtcblx0XHRkdHMoe1xuXHRcdFx0aW5jbHVkZTogWycqLnRzJ10sXG5cdFx0XHRiZWZvcmVXcml0ZUZpbGU6IChmaWxlUGF0aCwgY29udGVudCkgPT4gKHtcblx0XHRcdFx0ZmlsZVBhdGg6IGZpbGVQYXRoLnJlcGxhY2UoL3NyYy8sICcnKSxcblx0XHRcdFx0Y29udGVudCxcblx0XHRcdH0pLFxuXHRcdH0pLFxuXHRdLFxuXHRidWlsZDoge1xuXHRcdG91dERpcjogcmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0JyksXG5cdFx0ZW1wdHlPdXREaXI6IHRydWUsXG5cdFx0bGliOiB7XG5cdFx0XHRlbnRyeToge1xuXHRcdFx0XHRpbmRleDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcblx0XHRcdFx0dXRpbHM6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3V0aWxzLnRzJyksXG5cdFx0XHR9LFxuXHRcdFx0bmFtZTogJ0Jhb3RhUGluaWEnLFxuXHRcdFx0Zm9ybWF0czogWydlcycsICdjanMnXSxcblx0XHRcdGZpbGVOYW1lOiAoZm9ybWF0LCBlbnRyeU5hbWUpID0+IGAke2VudHJ5TmFtZX0uJHtmb3JtYXQgPT09ICdlcycgPyAnbWpzJyA6ICdjanMnfWAsXG5cdFx0fSxcblx0XHRyb2xsdXBPcHRpb25zOiB7XG5cdFx0XHRleHRlcm5hbDogWydwaW5pYScsICdwaW5pYS1wbHVnaW4tcGVyc2lzdGVkc3RhdGUnXSxcblx0XHRcdG91dHB1dDoge1xuXHRcdFx0XHRnbG9iYWxzOiB7XG5cdFx0XHRcdFx0cGluaWE6ICdQaW5pYScsXG5cdFx0XHRcdFx0J3BpbmlhLXBsdWdpbi1wZXJzaXN0ZWRzdGF0ZSc6ICdwaW5pYVBsdWdpblBlcnNpc3RlZHN0YXRlJyxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0fSxcblx0fSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlULFNBQVMsb0JBQW9CO0FBQ3RWLFNBQVMsZUFBZTtBQUN4QixPQUFPLFNBQVM7QUFGaEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBLElBQ1IsSUFBSTtBQUFBLE1BQ0gsU0FBUyxDQUFDLE1BQU07QUFBQSxNQUNoQixpQkFBaUIsQ0FBQyxVQUFVLGFBQWE7QUFBQSxRQUN4QyxVQUFVLFNBQVMsUUFBUSxPQUFPLEVBQUU7QUFBQSxRQUNwQztBQUFBLE1BQ0Q7QUFBQSxJQUNELENBQUM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTixRQUFRLFFBQVEsa0NBQVcsTUFBTTtBQUFBLElBQ2pDLGFBQWE7QUFBQSxJQUNiLEtBQUs7QUFBQSxNQUNKLE9BQU87QUFBQSxRQUNOLE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsUUFDeEMsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUN6QztBQUFBLE1BQ0EsTUFBTTtBQUFBLE1BQ04sU0FBUyxDQUFDLE1BQU0sS0FBSztBQUFBLE1BQ3JCLFVBQVUsQ0FBQyxRQUFRLGNBQWMsR0FBRyxTQUFTLElBQUksV0FBVyxPQUFPLFFBQVEsS0FBSztBQUFBLElBQ2pGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDZCxVQUFVLENBQUMsU0FBUyw2QkFBNkI7QUFBQSxNQUNqRCxRQUFRO0FBQUEsUUFDUCxTQUFTO0FBQUEsVUFDUixPQUFPO0FBQUEsVUFDUCwrQkFBK0I7QUFBQSxRQUNoQztBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
