/// <reference types="vite/client" />

declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}

declare module '@vicons/tabler' {
	import type { Component } from 'vue'
	const component: Component
	export const Input: Component
	export const Numbers: Component
	export const Select: Component
	export const CircleCheck: Component
	export const Checkbox: Component
	export const ToggleLeft: Component
	export const Calendar: Component
	export const Clock: Component
	export const Palette: Component
	export const Adjustments: Component
	export const Star: Component
	export const ArrowsExchange: Component
	export const At: Component
	export const List: Component
	export const Tags: Component
	export const Search: Component
	export const ChevronDown: Component
	export const Tree: Component
	export const Upload: Component
}
