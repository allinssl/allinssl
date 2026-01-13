import { defineComponent } from 'vue'
import { NSpace, NButton } from 'naive-ui'
import { useMessage, createAllApi } from '../hooks'

// 创建全局API实例，可以在组件外使用
const globalApi = createAllApi()

// 组件外使用示例
function showGlobalMessage(type: 'success' | 'error' | 'info' | 'warning') {
	switch (type) {
		case 'success':
			globalApi.message.success('这是一条全局成功消息')
			break
		case 'error':
			globalApi.message.error('这是一条全局错误消息')
			break
		case 'info':
			globalApi.message.info('这是一条全局信息消息')
			break
		case 'warning':
			globalApi.message.warning('这是一条全局警告消息')
			break
	}
}

// API请求结果示例
function handleApiResult(success: boolean) {
	const result = {
		status: success,
		message: success ? '操作成功！' : '操作失败，请重试',
	}

	// 使用统一的request方法处理
	globalApi.message.request(result)
}

export default defineComponent({
	name: 'MessageExample',
	setup() {
		// 在组件内使用useMessage
		const message = useMessage()

		// 组件内显示消息
		const showComponentMessage = (type: 'success' | 'error' | 'info' | 'warning') => {
			switch (type) {
				case 'success':
					message.success('这是一条组件内成功消息')
					break
				case 'error':
					message.error('这是一条组件内错误消息')
					break
				case 'info':
					message.info('这是一条组件内信息消息')
					break
				case 'warning':
					message.warning('这是一条组件内警告消息')
					break
			}
		}

		// 组件内处理API请求结果
		const handleComponentApiResult = (success: boolean) => {
			const result = {
				status: success,
				message: success ? '操作成功！' : '操作失败，请重试',
			}

			// 使用统一的request方法处理
			message.request(result)
		}

		return {
			showComponentMessage,
			handleComponentApiResult,
		}
	},
	render() {
		return (
			<div>
				<h2>Message 消息示例</h2>

				<h3>组件内使用 useMessage</h3>
				<NSpace>
					<NButton type="primary" onClick={() => this.showComponentMessage('success')}>
						成功消息
					</NButton>
					<NButton type="error" onClick={() => this.showComponentMessage('error')}>
						错误消息
					</NButton>
					<NButton onClick={() => this.showComponentMessage('info')}>信息消息</NButton>
					<NButton type="warning" onClick={() => this.showComponentMessage('warning')}>
						警告消息
					</NButton>
					<NButton type="success" onClick={() => this.handleComponentApiResult(true)}>
						API成功结果
					</NButton>
					<NButton type="error" onClick={() => this.handleComponentApiResult(false)}>
						API失败结果
					</NButton>
				</NSpace>

				<h3>全局使用 createAllApi</h3>
				<NSpace>
					<NButton type="primary" onClick={() => showGlobalMessage('success')}>
						全局成功消息
					</NButton>
					<NButton type="error" onClick={() => showGlobalMessage('error')}>
						全局错误消息
					</NButton>
					<NButton onClick={() => showGlobalMessage('info')}>全局信息消息</NButton>
					<NButton type="warning" onClick={() => showGlobalMessage('warning')}>
						全局警告消息
					</NButton>
					<NButton type="success" onClick={() => handleApiResult(true)}>
						全局API成功结果
					</NButton>
					<NButton type="error" onClick={() => handleApiResult(false)}>
						全局API失败结果
					</NButton>
				</NSpace>
			</div>
		)
	},
})
