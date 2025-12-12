# useAxios 使用文档

## 基本介绍

`useAxios` 是一个基于 Vue 3 的 Axios 封装钩子函数，它提供了一种简洁的方式来管理 HTTP 请求。通过这个钩子函数，你可以轻松地处理请求状态、加载状态、错误处理、请求取消等功能。

## 核心函数

### useAxios

```typescript
function useAxios<T = unknown, Z = Record<string, unknown>>(instance: HttpClient): useAxiosReturn<T, Z>
```

**参数**:

- `instance`: HttpClient 实例，用于发送 HTTP 请求

**返回值**:
包含以下属性和方法的对象：

**状态属性**:

- `loadingMask`: 加载遮罩配置，类型为 `Ref<{ status: boolean } & LoadingMaskOptions>`
- `message`: 是否显示响应消息，类型为 `Ref<boolean>`
- `dialog`: 确认框配置，类型为 `Ref<{ status: boolean } & CustomDialogOptions>`
- `loading`: 是否正在加载，类型为 `Ref<boolean>`
- `error`: 错误信息，类型为 `ShallowRef<Error | null | string>`
- `response`: 原始响应对象，类型为 `ShallowRef<AxiosResponse<T> | null>`
- `data`: 响应数据，类型为 `Ref<T>`
- `defaultData`: 默认数据，类型为 `Ref<T>`
- `statusCode`: HTTP 状态码，类型为 `ComputedRef<HttpStatusCode | null>`
- `aborted`: 是否被中断，类型为 `Ref<boolean>`
- `urlRef`: 请求 URL，类型为 `Ref<string>`
- `paramsRef`: 请求参数，类型为 `Ref<Z>`

**方法**:

- `execute(url: string, params?: Z)`: 执行请求，返回 `Promise<T>`
- `setParams(params: Z)`: 设置请求参数并执行请求，返回 `Promise<T>`
- `setUrl(url: string, params?: Z)`: 设置请求 URL 和参数并执行请求，返回 `Promise<T>`
- `cancel(url: string)`: 取消特定请求
- `cancelAll()`: 取消所有请求
- `start(params?: Z)`: 使用当前 URL 和参数重新发起请求，返回 `Promise<T>`

## 使用示例

### 基本用法

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

// 创建 HTTP 客户端实例
const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

// 创建请求钩子
const api = useAxios<UserData, UserParams>(httpClient)

// 发送请求
const fetchUser = async (userId: string) => {
	try {
		const result = await api.execute('/user/info', { userId })
		console.log('用户数据:', result)
		return result
	} catch (error) {
		console.error('获取用户数据失败:', error)
	}
}
```

### 配置加载遮罩

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios(httpClient)

// 配置加载遮罩
api.loadingMask.value = {
	status: true, // 启用加载遮罩
	text: '正在加载数据，请稍候...', // 自定义加载文本
}

// 发送请求时会自动显示加载遮罩
api.execute('/data/list', { page: 1 })
```

### 配置确认对话框

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios(httpClient)

// 配置确认对话框
api.dialog.value = {
	status: true, // 启用确认对话框
	title: '确认操作',
	content: '确定要执行此操作吗？',
	positiveText: '确定',
	negativeText: '取消',
}

// 发送请求前会先显示确认对话框
api.execute('/user/delete', { userId: '123' })
```

### 启用响应消息提示

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios(httpClient)

// 启用响应消息提示
api.message.value = true

// 发送请求后会自动显示响应中的消息
// 假设响应格式为 { status: boolean, message: string, data: any }
api.execute('/user/update', { userId: '123', name: '张三' })
```

### 取消请求

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios(httpClient)

// 发送请求
const fetchData = () => {
	api.execute('/data/large-file')
}

// 取消特定请求
const cancelFetch = () => {
	api.cancel('/data/large-file')
}

// 取消所有请求
const cancelAllRequests = () => {
	api.cancelAll()
}
```

### 重新发送请求

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios(httpClient)

// 首次发送请求
api.execute('/data/list', { page: 1 })

// 更新参数并重新发送请求
const nextPage = () => {
	api.setParams({ page: api.paramsRef.value.page + 1 })
}

// 使用当前参数重新发送请求
const refresh = () => {
	api.start()
}
```

### 监听请求状态

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'
import { watch } from 'vue'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios(httpClient)

// 监听加载状态
watch(api.loading, (isLoading) => {
	console.log('加载状态:', isLoading)
})

// 监听错误状态
watch(api.error, (error) => {
	if (error) {
		console.error('请求错误:', error)
	}
})

// 监听响应数据
watch(api.data, (data) => {
	console.log('响应数据:', data)
})
```

## 高级用法

### 设置默认数据

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

const api = useAxios<{ list: any[]; total: number }>(httpClient)

// 设置默认数据
api.defaultData.value = { list: [], total: 0 }

// 当请求失败时，data 会被重置为默认数据
api.execute('/data/list', { page: 1 })
```

### 类型化请求和响应

```typescript
import { useAxios, HttpClient } from '@baota/hooks/axios'

// 定义响应数据类型
interface UserData {
	id: string
	name: string
	email: string
	role: string
}

// 定义请求参数类型
interface UserParams {
	userId: string
}

const httpClient = new HttpClient({
	baseURL: 'https://api.example.com',
})

// 创建类型化的请求钩子
const api = useAxios<UserData, UserParams>(httpClient)

// 发送类型化的请求
const fetchUser = async (userId: string) => {
	const user = await api.execute('/user/info', { userId })
	// user 的类型为 UserData
	console.log(`用户名: ${user.name}, 角色: ${user.role}`)
}
```

## 注意事项

1. `useAxios` 默认使用 POST 方法发送请求，如需使用其他 HTTP 方法，需要在 HttpClient 实例中配置。

2. 响应消息提示功能要求响应数据格式包含 `status` 和 `message` 字段。

3. 加载遮罩、确认对话框和响应消息提示功能依赖于 `@baota/naive-ui/hooks` 提供的相关组件。

4. 取消请求功能基于 Axios 的 AbortController 实现，可以通过 URL 来标识和取消特定请求。

5. 当请求被取消时，`aborted` 状态会被设置为 `true`，可以通过监听此状态来处理请求取消的情况。

6. 错误处理会自动显示错误消息，并将错误信息存储在 `error` 状态中。
