import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import useSocket from '../src/socket'
// 模拟WebSocket
class MockWebSocket {
	url
	onopen = null
	onclose = null
	onmessage = null
	onerror = null
	readyState = 0 // CONNECTING
	constructor(url) {
		this.url = url
		// 模拟异步连接
		setTimeout(() => {
			this.readyState = 1 // OPEN
			this.onopen?.()
		}, 50)
	}
	send = vi.fn((data) => {
		// 模拟数据发送成功
		return true
	})
	close = vi.fn(() => {
		this.readyState = 3 // CLOSED
		this.onclose?.({ code: 1000 })
	})
	// 模拟触发错误
	triggerError(error) {
		this.onerror?.(error)
	}
	// 模拟接收消息
	simulateMessage(data) {
		this.onmessage?.({ data: typeof data === 'object' ? JSON.stringify(data) : data })
	}
	// 模拟连接关闭
	simulateClose(code = 1000, reason = '') {
		this.readyState = 3 // CLOSED
		this.onclose?.({ code, reason })
	}
}
describe('useSocket', () => {
	const originalWebSocket = global.WebSocket
	let mockSocket
	beforeEach(() => {
		vi.useFakeTimers()
		// 安装模拟的WebSocket
		global.WebSocket = vi.fn((url) => {
			mockSocket = new MockWebSocket(url)
			return mockSocket
		})
		// 监视console.error和warn
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})
	})
	afterEach(() => {
		global.WebSocket = originalWebSocket
		vi.restoreAllMocks()
		vi.useRealTimers()
	})
	it('应该连接到WebSocket', async () => {
		const url = 'ws://example.com'
		const { socket, connected } = useSocket(url)
		expect(global.WebSocket).toHaveBeenCalledWith(url)
		expect(socket.value).toBeTruthy()
		expect(connected.value).toBe(false)
		// 触发连接
		vi.advanceTimersByTime(50)
		await nextTick()
		expect(connected.value).toBe(true)
	})
	it('应该发送消息', async () => {
		const { socket, send, connected } = useSocket('ws://example.com')
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		expect(connected.value).toBe(true)
		// 发送消息
		send({ type: 'test', data: '测试数据' })
		expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'test', data: '测试数据' }))
		// 测试发送字符串
		send('纯文本消息')
		expect(mockSocket.send).toHaveBeenCalledWith('纯文本消息')
	})
	it('应该接收消息', async () => {
		const { message, connected } = useSocket('ws://example.com')
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		expect(connected.value).toBe(true)
		// 模拟接收JSON消息
		const testMessage = { type: 'update', data: '新数据' }
		mockSocket.onmessage?.({ data: JSON.stringify(testMessage) })
		await nextTick()
		expect(message.value).toEqual(testMessage)
		// 模拟接收非JSON消息
		mockSocket.onmessage?.({ data: 'plain text message' })
		await nextTick()
		expect(message.value).toEqual('plain text message')
	})
	it('应该支持数据中间件', async () => {
		// 创建中间件函数
		const middleware = (data) => {
			if (typeof data === 'string') {
				try {
					const parsed = JSON.parse(data)
					return { ...parsed, processed: true }
				} catch (e) {
					return `处理后: ${data}`
				}
			}
			return data
		}
		const { message } = useSocket('ws://example.com', { middleware })
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 模拟接收JSON消息
		const testMessage = { type: 'update', data: '新数据' }
		mockSocket.simulateMessage(testMessage)
		await nextTick()
		// 验证中间件处理了数据
		expect(message.value).toEqual({ ...testMessage, processed: true })
		// 测试非JSON消息
		mockSocket.simulateMessage('plain text')
		await nextTick()
		expect(message.value).toBe('处理后: plain text')
	})
	it('应该支持多个中间件函数', async () => {
		// 创建多个中间件函数
		const middleware1 = (data) => {
			if (typeof data === 'string') {
				try {
					return JSON.parse(data)
				} catch (e) {
					return data
				}
			}
			return data
		}
		const middleware2 = (data) => {
			if (typeof data === 'object') {
				return { ...data, step2: true }
			}
			return `Step2: ${data}`
		}
		const { message } = useSocket('ws://example.com', {
			middleware: [middleware1, middleware2],
		})
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 模拟接收JSON消息
		mockSocket.simulateMessage({ type: 'test' })
		await nextTick()
		// 验证多个中间件都处理了数据
		expect(message.value).toEqual({ type: 'test', step2: true })
		// 测试字符串消息
		mockSocket.simulateMessage('text')
		await nextTick()
		expect(message.value).toBe('Step2: text')
	})
	it('应该断开连接', async () => {
		const { disconnect, connected } = useSocket('ws://example.com')
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		expect(connected.value).toBe(true)
		// 断开连接
		disconnect()
		await nextTick()
		expect(mockSocket.close).toHaveBeenCalled()
		expect(connected.value).toBe(false)
	})
	it('应该发送心跳包', async () => {
		// 使用较短的心跳间隔
		useSocket('ws://example.com', { heartbeatInterval: 100, heartbeatMessage: 'PING' })
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 清除之前的send调用
		mockSocket.send.mockClear()
		// 等待心跳间隔
		vi.advanceTimersByTime(100)
		// 验证发送了心跳包
		expect(mockSocket.send).toHaveBeenCalledWith('PING')
		// 再等待一个间隔，应该再次发送
		mockSocket.send.mockClear()
		vi.advanceTimersByTime(100)
		expect(mockSocket.send).toHaveBeenCalledWith('PING')
	})
	it('应该在连接关闭后自动重连', async () => {
		useSocket('ws://example.com', { autoReconnect: true, reconnectDelay: 200 })
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 模拟连接关闭
		mockSocket.onclose?.({ code: 1006 }) // 非正常关闭
		await nextTick()
		// 清除之前的WebSocket调用
		global.WebSocket.mockClear()
		// 等待重连延迟
		vi.advanceTimersByTime(200)
		// 验证尝试重连
		expect(global.WebSocket).toHaveBeenCalledWith('ws://example.com')
	})
	it('主动断开连接不应该触发自动重连', async () => {
		const { disconnect } = useSocket('ws://example.com', { autoReconnect: true, reconnectDelay: 200 })
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 主动断开连接
		disconnect()
		await nextTick()
		// 清除之前的WebSocket调用
		global.WebSocket.mockClear()
		// 等待重连延迟
		vi.advanceTimersByTime(200)
		// 验证没有尝试重连
		expect(global.WebSocket).not.toHaveBeenCalled()
	})
	it('应该在环境不支持WebSocket时给出警告', async () => {
		// 临时删除WebSocket
		global.WebSocket = undefined
		useSocket('ws://example.com')
		// 验证警告信息
		expect(console.error).toHaveBeenCalledWith('WebSocket is not supported in this environment.')
	})
	it('应该在到达最大重连次数后停止尝试', async () => {
		useSocket('ws://example.com', {
			autoReconnect: true,
			reconnectDelay: 100,
			maxReconnectAttempts: 2,
		})
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 第一次断开连接
		mockSocket.simulateClose(1006)
		await nextTick()
		// 第一次重连
		vi.advanceTimersByTime(100)
		expect(global.WebSocket).toHaveBeenCalledTimes(2)
		// 再次断开
		mockSocket.simulateClose(1006)
		await nextTick()
		// 第二次重连
		vi.advanceTimersByTime(100)
		expect(global.WebSocket).toHaveBeenCalledTimes(3)
		// 再次断开
		mockSocket.simulateClose(1006)
		await nextTick()
		// 清除WebSocket调用记录
		global.WebSocket.mockClear()
		// 等待可能的第三次重连
		vi.advanceTimersByTime(100)
		// 验证没有第三次重连尝试
		expect(global.WebSocket).not.toHaveBeenCalled()
	})
	it('应该在连接错误时记录日志', async () => {
		useSocket('ws://example.com')
		// 连接WebSocket
		vi.advanceTimersByTime(50)
		await nextTick()
		// 模拟连接错误
		const errorEvent = new Event('error')
		mockSocket.triggerError(errorEvent)
		// 验证错误被记录
		expect(console.error).toHaveBeenCalledWith('WebSocket error:', errorEvent)
	})
	it('应该支持初始化后手动连接', async () => {
		const { socket, connect, connected } = useSocket('ws://example.com', {
			autoConnect: false, // 不自动连接
		})
		// 验证初始化时没有连接
		expect(global.WebSocket).not.toHaveBeenCalled()
		expect(socket.value).toBe(null)
		// 手动连接
		connect()
		// 验证连接建立
		expect(global.WebSocket).toHaveBeenCalledWith('ws://example.com')
		// 触发连接完成
		vi.advanceTimersByTime(50)
		await nextTick()
		expect(connected.value).toBe(true)
	})
	it('应该支持动态修改URL', async () => {
		const dynamicUrl = ref('ws://example.com')
		const { connected } = useSocket(dynamicUrl)
		// 初始连接
		vi.advanceTimersByTime(50)
		await nextTick()
		expect(connected.value).toBe(true)
		expect(global.WebSocket).toHaveBeenCalledWith('ws://example.com')
		// 断开现有连接
		mockSocket.simulateClose()
		await nextTick()
		// 修改URL
		dynamicUrl.value = 'ws://new-server.com'
		await nextTick()
		// 验证使用新URL重连
		expect(global.WebSocket).toHaveBeenCalledWith('ws://new-server.com')
	})
})
//# sourceMappingURL=socket.spec.js.map
