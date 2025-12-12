import { ref, computed, watch, VNode, isRef } from 'vue'
import type { Ref } from 'vue'
import { NInput, NIcon } from 'naive-ui'
import { Search } from '@vicons/ionicons5'
import { useTimeoutFn, useDebounceFn } from '@vueuse/core'

/**
 * 搜索回调函数类型
 */
export type SearchCallback = (value: string, isReset?: boolean) => void | Promise<void>

/**
 * 搜索配置选项接口
 */
export interface UseSearchOptions {
	/** 搜索回调函数 */
	onSearch?: SearchCallback
	/** 初始搜索值 */
	value?: string | Ref<string>
	/** 输入框占位符文本 */
	placeholder?: string
	/** 清空搜索时的延迟时间（毫秒） */
	clearDelay?: number
	/** 输入框尺寸 */
	size?: 'small' | 'medium' | 'large'
	/** 是否可清空 */
	clearable?: boolean
	/** 自定义输入框类名 */
	className?: string
	/** 是否禁用 */
	disabled?: boolean
	/** 是否自动去除首尾空格 */
	trim?: boolean
	/** 输入时是否实时搜索 */
	immediate?: boolean
	/** 实时搜索的防抖延迟（毫秒） */
	debounceDelay?: number
}

/**
 * useSearch 返回值接口
 */
export interface UseSearchReturn {
	/** 搜索值的响应式引用 */
	value: Ref<string>
	/** 是否有搜索内容 */
	hasSearchValue: Ref<boolean>
	/** 处理键盘事件的函数 */
	handleKeydown: (event: KeyboardEvent) => void
	/** 处理清空事件的函数 */
	handleClear: () => void
	/** 处理搜索图标点击事件的函数 */
	handleSearchClick: () => void
	/** 手动触发搜索的函数 */
	search: (isReset?: boolean) => void
	/** 防抖搜索函数 */
	debouncedSearch: () => void
	/** 清空搜索内容的函数 */
	clear: () => void
	/** 设置搜索值的函数 */
	setValue: (value: string) => void
	/** 渲染搜索输入框组件的函数 */
	SearchComponent: (customProps?: Record<string, any>) => VNode
}

/**
 * 搜索功能的 hooks 函数
 * @param options 搜索配置选项
 * @returns 搜索相关的状态和方法
 */
export default function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
	const {
		onSearch,
		value = '',
		placeholder = '请输入搜索内容',
		clearDelay = 100,
		size = 'large',
		clearable = true,
		className = 'min-w-[300px]',
		disabled = false,
		trim = true,
		immediate = false,
		debounceDelay = 300,
	} = options

	// 搜索值的响应式状态
	const searchValue = isRef(value) ? value : ref<string>(value)

	// 计算属性：是否有搜索内容
	const hasSearchValue = computed(() => {
		const value = trim ? searchValue.value.trim() : searchValue.value
		return value.length > 0
	})

	/**
	 * 执行搜索操作
	 * @param isReset 是否为重置操作
	 */
	const search = (isReset: boolean = false): void => {
		if (onSearch) {
			const value = trim ? searchValue.value.trim() : searchValue.value
			onSearch(value, isReset)
		}
	}

	// 防抖搜索函数
	const debouncedSearch = useDebounceFn(() => {
		search()
	}, debounceDelay)

	// 实时搜索监听
	if (immediate && onSearch) {
		watch(searchValue, () => {
			debouncedSearch()
		})
	}

	/**
	 * 处理键盘按下事件
	 * @param event 键盘事件
	 */
	const handleKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter') search()
	}

	/**
	 * 处理清空事件
	 */
	const handleClear = (): void => {
		searchValue.value = ''
		// 使用延迟执行清空后的搜索
		useTimeoutFn(() => {
			search(true)
		}, clearDelay)
	}

	/**
	 * 处理搜索图标点击事件
	 */
	const handleSearchClick = (): void => {
		search(true)
	}

	/**
	 * 清空搜索内容
	 */
	const clear = (): void => {
		searchValue.value = ''
	}

	/**
	 * 设置搜索值
	 * @param value 要设置的值
	 */
	const setValue = (value: string): void => {
		searchValue.value = value
	}

	/**
	 * 渲染搜索输入框组件
	 * @param customProps 自定义属性
	 * @returns 搜索输入框的 VNode
	 */
	const renderSearchInput = (customProps: Record<string, any> = {}): VNode => {
		const mergedProps = {
			value: searchValue.value,
			'onUpdate:value': (value: string) => {
				searchValue.value = value
			},
			onKeydown: handleKeydown,
			onClear: handleClear,
			placeholder,
			clearable,
			size,
			disabled,
			class: className,
			...customProps,
		}

		return (
			<NInput
				{...mergedProps}
				v-slots={{
					suffix: () => (
						<div class="flex items-center cursor-pointer" onClick={handleSearchClick}>
							<NIcon component={Search} class="text-[var(--text-color-3)] w-[1.6rem] font-bold" />
						</div>
					),
				}}
			/>
		)
	}

	return {
		value: searchValue,
		hasSearchValue,
		handleKeydown,
		handleClear,
		handleSearchClick,
		search,
		debouncedSearch,
		clear,
		setValue,
		SearchComponent: renderSearchInput,
	}
}
