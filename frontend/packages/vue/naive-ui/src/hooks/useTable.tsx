import { ref, shallowRef, ShallowRef, Ref, effectScope, watch, onUnmounted, isRef, computed } from 'vue'
import {
	type DataTableProps,
	type DataTableSlots,
	type DataTableColumns,
	type PaginationProps,
	type PaginationSlots,
	NDataTable,
	NPagination,
	NButton,
	NDropdown,
	NCheckbox,
	NIcon,
} from 'naive-ui'
import { translation, TranslationModule, type TranslationLocale } from '../locals/translation'
import { useMessage } from './useMessage'

import type { UseTableOptions, TableInstanceWithComponent, TableResponse, ColumnVisibility } from '../types/table'

// 获取当前语言
const currentLocale = localStorage.getItem('locale-active') || 'zhCN'

// 获取翻译文本
const hookT = (key: string, params?: string) => {
	const locale = currentLocale.replace('-', '_').replace(/"/g, '') as TranslationLocale
	const translationFn =
		(translation[locale as TranslationLocale] as TranslationModule).useTable[
			key as keyof TranslationModule['useTable']
		] || translation.zhCN.useTable[key as keyof typeof translation.zhCN.useTable]
	return typeof translationFn === 'function' ? translationFn(params || '') : translationFn
}

/**
 * 从本地存储获取pageSize的纯函数
 * @param storage 存储的key
 * @param defaultSize 默认大小
 * @param pageSizeOptions 可选的页面大小选项
 * @returns 页面大小
 */
const getStoredPageSize = (
	storage: string,
	defaultSize: number = 10,
	pageSizeOptions: number[] = [10, 20, 50, 100, 200],
): number => {
	try {
		if (!storage) return defaultSize
		const stored = localStorage.getItem(storage)
		if (stored) {
			const parsedSize = parseInt(stored, 10)
			// 验证存储的值是否在可选项中
			if (pageSizeOptions.includes(parsedSize)) {
				return parsedSize
			}
		}
	} catch (error) {
		console.warn('读取本地存储pageSize失败:', error)
	}
	return defaultSize
}

/**
 * 保存pageSize到本地存储的纯函数
 * @param storage 存储的key
 * @param size 页面大小
 */
const savePageSizeToStorage = (storage: string, size: number): void => {
	try {
		if (size && storage) localStorage.setItem(storage, size.toString())
	} catch (error) {
		console.warn('保存pageSize到本地存储失败:', error)
	}
}

/**
 * 从本地存储获取列可见性配置的纯函数
 * @param storage 存储的key
 * @param columns 表格列配置
 * @returns 列可见性配置
 */
const getStoredColumnVisibility = (storage: string, columns: any[]): ColumnVisibility => {
	try {
		if (!storage) return getDefaultColumnVisibility(columns)
		const stored = localStorage.getItem(`table-column-settings-${storage}`)
		if (stored) {
			const parsedVisibility = JSON.parse(stored) as ColumnVisibility
			// 验证存储的配置是否与当前列配置匹配
			const defaultVisibility = getDefaultColumnVisibility(columns)
			const mergedVisibility: ColumnVisibility = {}

			// 合并默认配置和存储配置，确保新增的列默认显示
			Object.keys(defaultVisibility).forEach((key) => {
				mergedVisibility[key] = Object.prototype.hasOwnProperty.call(parsedVisibility, key)
					? parsedVisibility[key]
					: defaultVisibility[key]
			})

			return mergedVisibility
		}
	} catch (error) {
		console.warn('读取本地存储列设置失败:', error)
	}
	return getDefaultColumnVisibility(columns)
}

/**
 * 保存列可见性配置到本地存储的纯函数
 * @param storage 存储的key
 * @param visibility 列可见性配置
 */
const saveColumnVisibilityToStorage = (storage: string, visibility: ColumnVisibility): void => {
	try {
		if (storage) localStorage.setItem(`table-column-settings-${storage}`, JSON.stringify(visibility))
	} catch (error) {
		console.warn('保存列设置到本地存储失败:', error)
	}
}

/**
 * 获取默认列可见性配置的纯函数
 * @param columns 表格列配置
 * @returns 默认列可见性配置
 */
const getDefaultColumnVisibility = (columns: any[]): ColumnVisibility => {
	const visibility: ColumnVisibility = {}
	columns.forEach((column) => {
		// 使用类型断言来访问 key 属性
		const col = column as any
		if (col.key) {
			visibility[col.key] = true // 默认所有列都显示
		}
	})
	return visibility
}
/**
 * 表格钩子函数
 * @param options 表格配置选项
 * @returns 表格实例，包含表格状态和方法
 */
export default function useTable<T = Record<string, any>, Z extends Record<string, any> = Record<string, any>>({
	config, // 表格列配置
	request, // 数据请求函数
	defaultValue = ref({}) as Ref<Z>, // 默认请求参数，支持响应式
	watchValue = false, // 监听参数
	alias = { page: 'page', pageSize: 'page_size' }, // 分页字段别名映射
	storage = '', // 本地存储的key
}: UseTableOptions<T, Z> & {}) {
	const scope = effectScope() // 创建一个作用域，用于管理副作用
	return scope.run(() => {
		// 表格状态
		const columns = shallowRef(config) // 表格列配置
		const loading = ref(false) // 加载状态
		const data = ref({ list: [], total: 0 }) as Ref<{ list: T[]; total: number }> // 表格数据
		const tableAlias = ref({ total: 'total', list: 'list' }) // 表格别名
		const example = ref() // 表格引用
		const param = (isRef(defaultValue) ? defaultValue : ref({ ...(defaultValue as Z) })) as Ref<Z> // 表格请求参数
		const total = ref(0) // 分页参数
		const props = shallowRef({}) as ShallowRef<DataTableProps> // 表格属性
		const { error: errorMsg } = useMessage()

		// 列设置状态
		const columnVisibility = ref<ColumnVisibility>(getStoredColumnVisibility(storage, config))

		// 计算过滤后的列配置
		const filteredColumns = computed(() => {
			return config.filter((column) => {
				const col = column as any
				if (!col.key) return true // 没有key的列始终显示
				return columnVisibility.value[col.key] !== false
			})
		})

		// 计算可见列的详细宽度信息
		const visibleColumnsWidth = computed(() => {
			let normalColumnsWidth = 0
			let fixedColumnsWidth = 0
			let totalWidth = 0

			filteredColumns.value.forEach((column) => {
				const col = column as any
				if (col.width) {
					// 处理数字和字符串类型的宽度
					const width = typeof col.width === 'string' ? parseInt(col.width) : col.width
					if (!isNaN(width)) {
						totalWidth += width
						if (col.fixed) {
							fixedColumnsWidth += width
						} else {
							normalColumnsWidth += width
						}
					}
				}
			})

			return {
				totalWidth,
				normalColumnsWidth,
				fixedColumnsWidth,
			}
		})

		// 精确计算动态 scroll-x 值
		const dynamicScrollX = computed(() => {
			const { totalWidth, normalColumnsWidth, fixedColumnsWidth } = visibleColumnsWidth.value

			if (totalWidth <= 0) {
				return undefined
			}

			// 精确的表格补偿计算
			// 基于 Naive UI DataTable 的实际渲染需求
			const TABLE_BORDER = 2 // 表格边框 (左右各1px)
			const TABLE_PADDING = 16 // 表格内边距 (Naive UI 默认)
			const SCROLL_COMPENSATION = 4 // 滚动区域补偿

			// 总补偿宽度：保守且精确
			const totalCompensation = TABLE_BORDER + TABLE_PADDING + SCROLL_COMPENSATION

			// 最终宽度 = 实际列宽度 + 精确补偿
			const preciseWidth = totalWidth + totalCompensation

			return preciseWidth
		})

		// 分页相关状态
		const { page, pageSize } = alias
		const pageSizeOptionsRef = ref([10, 20, 50, 100, 200]) // 分页选项

		// 防重复请求相关状态
		const lastDirectRequestTime = ref(0) // 记录最后一次直接请求的时间
		const REQUEST_DEBOUNCE_DELAY = 100 // 防抖延迟时间（毫秒）

		// 初始化分页参数
		if ((param.value as Record<string, unknown>)[page]) {
			;(param.value as Record<string, unknown>)[page] = 1 // 当前页码
		}

		if ((param.value as Record<string, unknown>)[pageSize]) {
			;(param.value as Record<string, unknown>)[pageSize] = getStoredPageSize(storage, 10, pageSizeOptionsRef.value) // 每页条数
		}

		/**
		 * 更新页码
		 * @param currentPage 当前页码
		 */
		const handlePageChange = (currentPage: number) => {
			// 记录直接请求时间，防止 watch 重复触发
			lastDirectRequestTime.value = Date.now()
			;(param.value as Record<string, unknown>)[page] = currentPage
			fetchData()
		}

		/**
		 * 更新每页条数
		 * @param size 每页条数
		 */
		const handlePageSizeChange = (size: number) => {
			// 记录直接请求时间，防止 watch 重复触发
			lastDirectRequestTime.value = Date.now()
			// 保存到本地存储
			savePageSizeToStorage(storage, size)
			;(param.value as Record<string, unknown>)[page] = 1 // 重置页码为1
			;(param.value as Record<string, unknown>)[pageSize] = size
			fetchData()
		}

		/**
		 * 切换列可见性
		 * @param columnKey 列的key
		 */
		const toggleColumnVisibility = (columnKey: string) => {
			columnVisibility.value = {
				...columnVisibility.value,
				[columnKey]: !columnVisibility.value[columnKey],
			}
			// 保存到本地存储
			saveColumnVisibilityToStorage(storage, columnVisibility.value)
		}

		/**
		 * 重置列设置
		 */
		const resetColumnSettings = () => {
			const defaultVisibility = getDefaultColumnVisibility(config)
			columnVisibility.value = defaultVisibility
			// 保存到本地存储
			saveColumnVisibilityToStorage(storage, defaultVisibility)
		}

		/**
		 * 获取表格数据
		 */
		const fetchData = async <T,>(resetPage?: boolean) => {
			try {
				loading.value = true
				const rdata: TableResponse<T> = await request(param.value)
				total.value = rdata[tableAlias.value.total as keyof TableResponse<T>] as number
				data.value = {
					list: rdata[tableAlias.value.list as keyof TableResponse<T>] as [],
					total: rdata[tableAlias.value.total as keyof TableResponse<T>] as number,
				}
				// 如果需要重置页码，则重置页码
				if (resetPage) (param.value as Record<string, unknown>)[page] = 1
				return data.value
			} catch (error: any) {
				errorMsg(error.message)
				console.error('请求数据失败:', error)
			} finally {
				loading.value = false
			}
		}

		/**
		 * 重置表格状态和数据
		 */
		const reset = async <T,>() => {
			param.value = defaultValue.value
			return await fetchData<T>()
		}

		/**
		 * 渲染表格组件
		 */
		const component = (props: DataTableProps, context: { slots?: DataTableSlots }) => {
			const { slots, ...attrs } = props as any
			const s2 = context

			// 合并动态 scroll-x 值
			const mergedProps = {
				...props,
				...attrs,
			}

			// 精确的 scroll-x 处理：确保容器宽度与内容宽度完全匹配
			if (dynamicScrollX.value) {
				// 始终使用动态计算的精确宽度，确保无浏览器自动拉伸
				mergedProps.scrollX = dynamicScrollX.value
			}

			return (
				<NDataTable
					remote
					ref={example}
					loading={loading.value}
					data={data.value.list}
					columns={filteredColumns.value}
					scrollbar-props={{
						xPlacement: 'top',
					}}
					{...mergedProps}
				>
					{{
						empty: () => (slots?.empty || s2?.slots?.empty ? slots?.empty?.() || s2?.slots?.empty?.() : null),
						loading: () => (slots?.loading || s2?.slots?.loading ? slots?.loading?.() || s2?.slots?.loading?.() : null),
					}}
				</NDataTable>
			)
		}

		/**
		 * 渲染分页组件
		 */
		const paginationComponent = (paginationProps: PaginationProps = {}, context: { slots?: PaginationSlots } = {}) => {
			const mergedSlots = {
				...(context?.slots || {}),
			}
			return (
				<NPagination
					page={(param.value as Record<string, unknown>)[page] as number}
					pageSize={(param.value as Record<string, unknown>)[pageSize] as number}
					itemCount={total.value}
					pageSizes={pageSizeOptionsRef.value}
					showSizePicker={true}
					onUpdatePage={handlePageChange}
					onUpdatePageSize={handlePageSizeChange}
					{...paginationProps}
					v-slots={{
						...mergedSlots,
						prefix: () => <span>{hookT('total', `${total.value}`)}</span>,
					}}
				/>
			)
		}

		/**
		 * 渲染列设置组件
		 */
		const columnSettingsComponent = () => {
			// 生成下拉选项
			const dropdownOptions = [
				{
					key: 'header',
					type: 'render',
					render: () => (
						<div style="padding: 8px 12px; font-weight: 500; color: var(--n-text-color);">
							{hookT('columnSettings')}
						</div>
					),
				},
				{
					key: 'divider1',
					type: 'divider',
				},
				...config
					.filter((column) => (column as any).key)
					.map((column) => {
						const col = column as any
						return {
							key: col.key,
							type: 'render',
							render: () => (
								<div
									style="padding: 4px 12px; cursor: pointer; display: flex; align-items: center;"
									onClick={(e: Event) => {
										e.stopPropagation()
										toggleColumnVisibility(col.key)
									}}
								>
									<NCheckbox
										checked={columnVisibility.value[col.key] !== false}
										onUpdateChecked={() => toggleColumnVisibility(col.key)}
										style="pointer-events: none;"
									/>
									<span style="margin-left: 8px; flex: 1;">{col.title || col.key}</span>
								</div>
							),
						}
					}),
				{
					key: 'divider2',
					type: 'divider',
				},
				{
					key: 'reset',
					type: 'render',
					render: () => (
						<div
							style="padding: 8px 12px; cursor: pointer; color: var(--n-color-target);"
							onClick={() => resetColumnSettings()}
						>
							{hookT('resetColumns')}
						</div>
					),
				},
			]

			return (
				<NDropdown options={dropdownOptions} trigger="click" placement="bottom-end" showArrow={false}>
					<NButton quaternary circle size="small" title={hookT('columnSettings')}>
						<NIcon size={16}>
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M3 4H21V6H3V4ZM3 11H15V13H3V11ZM3 18H21V20H3V18Z" fill="currentColor" />
								<path d="M16 11H18V13H16V11ZM19 11H21V13H19V11Z" fill="currentColor" />
							</svg>
						</NIcon>
					</NButton>
				</NDropdown>
			)
		}

		// 检测到参数变化时，重新请求数据
		if (Array.isArray(watchValue)) {
			// 只监听指定的字段
			const source = computed(() => watchValue.map((key) => param.value[key]))
			watch(
				source,
				() => {
					// 检查是否刚刚有直接请求，如果是则跳过此次 watch 触发的请求
					const timeSinceLastDirectRequest = Date.now() - lastDirectRequestTime.value
					if (timeSinceLastDirectRequest < REQUEST_DEBOUNCE_DELAY) {
						return
					}
					fetchData()
				},
				{ deep: true },
			)
		}

		onUnmounted(() => {
			scope.stop() // 停止作用域
		}) // 清理副作用

		// 返回表格实例
		return {
			loading,
			example,
			data,
			tableAlias,
			param,
			total,
			reset: reset<T>,
			fetch: fetchData<T>,
			TableComponent: component,
			PageComponent: paginationComponent,
			ColumnSettingsComponent: columnSettingsComponent,
			config: columns,
			props,
			storage,
			handlePageChange,
			handlePageSizeChange,
			pageSizeOptions: pageSizeOptionsRef,
			columnVisibility,
			toggleColumnVisibility,
			resetColumnSettings,
			filteredColumns,
			visibleColumnsWidth,
			dynamicScrollX,
		}
	}) as TableInstanceWithComponent<T, Z>
}

/**
 * @description 表格列hook--操作列
 */
const useTableOperation = (
	options: {
		title: string
		width?: number
		onClick: (row: any) => void
		isHide?: boolean | ((row: any) => boolean)
	}[],
	others?: any,
) => {
	const width = options.reduce((accumulator, option) => accumulator + (option.width || 40), 0) + 20
	return {
		title: hookT('operation'),
		key: 'CreatedAt',
		width,
		fixed: 'right' as const,
		align: 'right' as const,
		render: (row: any) => {
			const buttons: JSX.Element[] = []
			for (let index = 0; index < options.length; index++) {
				const option = options[index]
				const isHide =
					typeof option.isHide === 'function'
						? option.isHide(row)
						: typeof option.isHide === 'boolean'
							? option.isHide
							: false
				if (isHide) continue
				buttons.push(
					<NButton size="small" text type="primary" onClick={() => option.onClick(row)}>
						{option.title}
					</NButton>,
				)
			}

			return (
				<div class="flex justify-end">
					{buttons.map((button, index) => (
						<>
							{button}
							{index < buttons.length - 1 && <span class="mx-[.8rem] text-[#dcdfe6]">|</span>}
						</>
					))}
				</div>
			)
		},
		...others,
	}
}

export { useTableOperation }
