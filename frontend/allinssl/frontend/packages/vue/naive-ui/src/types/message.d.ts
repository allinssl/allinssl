import type { MessageOptions, MessageReactive } from './message'

// 消息类型
export interface MessageApiExtended {
	success: (content: string, options?: MessageOptions) => MessageReactive | undefined
	warning: (content: string, options?: MessageOptions) => MessageReactive | undefined
	error: (content: string, options?: MessageOptions) => MessageReactive | undefined
	info: (content: string, options?: MessageOptions) => MessageReactive | undefined
	loading: (content: string, options?: MessageOptions) => MessageReactive | undefined
	request: (data: { status: boolean; message: string }, options?: MessageOptions) => MessageReactive | undefined
	destroyAll: () => void
}
