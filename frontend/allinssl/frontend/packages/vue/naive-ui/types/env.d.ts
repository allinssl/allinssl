/// <reference types="vite/client" />

declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}

declare module '@vue-dnd/core' {
	export const HTML5Backend: any
}

declare module '@vue-dnd/vue3' {
	export const useDrag: any
	export const useDrop: any
	export const DndProvider: any
}

declare module 'vue3-dnd' {
	import type { Ref, DefineComponent } from 'vue'

	export interface DragSourceMonitor<T = any> {
		isDragging(): boolean
		getItem(): T
	}

	export interface DropTargetMonitor<T = any> {
		isOver(): boolean
		getItem(): T
	}

	export interface DragSourceOptions<T = any> {
		type: string
		item: T
		collect?: (monitor: DragSourceMonitor<T>) => any
	}

	export interface DropTargetOptions<T = any> {
		accept: string | string[]
		drop?: (item: T, monitor: DropTargetMonitor<T>) => void
		collect?: (monitor: DropTargetMonitor<T>) => any
	}

	export function useDrag<T = any>(options: () => DragSourceOptions<T>): [Ref<any>, (el: any) => void]

	export function useDrop<T = any>(options: () => DropTargetOptions<T>): [Ref<any>, (el: any) => void]

	export const DndProvider: DefineComponent
}

declare module 'react-dnd-html5-backend' {
	export const HTML5Backend: any
}

declare namespace JSX {
	interface IntrinsicElements {
		[elem: string]: any
	}
}
