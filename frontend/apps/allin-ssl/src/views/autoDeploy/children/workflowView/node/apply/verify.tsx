import { FormRules } from 'naive-ui'
import { $t } from '@locales/index'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'

// 创建申请节点验证器
const validator = createNodeValidator($t('t_10_1747817611126'))

// 导出申请节点验证规则
export default {
	domains: validator.domainGroup(),
	email: validator.email(),
	provider_id: validator.required('provider_id', $t('t_3_1745490735059')),
	end_day: validator.custom((rule, value) => {
		// 检查值是否为数字类型且大于0
		if (typeof value !== 'number' || isNaN(value) || value < 1) {
			return new Error($t('t_9_1747990229640'))
		}
		return true
	}),
} as FormRules
