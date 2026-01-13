import { ref } from 'vue'

export interface SocketOptions {
	autoReconnect?: boolean // 是否自动重连, 默认为 true
	middleware?: (data: any) => any // 数据中间件函数，支持原始数据处理，默认为直接返回，支持多个中间件
	maxReconnectAttempts?: number // 最大重连次数, 默认无限制
	reconnectDelay?: number // 重连延迟, 默认为3000ms
	heartbeatInterval?: number // 心跳间隔, 单位毫秒
	heartbeatMessage?: any // 心跳包消息
}

/**
 * @description 将对象参数拼接到 URL 上，返回新的 URL 字符串
 * @param url - 基础 URL（如 'https://example.com'）
 * @param obj - 要拼接到 URL 上的对象参数（键值对）
 * @returns 拼接参数后的完整 URL 字符串
 */
export function setObjToUrlParams(url: string, obj: Record<string, any>): string {
	// 将对象的每一个键值对转换成 'key=value' 形式，并且对 value 做 URL 编码
	const paramsArray: string[] = Object.entries(obj).map(([key, value]) => {
		return `${String(key)}=${encodeURIComponent(String(value))}`
	})

	// 将所有 'key=value' 形式的字符串用 '&' 符号连接起来，形成 URL 查询字符串
	const parameters: string = paramsArray.join('&')

	// 判断原 URL 是否以 '?' 结尾
	const hasQuestionMarkAtEnd: boolean = /\?$/.test(url)

	// 根据 URL 是否已经有 '?' 来决定如何拼接参数
	if (hasQuestionMarkAtEnd) {
		// 如果 URL 已经以 '?' 结尾，直接加参数
		return url + parameters
	} else {
		// 如果 URL 没有以 '?' 结尾，需要先去除可能的结尾 '/'，然后加上 '?'
		const cleanUrl = url.replace(/\/?$/, '')
		return cleanUrl + '?' + parameters
	}
}

export default function useSocket(url: string, options?: SocketOptions) {
	const {
		autoReconnect = true,
		reconnectDelay = 3000,
		middleware = (data: any) => data,
		maxReconnectAttempts,
		heartbeatInterval = 5000,
		heartbeatMessage = 'ping',
	} = options || {}

	const socket = ref<WebSocket | null>(null)
	const connected = ref(false)
	const message = ref<any>(null)
	let manuallyDisconnected = false // 标记是否主动断开

	// 新增重连计数与心跳定时器变量
	let reconnectAttempts = 0
	let heartbeatTimer: ReturnType<typeof setInterval> | null = null

	// 建立WebSocket连接
	const connect = () => {
		// 兼容检测：若当前环境不支持 WebSocket，则打印错误并退出
		if (typeof WebSocket === 'undefined') {
			console.error('WebSocket is not supported in this environment.')
			return
		}
		manuallyDisconnected = false // 重置主动断开标记
		// 清除之前的心跳定时器
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer)
			heartbeatTimer = null
		}
		socket.value = new WebSocket(url)

		// 连接成功的回调
		socket.value.onopen = () => {
			console.log(4123432)
			connected.value = true
			reconnectAttempts = 0 // 重置重连计数
			// 如果配置了心跳包，启动心跳定时器
			if (heartbeatInterval && heartbeatMessage !== undefined) {
				heartbeatTimer = setInterval(() => {
					if (socket.value && connected.value) {
						socket.value.send(heartbeatMessage)
					}
				}, heartbeatInterval)
			}
		}

		// 收到消息后，使用中间件处理数据
		socket.value.onmessage = (event: MessageEvent) => {
			message.value = middleware(event.data)
		}

		// 出现错误时打印日志
		socket.value.onerror = (error) => {
			console.error('WebSocket error:', error)
		}

		// 关闭连接的回调，判断是否需要自动重连
		socket.value.onclose = () => {
			connected.value = false // 更新连接状态
			socket.value = null
			// 清除心跳定时器
			if (heartbeatTimer) {
				clearInterval(heartbeatTimer)
				heartbeatTimer = null
			}
			// 如果自动重连且未主动断开，则在延迟后重连
			if (autoReconnect && !manuallyDisconnected) {
				if (maxReconnectAttempts !== undefined) {
					if (reconnectAttempts < maxReconnectAttempts) {
						reconnectAttempts++
						setTimeout(() => connect(), reconnectDelay)
					}
				} else {
					setTimeout(() => connect(), reconnectDelay)
				}
			}
		}
	}

	// 主动断开连接，禁止自动重连
	const disconnect = () => {
		manuallyDisconnected = true // 标记为主动断开
		if (socket.value) {
			socket.value.close()
		}
		// 清除心跳定时器
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer)
			heartbeatTimer = null
		}
	}

	// 发送数据方法，仅在连接状态时执行
	const send = (data: any) => {
		if (socket.value && connected.value) {
			socket.value.send(data)
		}
	}

	return { socket, connect, disconnect, send, message, connected }
}
