import { FormRules } from 'naive-ui'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'

const validator = createNodeValidator('等待')

export default {
	seconds: validator.custom((rule, value) => {
		if (value === undefined || value === null || value === '') {
			return new Error('请输入等待秒数')
		}
		if (typeof value !== 'number' || Number.isNaN(value)) {
			return new Error('等待秒数格式错误')
		}
		if (!Number.isInteger(value)) {
			return new Error('等待秒数必须为整数')
		}
		if (value < 1) {
			return new Error('等待秒数必须大于等于 1')
		}
		return true
	}, ['input', 'blur', 'change']),
} as FormRules
