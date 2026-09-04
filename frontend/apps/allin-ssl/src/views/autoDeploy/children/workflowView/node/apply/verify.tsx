import { FormRules } from 'naive-ui'
import { $t } from '@locales/index'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'

// 创建申请节点验证器
const validator = createNodeValidator($t('t_10_1747817611126'))

/**
 * 按申请方式生成验证规则
 * @param applyType 申请方式：acme（默认）| custom_api
 * @description 画布节点校验用；抽屉内 naive-ui 只校验已挂载的表单项，静态规则即可
 */
export const getApplyRules = (applyType?: string): FormRules => {
	const rules: FormRules = {
		domains: validator.domainGroup(),
		end_day: validator.custom((rule, value) => {
			// 检查值是否为数字类型且大于0
			if (typeof value !== 'number' || isNaN(value) || value < 1) {
				return new Error($t('t_9_1747990229640'))
			}
			return true
		}),
	}
	if (applyType === 'custom_api') {
		// 自定义API：必须选择提供方，邮箱可选不校验
		rules.provider_id = validator.required('provider_id', '请选择自定义API')
	} else {
		rules.email = validator.email()
		rules.provider_id = validator.required('provider_id', $t('t_3_1745490735059'))
	}
	return rules
}

// 导出申请节点验证规则（默认 ACME）
export default getApplyRules('acme')
