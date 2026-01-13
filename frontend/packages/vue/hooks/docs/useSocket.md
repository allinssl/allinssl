# useSocket 使用文档

## 基本介绍

`useSocket` 是一个基于 Vue 3 的 WebSocket 封装钩子函数，它提供了一种简洁的方式来管理 WebSocket 连接。通过这个钩子函数，你可以轻松地处理连接状态、消息收发、自动重连、心跳机制等功能。

## 核心函数

### useSocket

```typescript
function useSocket(url: string, options?: SocketOptions): UseSocketReturn
```

**参数**:

- `url`: 字符串类型，WebSocket 服务器的 URL
- `options`: 可选的 SocketOptions 配置对象

**SocketOptions 选项**:

```typescript
interface SocketOptions {
  autoReconnect?: boolean; // 是否自动重连, 默认为 true
  middleware?: (data: any) => any; // 数据中间件函数，支持原始数据处理，默认为直接返回
  maxReconnectAttempts?: number; // 最大重连次数, 默认无限制
  reconnectDelay?: number; // 重连延迟, 默认为3000ms
  heartbeatInterval?: number; // 心跳间隔, 单位毫秒, 默认为5000ms
  heartbeatMessage?: any; // 心跳包消息, 默认为 'ping'
}
```

**返回值**:
包含以下属性和方法的对象：

**状态属性**:

- `socket`: WebSocket 实例，类型为 `Ref<WebSocket | null>`
- `connected`: 连接状态，类型为 `Ref<boolean>`
- `message`: 接收到的消息，类型为 `Ref<any>`

**方法**:

- `connect()`: 建立 WebSocket 连接
- `disconnect()`: 主动断开连接，禁止自动重连
- `send(data: any)`: 发送数据，仅在连接状态时执行

## 使用示例

### 基本用法

```typescript
import { useSocket } from '@baota/hooks/socket'

// 创建 WebSocket 钩子
const { socket, connect, disconnect, send, message, connected } = useSocket('wss://example.com/ws')

// 建立连接
connect()

// 监听连接状态
watch(connected, (isConnected) => {
  if (isConnected) {
    console.log('WebSocket已连接')
  } else {
    console.log('WebSocket已断开')
  }
})

// 监听接收到的消息
watch(message, (newMessage) => {
  if (newMessage) {
    console.log('收到消息:', newMessage)
  }
})

// 发送消息
const sendMessage = () => {
  send(JSON.stringify({ type: 'greeting', content: '你好，服务器!' }))
}

// 断开连接
const closeConnection = () => {
  disconnect()
}
```

### 配置自动重连

```typescript
import { useSocket } from '@baota/hooks/socket'

// 配置自动重连
const { connect, disconnect } = useSocket('wss://example.com/ws', {
  autoReconnect: true,       // 启用自动重连
  maxReconnectAttempts: 5,   // 最多重连5次
  reconnectDelay: 2000       // 2秒后重连
})

// 建立连接
connect()
```

### 使用数据中间件

```typescript
import { useSocket } from '@baota/hooks/socket'

// 配置数据中间件，自动解析JSON
const { connect, message } = useSocket('wss://example.com/ws', {
  middleware: (data) => {
    try {
      return JSON.parse(data)
    } catch (e) {
      return data
    }
  }
})

// 建立连接
connect()

// 此时接收到的消息已经被解析为JSON对象
watch(message, (newMessage) => {
  if (newMessage) {
    console.log('消息类型:', newMessage.type)
    console.log('消息内容:', newMessage.content)
  }
})
```

### 配置心跳机制

```typescript
import { useSocket } from '@baota/hooks/socket'

// 配置心跳机制
const { connect } = useSocket('wss://example.com/ws', {
  heartbeatInterval: 10000,                  // 10秒发送一次心跳
  heartbeatMessage: JSON.stringify({ type: 'heartbeat' })  // 自定义心跳消息
})

// 建立连接，会自动启动心跳
connect()
```

### 与后端服务集成

```typescript
import { useSocket } from '@baota/hooks/socket'
import { ref } from 'vue'

// 创建聊天应用示例
const chatMessages = ref<{ sender: string; content: string }[]>([])
const newMessage = ref('')

const { connect, send, message, connected } = useSocket('wss://chat.example.com/ws', {
  middleware: (data) => JSON.parse(data)
})

// 连接到聊天服务器
connect()

// 监听新消息
watch(message, (msg) => {
  if (msg && msg.type === 'chat') {
    chatMessages.value.push({
      sender: msg.sender,
      content: msg.content
    })
  }
})

// 发送新消息
const sendChatMessage = () => {
  if (newMessage.value.trim() && connected.value) {
    send(JSON.stringify({
      type: 'chat',
      content: newMessage.value
    }))
    newMessage.value = ''
  }
}
```

### 在组件卸载时断开连接

```typescript
import { useSocket } from '@baota/hooks/socket'
import { onUnmounted } from 'vue'

export default {
  setup() {
    const { connect, disconnect, send, message, connected } = useSocket('wss://example.com/ws')
    
    // 建立连接
    connect()
    
    // 在组件卸载时断开连接
    onUnmounted(() => {
      disconnect()
    })
    
    return { send, message, connected }
  }
}
```

## 高级用法

### 结合 TypeScript 类型定义

```typescript
import { useSocket } from '@baota/hooks/socket'
import { ref, watch } from 'vue'

// 定义消息类型
interface ServerMessage {
  type: 'chat' | 'notification' | 'system';
  timestamp: number;
  content: string;
  sender?: string;
}

// 创建带类型的消息引用
const typedMessage = ref<ServerMessage | null>(null)

const { connect, message } = useSocket('wss://example.com/ws', {
  middleware: (data) => {
    try {
      return JSON.parse(data) as ServerMessage
    } catch (e) {
      console.error('消息解析失败:', e)
      return null
    }
  }
})

connect()

// 监听并处理不同类型的消息
watch(message, (newMessage) => {
  if (newMessage) {
    typedMessage.value = newMessage
    
    switch (newMessage.type) {
      case 'chat':
        console.log(`[${newMessage.sender}]: ${newMessage.content}`)
        break
      case 'notification':
        console.log(`通知: ${newMessage.content}`)
        break
      case 'system':
        console.log(`系统消息: ${newMessage.content}`)
        break
    }
  }
})
```

### 处理多个 WebSocket 连接

```typescript
import { useSocket } from '@baota/hooks/socket'

// 创建多个 WebSocket 连接
const chatSocket = useSocket('wss://chat.example.com/ws')
const notificationSocket = useSocket('wss://notification.example.com/ws')
const dataStreamSocket = useSocket('wss://datastream.example.com/ws')

// 分别连接
chatSocket.connect()
notificationSocket.connect()
dataStreamSocket.connect()

// 监听不同连接的消息
watch(chatSocket.message, (msg) => {
  console.log('聊天消息:', msg)
})

watch(notificationSocket.message, (msg) => {
  console.log('通知消息:', msg)
})

watch(dataStreamSocket.message, (msg) => {
  console.log('数据流消息:', msg)
})

// 发送不同类型的消息
const sendChatMessage = (content) => {
  chatSocket.send(JSON.stringify({ type: 'chat', content }))
}

const sendCommand = (command) => {
  dataStreamSocket.send(JSON.stringify({ type: 'command', command }))
}
```

### 实现可视化的连接状态

```typescript
import { useSocket } from '@baota/hooks/socket'
import { computed } from 'vue'

const { connect, disconnect, connected } = useSocket('wss://example.com/ws')

// 计算连接状态的显示文本和样式
const connectionStatus = computed(() => {
  return connected.value ? '已连接' : '未连接'
})

const statusClass = computed(() => {
  return {
    'status-connected': connected.value,
    'status-disconnected': !connected.value
  }
})

// 连接按钮的状态
const connectButtonText = computed(() => {
  return connected.value ? '断开连接' : '建立连接'
})

// 切换连接状态的方法
const toggleConnection = () => {
  if (connected.value) {
    disconnect()
  } else {
    connect()
  }
}
``` 