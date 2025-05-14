import type { FormRules, FormItemRule } from 'naive-ui'
import { isDomainGroup, isEmail } from '@baota/utils/business'
import { $t } from '@locales/index'

export default {
	domains: {
		required: true,
		trigger: 'input',
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!isDomainGroup(value)) {
					reject(new Error($t('t_3_1747047218669')))
				} else if (!value) {
					reject(new Error($t('t_0_1744958839535')))
				} else {
					resolve()
				}
			})
		},
	},
	email: {
		required: true,
		trigger: 'input',
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!isEmail(value)) {
					reject(new Error($t('t_1_1745553909483')))
				} else if (!value) {
					reject(new Error($t('t_1_1746697485188')))
				} else {
					resolve()
				}
			})
		},
	},
	provider_id: {
		required: true,
		trigger: 'change',
		validator: (rule: FormItemRule, value: string) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_3_1745490735059')))
				} else {
					resolve()
				}
			})
		},
	},
	end_day: {
		required: true,
		trigger: 'input',
		validator: (rule: FormItemRule, value: number) => {
			return new Promise<void>((resolve, reject) => {
				if (!value) {
					reject(new Error($t('t_2_1745553907423')))
				} else {
					resolve()
				}
			})
		},
	},
} as FormRules
