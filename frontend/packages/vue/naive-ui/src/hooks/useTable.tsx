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

import type {
	UseTableOptions,
	TableInstanceWithComponent,
	TableResponse,
	TablePageInstanceWithComponent,
	TablePageProps,
} from '../types/table'

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
 * 表格钩子函数
 * @param options 表格配置选项
 * @returns 表格实例，包含表格状态和方法
 */
export default function useTable<T = Record<string, any>, Z extends Record<string, any> = Record<string, any>>({
	config, // 表格列配置
	request, // 数据请求函数
	defaultValue = ref({}) as Ref<Z>, // 默认请求参数，支持响应式
	watchValue = false, // 监听参数
}: UseTableOptions<T, Z>) {
	const scope = effectScope() // 创建一个作用域，用于管理副作用

	return scope.run(() => {
		// 表格状态
		const columns = shallowRef(config) // 表格列配置
		const loading = ref(false) // 加载状态
		const data = ref({ list: [], total: 0 }) as Ref<{ list: T[]; total: number }> // 表格数据
		const alias = ref({ total: 'total', list: 'list' }) // 表格别名
		const example = ref() // 表格引用
		const param = (isRef(defaultValue) ? defaultValue : ref({ ...(defaultValue as Z) })) as Ref<Z> // 表格请求参数
		const total = ref(0) // 分页参数
		const props = shallowRef({}) as ShallowRef<DataTableProps> // 表格属性
		// const watchData = ref([]) // 监听参数
		const { error: errorMsg } = useMessage()

		/**
		 * 获取表格数据
		 */
		const fetchData = async <T,>() => {
			try {
				loading.value = true
				const rdata: TableResponse<T> = await request(param.value)
				total.value = rdata[alias.value.total as keyof TableResponse<T>] as number
				data.value = {
					list: rdata[alias.value.list as keyof TableResponse<T>] as [],
					total: rdata[alias.value.total as keyof TableResponse<T>] as number,
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
			console.log(slots, s2)
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

		// 检测到参数变化时，重新请求数据
		if (Array.isArray(watchValue)) {
			// 只监听指定的字段
			const source = computed(() => watchValue.map((key) => param.value[key]))
			watch(source, fetchData, { deep: true })
		}
		// 检测到默认参数变化时，合并参数
		// watch(defaultValue, () => (param.value = { ...defaultValue.value, ...param.value }), { deep: true })

		onUnmounted(() => {
			scope.stop() // 停止作用域
		}) // 清理副作用

		// 返回表格实例
		return {
			loading,
			example,
			data,
			alias,
			param,
			total,
			reset: reset<T>,
			fetch: fetchData<T>,
			component,
			config: columns,
			props,
		}
	}) as TableInstanceWithComponent<T, Z>
}

/**
 * @description 扩展表格实例方法
 */
const useTablePage = <T extends Record<string, any> = Record<string, any>>({
	param,
	total,
	alias = { page: 'page', pageSize: 'page_size' }, // 字段别名映射
	props = {},
	slot = {},
	refresh = () => {},
}: TablePageProps<T> & { refresh?: () => void }) => {
	const scope = effectScope() // 创建一个作用域，用于管理副作用
	return scope.run(() => {
		const { page, pageSize } = { ...{ page: 'page', pageSize: 'page_size' }, ...alias }
		const pageSizeOptionsRef = ref([10, 20, 50, 100, 200]) // 当前页码
		const propsRef = ref({ ...props })

		// 如果分页参数不存在，则设置默认值
		if (!(param.value as Record<string, unknown>)[page]) {
			;(param.value as Record<string, unknown>)[page] = 1 // 当前页码
		}

		// 如果分页参数不存在，则设置默认值
		if (!(param.value as Record<string, unknown>)[pageSize]) {
			;(param.value as Record<string, unknown>)[pageSize] = 20 // 每页条数
		}

		/**
		 * @description 更新页码
		 * @param {number} currentPage 当前页码
		 */
		const handlePageChange = (currentPage: number) => {
			param.value = {
				...param.value,
				[page]: currentPage,
			}
			if (refresh) {
				refresh()
			}
		}

		/**
		 * @description 更新每页条数
		 * @param {number} size 每页条数
		 */
		const handlePageSizeChange = (size: number) => {
			param.value = {
				...param.value,
				[page]: 1, // 重置页码为1
				[pageSize]: size,
			}
			if (refresh) {
				refresh()
			}
		}

		// 渲染分页组件
		const component = (props: PaginationProps, context: { slots?: PaginationSlots }) => {
			// 处理插槽
			const mergedSlots = {
				...slot,
				...(context.slots || {}),
			}
			return (
				<NPagination
					page={param.value[page]}
					pageSize={param.value[pageSize]}
					itemCount={total.value}
					pageSizes={pageSizeOptionsRef.value}
					showSizePicker={true}
					onUpdatePage={handlePageChange}
					onUpdatePageSize={handlePageSizeChange}
					{...propsRef.value}
					{...props}
					v-slots={mergedSlots}
				/>
			)
		}

		// 组件卸载
		onUnmounted(() => {
			scope.stop() // 停止作用域
		}) // 清理副作用

		return {
			component,
			handlePageChange,
			handlePageSizeChange,
			pageSizeOptions: pageSizeOptionsRef,
		}
	}) as TablePageInstanceWithComponent
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

export { useTablePage, useTableOperation }
