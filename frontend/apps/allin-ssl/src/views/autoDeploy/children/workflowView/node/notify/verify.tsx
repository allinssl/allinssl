import type { FormItemRule, FormRules } from 'naive-ui'
import { $t } from '@locales/index'

export default {
	subject: {
		trigger: 'input',
		required: true,
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_3_1745887835089')))
				} else if (value.length > 100) {
					reject(new Error($t('t_3_1745887835089') + '长度不能超过100个字符'))
				} else {
					resolve()
				}
			})
		},
	},
	body: {
		trigger: 'input',
		required: true,
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_4_1745887835265')))
				} else if (value.length > 1000) {
					reject(new Error($t('t_4_1745887835265') + '长度不能超过1000个字符'))
				} else {
					resolve()
				}
			})
		},
	},
	provider_id: {
		trigger: 'change',
		type: 'string',
		required: true,
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_0_1745887835267')))
				} else {
					resolve()
				}
			})
		},
	},
} as FormRules
