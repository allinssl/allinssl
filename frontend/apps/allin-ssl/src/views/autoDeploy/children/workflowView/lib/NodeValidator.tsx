import { FormRules, FormItemRule } from 'naive-ui'
import { $t } from '@locales/index'
import { isDomain, isDomainGroup, isEmail } from '@baota/utils/business'

/**
 * 节点验证器工厂函数
 * @param nodeType 节点类型名称（用于显示错误信息时指定节点类型）
 */
export function createNodeValidator(nodeType: string) {
	return {
		/**
		 * 创建必填规则
		 * @param field 字段名称
		 * @param message 错误消息
		 * @param trigger 触发方式
		 */
		required(field: string, message: string, trigger: string | string[] = 'change'): FormItemRule {
			return {
				required: true,
				message: message || $t('t_3_1747817612697', { nodeName: nodeType, field }),
				trigger,
			}
		},

		/**
		 * 创建域名验证规则
		 * @param trigger 触发方式
		 */
		domain(trigger: string | string[] = 'input'): FormItemRule {
			return {
				required: true,
				trigger,
				validator: (rule: FormItemRule, value: string) => {
					if (!value) {
						return new Error($t('t_0_1744958839535'))
					}
					if (!isDomain(value)) {
						return new Error($t('t_4_1747817613325'))
					}
					return true
				},
			}
		},

		/**
		 * 创建域名组验证规则
		 * @param trigger 触发方式
		 */
		domainGroup(trigger: string | string[] = 'input'): FormItemRule {
			return {
				required: true,
				trigger,
				validator: (rule: FormItemRule, value: string) => {
					if (!value) {
						return new Error($t('t_0_1744958839535'))
					}
					if (!isDomainGroup(value)) {
						return new Error($t('t_5_1747817619337'))
					}
					return true
				},
			}
		},

		/**
		 * 创建邮箱验证规则
		 * @param trigger 触发方式
		 */
		email(trigger: string | string[] = 'input'): FormItemRule {
			return {
				required: true,
				trigger,
				validator: (rule: FormItemRule, value: string) => {
					if (!value) {
						return new Error($t('t_6_1747817644358'))
					}
					if (!isEmail(value)) {
						return new Error($t('t_7_1747817613773'))
					}
					return true
				},
			}
		},

		/**
		 * 创建自定义验证器
		 * @param validator 验证函数
		 * @param trigger 触发方式
		 */
		custom(
			validator: (rule: FormItemRule, value: any) => boolean | Error | Promise<void>,
			trigger: string | string[] = 'change',
		): FormItemRule {
			return {
				required: true,
				trigger,
				validator,
			}
		},
	}
}

/**
 * 创建包含节点类型的错误信息
 * @param nodeType 节点类型名称
 * @param fieldError 原始错误信息
 */
export function createNodeError(nodeType: string, fieldError: string): string {
	return `${nodeType}${$t('t_8_1747817614764')}: ${fieldError}`
}
