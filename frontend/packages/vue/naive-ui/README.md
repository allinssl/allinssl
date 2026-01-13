# Dynamic Components

基于 Vue 3 和 Naive UI 的动态表单和表格组件库，提供灵活的配置式 UI 开发方案。

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [组件和 Hooks](#组件和-hooks)
  - [useForm](#useform)
  - [useTable](#usetable)
  - [useTabs](#usetabs)
  - [FormDesigner](#formdesigner)
  - [FormBuilder](#formbuilder)

## 安装

```bash
# 使用 npm
npm install dynamic-components

# 使用 yarn
yarn add dynamic-components

# 使用 pnpm
pnpm add dynamic-components
```

## 快速开始

### 基础依赖

本组件库基于 Vue 3 和 Naive UI 构建，请确保您的项目中已安装以下依赖：

```json
{
	"dependencies": {
		"@vicons/tabler": "^0.13.0",
		"@vueuse/core": "^10.7.0",
		"naive-ui": "^2.37.3",
		"vue": "^3.4.0"
	}
}
```

### 基本用法

```vue
<template>
	<div>
		<component :is="form.FormComponent" />
		<n-button @click="handleSubmit">提交</n-button>
	</div>
</template>

<script setup>
	import { useForm } from '@baota/naive-ui/hooks'
	import { NButton } from 'naive-ui'

	// 定义表单配置
	const formConfig = [
		{
			type: 'formItem',
			label: '用户名',
			children: [
				{
					type: 'input',
					field: 'username',
					placeholder: '请输入用户名',
				},
			],
		},
		{
			type: 'formItem',
			label: '密码',
			children: [
				{
					type: 'input',
					field: 'password',
					type: 'password',
					placeholder: '请输入密码',
				},
			],
		},
	]

	// 创建表单实例
	const form = useForm({
		config: formConfig,
		defaultValues: {
			username: '',
			password: '',
		},
	})

	// 提交表单
	const handleSubmit = async () => {
		const valid = await form.validate()
		if (valid) {
			console.log('表单数据:', form.formData.value)
		}
	}
</script>
```

## 核心功能

- **配置式表单**：通过 JSON 配置快速构建复杂表单
- **动态表格**：支持自定义列、排序、筛选等功能
- **表单设计器**：可视化拖拽设计表单
- **标签页管理**：简化多标签页应用开发

## 组件和 Hooks

### useForm

`useForm` 是一个强大的表单 Hook，用于创建动态表单。

#### 基本用法

```js
import { useForm } from '@baota/naive-ui/hooks'

const form = useForm({
	config: [
		{
			type: 'formItem',
			label: '姓名',
			children: [
				{
					type: 'input',
					field: 'name',
				},
			],
		},
	],
	defaultValues: {
		name: '',
	},
	requestFn: async (data) => {
		// 提交表单数据的请求函数
		return await api.submitForm(data)
	},
})
```

#### 参数说明

| 参数          | 类型                        | 必填 | 说明                           |
| ------------- | --------------------------- | ---- | ------------------------------ |
| config        | FormConfig                  | 是   | 表单配置                       |
| defaultValues | Record<string, any>         | 否   | 表单默认值                     |
| requestFn     | (data: any) => Promise<any> | 否   | 表单提交请求函数               |
| immediate     | boolean                     | 否   | 是否立即执行请求，默认为 false |

#### 返回值

| 属性          | 类型                     | 说明         |
| ------------- | ------------------------ | ------------ |
| loading       | Ref<boolean>             | 加载状态     |
| formData      | Ref<Record<string, any>> | 表单数据     |
| formRef       | Ref<FormInst \| null>    | 表单实例引用 |
| submit        | () => Promise<any>       | 提交方法     |
| reset         | () => void               | 重置方法     |
| validate      | () => Promise<boolean>   | 验证方法     |
| FormComponent | () => JSX.Element        | 表单渲染组件 |

#### 支持的表单元素

| 类型          | 说明       | 对应 Naive UI 组件 |
| ------------- | ---------- | ------------------ |
| input         | 输入框     | NInput             |
| inputNumber   | 数字输入框 | NInputNumber       |
| inputGroup    | 输入框组   | NInputGroup        |
| select        | 选择器     | NSelect            |
| radio         | 单选框组   | NRadioGroup        |
| radioButton   | 单选按钮   | NRadioButton       |
| checkbox      | 复选框组   | NCheckboxGroup     |
| switch        | 开关       | NSwitch            |
| datepicker    | 日期选择器 | NDatePicker        |
| timepicker    | 时间选择器 | NTimePicker        |
| colorPicker   | 颜色选择器 | NColorPicker       |
| slider        | 滑块       | NSlider            |
| rate          | 评分       | NRate              |
| transfer      | 穿梭框     | NTransfer          |
| mention       | 提及       | NMention           |
| dynamicInput  | 动态输入   | NDynamicInput      |
| dynamicTags   | 动态标签   | NDynamicTags       |
| autoComplete  | 自动完成   | NAutoComplete      |
| cascader      | 级联选择   | NCascader          |
| treeSelect    | 树选择     | NTreeSelect        |
| upload        | 上传       | NUpload            |
| uploadDragger | 拖拽上传   | NUploadDragger     |
| slot          | 插槽       | -                  |
| render        | 自定义渲染 | -                  |

#### 栅格布局

```js
const formConfig = [
	{
		type: 'grid',
		cols: 24,
		xGap: 12,
		children: [
			{
				type: 'formItemGi',
				label: '姓名',
				span: 12,
				children: [
					{
						type: 'input',
						field: 'firstName',
					},
				],
			},
			{
				type: 'formItemGi',
				label: '姓氏',
				span: 12,
				children: [
					{
						type: 'input',
						field: 'lastName',
					},
				],
			},
		],
	},
]
```

#### 自定义插槽

```vue
<template>
	<component :is="form.FormComponent">{{
    customSlot,
	}}</component>
</template>

<script setup>
	import { useForm } from '@baota/naive-ui/hooks'

	const formConfig = [
		{
			type: 'formItem',
			label: '自定义内容',
			children: [
				{
					type: 'slot',
					slot: 'customSlot',
				},
			],
		},
	]

	const formSlots = {
		customSlot: (formData, formRef) => <div>这是自定义插槽内容</div>,
	}

	const form = useForm({
		config: formConfig,
	})
</script>
```

### useTable

`useTable` 是一个用于创建动态表格的 Hook。

#### 基本用法

```js
import { useTable } from '@baota/naive-ui/hooks'
import { h } from 'vue'

// 定义表格列
const columns = [
	{
		title: 'ID',
		key: 'id',
	},
	{
		title: '姓名',
		key: 'name',
	},
	{
		title: '操作',
		key: 'actions',
		render: (row) =>
			h('div', [
				h('button', { onClick: () => handleEdit(row) }, '编辑'),
				h('button', { onClick: () => handleDelete(row) }, '删除'),
			]),
	},
]

// 创建表格实例
const table = useTable({
	columns,
	requestFn: async (params) => {
		// 获取表格数据的请求函数
		const res = await api.getList(params)
		return {
			list: res.data.list,
		}
	},
	defaultParams: {
		page: 1,
		pageSize: 10,
	},
})
```

#### 参数说明

| 参数          | 类型                                                   | 必填 | 说明                          |
| ------------- | ------------------------------------------------------ | ---- | ----------------------------- |
| columns       | DataTableColumns                                       | 是   | 表格列配置                    |
| requestFn     | (params: TableRequestParams) => Promise<TableResponse> | 是   | 数据请求函数                  |
| defaultParams | Ref<TableRequestParams>                                | 否   | 默认请求参数                  |
| immediate     | boolean                                                | 否   | 是否立即执行请求，默认为 true |

#### 返回值

| 属性           | 类型                | 说明         |
| -------------- | ------------------- | ------------ |
| loading        | Ref<boolean>        | 加载状态     |
| data           | Ref<T[]>            | 表格数据     |
| params         | TableRequestParams  | 查询参数     |
| refresh        | () => Promise<void> | 刷新方法     |
| reset          | () => Promise<void> | 重置方法     |
| tableRef       | Ref<any>            | 表格引用     |
| TableComponent | () => JSX.Element   | 表格渲染组件 |

### useTabs

`useTabs` 是一个用于管理标签页的 Hook，特别适合基于路由的多标签页应用。

#### 基本用法

```vue
<template>
	<component :is="tabs.TabsComponent" />
</template>

<script setup>
	import { useTabs } from '@baota/naive-ui/hooks'

	const tabs = useTabs({
		defaultToFirst: true,
	})
</script>
```

#### 参数说明

| 参数           | 类型    | 必填 | 说明                                          |
| -------------- | ------- | ---- | --------------------------------------------- |
| defaultToFirst | boolean | 否   | 是否在初始化时自动选中第一个标签，默认为 true |

#### 返回值

| 属性            | 类型                  | 说明             |
| --------------- | --------------------- | ---------------- |
| activeKey       | string                | 当前激活的标签值 |
| childRoutes     | RouteRecordRaw[]      | 子路由列表       |
| handleTabChange | (key: string) => void | 切换标签页方法   |
| TabsComponent   | () => JSX.Element     | 标签页渲染组件   |

### FormDesigner

`FormDesigner` 是一个可视化表单设计器组件，支持拖拽设计表单。

#### 基本用法

```vue
<template>
	<FormDesigner />
</template>

<script setup>
	import { FormDesigner } from '@baota/naive-ui/hooks'
</script>
```

#### 功能特点

- 支持拖拽添加表单组件
- 支持编辑组件属性
- 支持导入/导出表单配置
- 实时预览表单效果

### FormBuilder

`FormBuilder` 是一个简化版的表单构建器组件，适合快速创建简单表单。

#### 基本用法

```vue
<template>
	<FormBuilder />
</template>

<script setup>
	import { FormBuilder } from '@baota/naive-ui/hooks'
</script>
```

#### 功能特点

- 拖拽式表单构建
- 支持导出表单配置
- 简单直观的操作界面

## 类型定义

组件库提供了完整的 TypeScript 类型定义，可以在开发时获得良好的类型提示。

```ts
import type {
	FormConfig,
	FormItemConfig,
	FormElement,
	UseFormOptions,
	FormInstance,
	TableRequestParams,
	TableResponse,
	UseTableOptions,
	TableInstance,
} from '@baota/naive-ui/hooks'
```

## 示例

### 完整的表单示例

```vue
<template>
	<div>
		<component :is="form.FormComponent" />
		<n-button type="primary" @click="handleSubmit" :loading="form.loading.value"> 提交 </n-button>
	</div>
</template>

<script setup>
	import { useForm } from '@baota/naive-ui/hooks'
	import { NButton } from 'naive-ui'
	import { ref } from 'vue'

	// 表单配置
	const formConfig = [
		{
			type: 'grid',
			cols: 24,
			xGap: 12,
			children: [
				{
					type: 'formItemGi',
					label: '姓名',
					span: 12,
					required: true,
					children: [
						{
							type: 'input',
							field: 'name',
							placeholder: '请输入姓名',
						},
					],
				},
				{
					type: 'formItemGi',
					label: '年龄',
					span: 12,
					children: [
						{
							type: 'inputNumber',
							field: 'age',
							placeholder: '请输入年龄',
							min: 0,
							max: 120,
						},
					],
				},
			],
		},
		{
			type: 'formItem',
			label: '性别',
			required: true,
			children: [
				{
					type: 'radio',
					field: 'gender',
					options: [
						{ label: '男', value: 'male' },
						{ label: '女', value: 'female' },
						{ label: '其他', value: 'other' },
					],
				},
			],
		},
		{
			type: 'formItem',
			label: '兴趣爱好',
			children: [
				{
					type: 'checkbox',
					field: 'hobbies',
					options: [
						{ label: '阅读', value: 'reading' },
						{ label: '音乐', value: 'music' },
						{ label: '运动', value: 'sports' },
						{ label: '旅行', value: 'travel' },
						{ label: '编程', value: 'coding' },
					],
				},
			],
		},
		{
			type: 'formItem',
			label: '出生日期',
			children: [
				{
					type: 'datepicker',
					field: 'birthday',
					type: 'date',
				},
			],
		},
		{
			type: 'formItem',
			label: '个人简介',
			children: [
				{
					type: 'input',
					field: 'bio',
					type: 'textarea',
					placeholder: '请输入个人简介',
					maxLength: 500,
					showCount: true,
				},
			],
		},
	]

	// 默认值
	const defaultValues = ref({
		name: '',
		age: 18,
		gender: 'male',
		hobbies: [],
		birthday: null,
		bio: '',
	})

	// 创建表单实例
	const form = useForm({
		config: formConfig,
		defaultValues,
		requestFn: async (data) => {
			// 模拟提交请求
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('提交的数据:', data)
					resolve({ success: true })
				}, 1000)
			})
		},
	})

	// 提交表单
	const handleSubmit = async () => {
		const result = await form.submit()
		if (result?.success) {
			// 提交成功后的处理
			console.log('提交成功')
		}
	}
</script>
```

### 完整的表格示例

```vue
<template>
	<div>
		<n-card title="用户列表">
			<!-- 搜索表单 -->
			<component :is="searchForm.FormComponent" />
			<div class="mb-4">
				<n-button type="primary" @click="handleSearch">搜索</n-button>
				<n-button @click="searchForm.reset" class="ml-2">重置</n-button>
			</div>

			<!-- 表格 -->
			<component :is="table.TableComponent" />
		</n-card>
	</div>
</template>

<script setup>
	import { useForm, useTable } from '@baota/naive-ui/hooks'
	import { NButton, NCard, useMessage } from 'naive-ui'
	import { h, ref } from 'vue'

	const message = useMessage()

	// 搜索表单配置
	const searchFormConfig = [
		{
			type: 'grid',
			cols: 24,
			xGap: 12,
			children: [
				{
					type: 'formItemGi',
					label: '用户名',
					span: 8,
					children: [
						{
							type: 'input',
							field: 'username',
							placeholder: '请输入用户名',
						},
					],
				},
				{
					type: 'formItemGi',
					label: '状态',
					span: 8,
					children: [
						{
							type: 'select',
							field: 'status',
							placeholder: '请选择状态',
							options: [
								{ label: '全部', value: '' },
								{ label: '启用', value: 'active' },
								{ label: '禁用', value: 'inactive' },
							],
						},
					],
				},
				{
					type: 'formItemGi',
					label: '注册时间',
					span: 8,
					children: [
						{
							type: 'datepicker',
							field: 'registerDate',
							type: 'daterange',
							clearable: true,
						},
					],
				},
			],
		},
	]

	// 搜索表单实例
	const searchForm = useForm({
		config: searchFormConfig,
		defaultValues: {
			username: '',
			status: '',
			registerDate: null,
		},
	})

	// 表格列配置
	const columns = [
		{
			title: 'ID',
			key: 'id',
			sorter: true,
		},
		{
			title: '用户名',
			key: 'username',
		},
		{
			title: '邮箱',
			key: 'email',
		},
		{
			title: '状态',
			key: 'status',
			render: (row) => {
				const statusMap = {
					active: { text: '启用', type: 'success' },
					inactive: { text: '禁用', type: 'error' },
				}
				const status = statusMap[row.status] || { text: '未知', type: 'default' }
				return h('n-tag', { type: status.type }, { default: () => status.text })
			},
		},
		{
			title: '注册时间',
			key: 'registerDate',
			sorter: true,
		},
		{
			title: '操作',
			key: 'actions',
			render: (row) =>
				h('div', [
					h(
						'n-button',
						{
							size: 'small',
							type: 'primary',
							onClick: () => handleEdit(row),
						},
						{ default: () => '编辑' },
					),
					h(
						'n-button',
						{
							size: 'small',
							type: 'error',
							style: 'margin-left: 8px',
							onClick: () => handleDelete(row),
						},
						{ default: () => '删除' },
					),
				]),
		},
	]

	// 模拟请求函数
	const mockRequestFn = async (params) => {
		// 模拟网络请求
		return new Promise((resolve) => {
			setTimeout(() => {
				// 模拟数据
				const mockData = [
					{ id: 1, username: 'user1', email: 'user1@example.com', status: 'active', registerDate: '2023-01-15' },
					{ id: 2, username: 'user2', email: 'user2@example.com', status: 'inactive', registerDate: '2023-02-20' },
					{ id: 3, username: 'user3', email: 'user3@example.com', status: 'active', registerDate: '2023-03-10' },
				]

				// 简单过滤
				let filteredData = [...mockData]
				if (params.username) {
					filteredData = filteredData.filter((item) =>
						item.username.toLowerCase().includes(params.username.toLowerCase()),
					)
				}
				if (params.status) {
					filteredData = filteredData.filter((item) => item.status === params.status)
				}

				resolve({
					list: filteredData,
					total: filteredData.length,
				})
			}, 500)
		})
	}

	// 表格默认参数
	const defaultParams = ref({
		page: 1,
		pageSize: 10,
	})

	// 创建表格实例
	const table = useTable({
		columns,
		requestFn: mockRequestFn,
		defaultParams,
		pagination: {
			pageSize: 10,
		},
		bordered: true,
	})

	// 搜索处理
	const handleSearch = async () => {
		// 合并搜索表单数据到表格参数
		Object.assign(table.params, searchForm.formData.value)
		await table.refresh()
	}

	// 编辑处理
	const handleEdit = (row) => {
		message.info(`编辑用户: ${row.username}`)
	}

	// 删除处理
	const handleDelete = (row) => {
		message.info(`删除用户: ${row.username}`)
	}
</script>
```

## 贡献

欢迎提交 Issue 或 Pull Request 来帮助改进这个组件库。

## 许可证

[ISC](LICENSE)

# @baota/naive-ui

基于 Naive UI 的扩展库，提供一系列增强功能和实用工具。

## 主要功能

- 统一的主题管理
- 扩展的 hooks 工具集
- 支持组件内和组件外使用的 API

## 安装

```bash
# npm
npm install @baota/naive-ui

# yarn
yarn add @baota/naive-ui

# pnpm
pnpm add @baota/naive-ui
```

## Message 消息提示

### 组件内使用 useMessage

在 Vue 组件内，可以直接使用 `useMessage` hook：

```tsx
import { defineComponent } from 'vue'
import { useMessage } from '@baota/naive-ui/hooks'

export default defineComponent({
	setup() {
		const message = useMessage()

		// 基本使用
		const showMessage = () => {
			message.success('操作成功')
			message.error('操作失败')
			message.warning('警告提示')
			message.info('信息提示')
		}

		// 处理请求结果
		const handleApiResponse = (response) => {
			message.request(response) // 自动根据 status 判断显示成功或失败消息
		}

		return { showMessage, handleApiResponse }
	},
})
```

### 非组件环境使用 createAllApi

在非组件环境（如工具函数、API 请求拦截器等）中，可以使用 `createAllApi` 创建全局可用的 API 实例：

```ts
// api/index.ts
import { createAllApi } from '@baota/naive-ui/hooks'

// 创建全局API实例
export const globalApi = createAllApi()

// 在任何地方使用
export function handleApiResponse(response) {
	// 自动根据 status 判断显示成功或失败消息
	globalApi.message.request(response)
}

// 也可以直接调用特定类型的消息
export function showSuccessMessage(content: string) {
	globalApi.message.success(content)
}
```

### 整合 createDiscreteApi 的完整方案

`createAllApi` 整合了 Naive UI 的 `createDiscreteApi`，包含了 message、notification、dialog 和 loadingBar 功能，并且扩展了 request 方法：

```ts
import { createAllApi } from '@baota/naive-ui/hooks'

// 创建全局API实例
const { message, notification, dialog, loadingBar } = createAllApi()

// 使用 message
message.success('操作成功')
message.error('操作失败')
message.request({ status: true, message: '请求成功' })

// 使用 dialog
dialog.info({
	title: '提示',
	content: '这是一个对话框',
})
dialog.request({ status: false, message: '操作失败' })

// 使用 notification
notification.success({
	title: '成功',
	content: '操作已完成',
})

// 使用 loadingBar
loadingBar.start()
// 操作完成后
loadingBar.finish()
```

## 自定义主题

可以通过传入配置来自定义主题：

```ts
import { createAllApi } from '@baota/naive-ui/hooks'
import { darkTheme } from 'naive-ui'

// 使用暗色主题
const api = createAllApi({
	configProviderProps: {
		theme: darkTheme,
	},
})
```

## 常见问题

### 为什么需要同时支持 useMessage 和 createAllApi？

- `useMessage` 适合在组件内使用，可以访问组件上下文
- `createAllApi` 适用于非组件环境，如工具函数、API 请求拦截器等

### message.request 方法是什么？

这是我们扩展的便捷方法，用于统一处理 API 响应结果：

```ts
// API响应格式
interface ApiResponse {
	status: boolean
	message: string
}

// 自动根据status显示成功或失败消息
message.request(apiResponse)
```
