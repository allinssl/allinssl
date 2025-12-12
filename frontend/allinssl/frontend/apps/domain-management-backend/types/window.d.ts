declare module '@baota/vite-plugin-path-random' {
	export default function randomCachePlugin(): Plugin
	export interface RandomCachePluginOptions {
		cacheKey: string
	}
}
