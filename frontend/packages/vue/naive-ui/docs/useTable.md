# useTable 使用文档

## 基本介绍

`useTable` 是一个基于 Naive UI 的表格构建工具，它提供了一种简洁的方式来创建和管理数据表格。通过这个钩子函数，你可以轻松地构建表格、管理表格状态、处理数据加载和分页等操作。

## 核心函数

### useTable

```typescript
function useTable<T = Record<string, unknown>, Z extends Record<string, unknown> = Record<string, unknown>>(
	options: UseTableOptions<T, Z>,
): TableInstanceWithComponent<T, Z>
```

**参数**:

- `options`: 表格配置选项
  - `config`: 表格列配置
  - `request`: 数据请求函数，用于获取表格数据
  - `defaultValue`: 可选，默认请求参数，支持响应式

**返回值**:

- `loading`: 加载状态
- `example`: 表格组件实例引用
- `data`: 响应式表格数据
- `param`: 请求参数
- `reset`: 重置方法
- `fetch`: 数据获取方法
- `component`: 表格渲染组件
- `config`: 表格列配置
- `props`: 表格属性

**示例**:

```typescript
const table = useTable({
	config: [
		{ title: '姓名', key: 'name' },
		{ title: '年龄', key: 'age' },
	],
	request: async (params) => {
		// 处理数据请求
		const response = await api.getUsers(params)
		return { data: response.data }
	},
	defaultValue: { page: 1, pageSize: 20 },
})
```

### useTablePage

```typescript
function useTablePage<T extends Record<string, any> = Record<string, any>>(
	options: TablePageProps<T>,
): {
	component: (
		compProps?: Record<string, unknown>,
		context?: { slots?: Record<string, () => JSX.Element> },
	) => JSX.Element
	handlePageChange: (currentPage: number) => void
	handlePageSizeChange: (size: number) => void
	pageSizeOptions: Ref<number[]>
}
```

**参数**:

- `options`: 分页配置选项
  - `param`: 请求参数的响应式引用
  - `alias`: 可选，字段别名映射，默认为 `{ page: 'page', pageSize: 'pageSize', total: 'total' }`
  - `props`: 可选，分页组件属性
  - `slot`: 可选，分页组件插槽

**返回值**:

- `component`: 分页渲染组件
- `handlePageChange`: 页码变更处理函数
- `handlePageSizeChange`: 每页条数变更处理函数
- `pageSizeOptions`: 每页条数选项

**示例**:

```typescript
const pagination = useTablePage({
	param: table.param,
	alias: { page: 'currentPage', pageSize: 'size', total: 'totalCount' },
	props: { showQuickJumper: true },
})
```

## 使用示例

### 基本用法

```typescript
import useTable, { useTablePage } from 'path/to/useTable'

// 创建表格实例
const table = useTable({
	config: [
		{ title: '姓名', key: 'name' },
		{ title: '年龄', key: 'age' },
		{ title: '地址', key: 'address' },
	],
	request: async (params) => {
		// 模拟API请求
		const response = await api.getUsers(params)
		return { data: response.list }
	},
	defaultValue: { page: 1, pageSize: 20 },
})

// 创建分页实例
const pagination = useTablePage({
	param: table.param,
})

// 在组件中使用
// <table.component />
// <pagination.component />

// 刷新表格数据
// await table.fetch()

// 重置表格
// await table.reset()
```

### 自定义分页

```typescript
const pagination = useTablePage({
	param: table.param,
	alias: {
		page: 'currentPage', // 自定义页码字段名
		pageSize: 'size', // 自定义每页条数字段名
		total: 'totalCount', // 自定义总条数字段名
	},
	props: {
		showQuickJumper: true, // 显示快速跳转
		showSizePicker: true, // 显示每页条数选择器
		pageSizes: [10, 20, 50, 100], // 自定义每页条数选项
	},
})
```

### 带插槽的表格

```typescript
// 在组件中使用
<table.component>
  {{
    empty: () => <div>暂无数据</div>,
    loading: () => <div>加载中...</div>
  }}
</table.component>
```

### 带插槽的分页

```typescript
// 在组件中使用
<pagination.component>
  {{
    prefix: () => <span>共 {table.param.value.total} 条</span>,
    suffix: () => <button onClick={table.fetch}>刷新</button>
  }}
</pagination.component>
```

### 自定义表格属性

```typescript
// 设置表格属性
table.props.value = {
	striped: true, // 斑马纹
	bordered: false, // 无边框
	singleLine: false, // 允许内容换行
	size: 'small', // 表格尺寸
	rowKey: (row) => row.id, // 行唯一标识
	maxHeight: 400, // 最大高度
}
```

## 高级用法

### 条件查询

```typescript
// 创建表格实例
const table = useTable({
  config: [...],
  request: async (params) => {
    const response = await api.getUsers(params)
    return { data: response.list }
  },
  defaultValue: {
    page: 1,
    pageSize: 20,
    name: '',
    status: null
  }
})

// 条件查询
const handleSearch = () => {
  table.param.value.name = searchForm.value.name
  table.param.value.status = searchForm.value.status
  // 查询时重置到第一页
  table.param.value.page = 1
  table.fetch()
}

// 重置查询
const handleReset = () => {
  table.reset()
}
```

### 表格操作列

```typescript
const table = useTable({
  config: [
    { title: '姓名', key: 'name' },
    { title: '年龄', key: 'age' },
    {
      title: '操作',
      key: 'actions',
      render: (row) => {
        return (
          <div>
            <button onClick={() => handleEdit(row)}>编辑</button>
            <button onClick={() => handleDelete(row)}>删除</button>
          </div>
        )
      }
    }
  ],
  request: async (params) => {
    const response = await api.getUsers(params)
    return { data: response.list }
  }
})
```

## 注意事项

1. `request` 函数必须返回一个包含 `data` 字段的对象，该字段包含表格数据数组。
2. 默认情况下，分页参数使用 `page`、`pageSize` 和 `total` 字段名，可以通过 `alias` 参数自定义。
3. 表格的属性可以通过 `table.props.value = { ... }` 进行设置。
4. 当请求参数 `param` 发生变化时，表格会自动重新加载数据。
5. 使用 `reset` 方法可以将请求参数重置为默认值并重新加载数据。
