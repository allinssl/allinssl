import type { DataTableColumns, DataTableInst, DataTableProps } from 'naive-ui'
import type { Ref } from 'vue'

/** 表格请求参数接口 */
export interface TableRequestParams {
	/** 其他可能的查询参数 */
	[key: string]: any
}

/** 表格响应数据接口 */
export interface TableResponse<T = Record<string, unknown>> {
	/** 数据列表 */
	list: T[]
	/** 其他可能的响应数据 */
	total: number
}

/** 表格 Hook 配置项接口 */
export interface UseTableOptions<T = Record<string, any>, Z extends Record<string, any>> extends Partial<DataTableProps> {
	/** 表格列配置 */
	config: DataTableColumns<T>
	/** 数据请求函数 */
	request: <T>(params: Z) => Promise<TableResponse<T>>
	/** 默认请求参数 */
	defaultValue?: Ref<Z> | Z
	/** 监听参数 */
	watchValue?: string[] | boolean
	/** 本地存储 */
	storage?: string
	/** 分页字段别名映射 */
	alias?: { page: string; pageSize: string }
}

/**
 * 表格实例接口
 * 在基础表格实例的基础上添加表格渲染组件方法
 */
export interface TableInstanceWithComponent<T = Record<string, unknown>, Z = Record<string, unknown>> {
	/** 表格渲染组件：用于渲染整个表格的Vue组件 */
	TableComponent: (props: Record<string, unknown>, context: Record<string, unknown>) => JSX.Element
	/** 分页渲染组件：用于渲染分页组件的Vue组件 */
	PageComponent: (props: Record<string, unknown>, context: Record<string, unknown>) => JSX.Element
	loading: Ref<boolean> // 加载状态
	tableAlias: Ref<{ total: string; list: string }> // 表格别名
	data: Ref<{ list: T[]; total: number }> // 表格数据引用
	total: Ref<number> // 总条数
	param: Ref<Z> // 表格请求参数引用
	config: Ref<DataTableColumns<T>> // 表格列配置引
	props: Ref<DataTableProps> // 表格属性引用
	reset: () => Promise<void> // 重置方法
	fetch: <T>() => Promise<T> // 触发方法
	example: Ref<DataTableInst> // 表格实例引用
	handlePageChange: (currentPage: number) => void // 分页改变
	handlePageSizeChange: (size: number) => void // 分页大小改变
	pageSizeOptions: Ref<number[]> // 分页大小选项
}

/**
 * 表格分页实例接口
 * 在基础表格实例的基础上添加表格渲染组件方法
 */
export interface TablePageInstanceWithComponent {
	component: (props: Record<string, unknown>, context: Record<string, unknown>) => JSX.Element
	handlePageChange: (currentPage: number) => void
	handlePageSizeChange: (size: number) => void
	pageSizeOptions: Ref<number[]>
}

interface TablePageProps<T extends Record<string, any> = Record<string, any>> {
	/** 当前页码 */
	param: Ref<T>
	/** 总条数 */
	total: Ref<number>
	/** 字段别名映射 */
	alias?: { page?: string; pageSize?: string }
	/** 分页组件属性 */
	props?: PaginationProps
	/** 分页组件插槽 */
	slot?: PaginationSlots
}
