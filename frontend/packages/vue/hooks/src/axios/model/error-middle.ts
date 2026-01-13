import { AxiosError } from 'axios'

export const handleResponseError = (error: AxiosError): never => {
	// 自定义错误处理逻辑通知等
	console.error('Handled Error:', error)
	throw error
}
