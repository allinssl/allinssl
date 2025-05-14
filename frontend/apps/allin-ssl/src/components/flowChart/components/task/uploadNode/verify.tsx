import { $t } from '@locales/index'
import type { FormItemRule, FormRules } from 'naive-ui'
export default {
	key: {
		required: true,
		trigger: ['input', 'blur', 'focus'],
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_38_1745735769521')))
				} else {
					resolve()
				}
			})
		},
	},
	cert: {
		required: true,
		trigger: ['input', 'blur', 'focus'],
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_40_1745735815317')))
				} else {
					resolve()
				}
			})
		},
	},
} as FormRules
