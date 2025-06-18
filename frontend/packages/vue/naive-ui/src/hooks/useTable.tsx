import { ref, shallowRef, ShallowRef, Ref, effectScope, watch, onUnmounted, isRef, computed } from 'vue'
import {
	type DataTableProps,
	type DataTableSlots,
	type PaginationProps,
	type PaginationSlots,
	NDataTable,
	NPagination,
	NButton,
} from 'naive-ui'
import { translation, TranslationModule, type TranslationLocale } from '../locals/translation'
import { useMessage } from './useMessage'

import type { UseTableOptions, TableInstanceWithComponent, TableResponse } from '../types/table'

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

		// 分页相关状态
		const { page, pageSize } = alias
		const pageSizeOptionsRef = ref([10, 20, 50, 100, 200]) // 分页选项

		// 初始化分页参数
		if ((param.value as Record<string, unknown>)[page]) {
			;(param.value as Record<string, unknown>)[page] = 1 // 当前页码
		}
		console.log(param.value, pageSize)
		if ((param.value as Record<string, unknown>)[pageSize]) {
			;(param.value as Record<string, unknown>)[pageSize] = getStoredPageSize(storage, 10, pageSizeOptionsRef.value) // 每页条数
			console.log('初始化每页条数', (param.value as Record<string, unknown>)[pageSize])
		}

		/**
		 * 更新页码
		 * @param currentPage 当前页码
		 */
		const handlePageChange = (currentPage: number) => {
			;(param.value as Record<string, unknown>)[page] = currentPage
			fetchData()
		}

		/**
		 * 更新每页条数
		 * @param size 每页条数
		 */
		const handlePageSizeChange = (size: number) => {
			// 保存到本地存储
			savePageSizeToStorage(storage, size)
			;(param.value as Record<string, unknown>)[page] = 1 // 重置页码为1
			;(param.value as Record<string, unknown>)[pageSize] = size
			fetchData()
		}

		/**
		 * 获取表格数据
		 */
		const fetchData = async <T,>() => {
			try {
				loading.value = true
				const rdata: TableResponse<T> = await request(param.value)
				total.value = rdata[tableAlias.value.total as keyof TableResponse<T>] as number
				data.value = {
					list: rdata[tableAlias.value.list as keyof TableResponse<T>] as [],
					total: rdata[tableAlias.value.total as keyof TableResponse<T>] as number,
				}
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
			return (
				<NDataTable
					remote
					ref={example}
					loading={loading.value}
					data={data.value.list}
					columns={columns.value}
					{...props}
					{...attrs}
				>
					{{
						empty: () => (slots?.empty || s2?.slots?.empty ? slots?.empty() || s2?.slots?.empty() : null),
						loading: () => (slots?.loading || s2?.slots?.loading ? slots?.loading() || s2?.slots?.loading() : null),
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
					v-slots={mergedSlots}
				/>
			)
		}

		// 检测到参数变化时，重新请求数据
		if (Array.isArray(watchValue)) {
			// 只监听指定的字段
			const source = computed(() => watchValue.map((key) => param.value[key]))
			watch(source, fetchData, { deep: true })
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
			config: columns,
			props,
			storage,
			handlePageChange,
			handlePageSizeChange,
			pageSizeOptions: pageSizeOptionsRef,
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
