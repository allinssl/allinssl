declare module 'react-dnd-html5-backend' {
	const HTML5Backend: any
	export { HTML5Backend }
}

declare module 'vue3-dnd' {
	import { DefineComponent } from 'vue'

	export interface DragSourceMonitor<T = any> {
		canDrag(): boolean
		isDragging(): boolean
		getItem(): T
		getItemType(): string
		getDropResult(): any
		didDrop(): boolean
	}

	export interface DropTargetMonitor<T = any> {
		canDrop(): boolean
		isOver(options?: { shallow?: boolean }): boolean
		getItem(): T
		getItemType(): string
		getDropResult(): any
		didDrop(): boolean
	}

	export interface DndProviderProps {
		backend: any
	}

	export interface CollectedProps {
		[key: string]: any
	}

	export function useDrag<Item = unknown, DropResult = unknown, Collected extends CollectedProps = CollectedProps>(
		spec: () => {
			type: string
			item: Item
			collect?: (monitor: DragSourceMonitor<Item>) => Collected
		},
	): [{ value: Collected }, (el: any) => void]

	export function useDrop<Item = unknown, DropResult = unknown, Collected extends CollectedProps = CollectedProps>(
		spec: () => {
			accept: string | string[]
			drop?: (item: Item, monitor: DropTargetMonitor<Item>) => DropResult | undefined
			collect?: (monitor: DropTargetMonitor<Item>) => Collected
		},
	): [{ value: Collected }, (el: any) => void]

	export const DndProvider: DefineComponent<{
		backend: any
	}>

	export const HTML5Backend: any
}
