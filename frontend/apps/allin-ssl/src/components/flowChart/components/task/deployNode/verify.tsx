import type { FormRules, FormItemRule } from 'naive-ui'
import { $t } from '@locales/index'
import { isDomain } from '@baota/utils/business'

export default {
	provider: {
		required: true,
		message: $t('t_0_1746858920894'),
		type: 'string',
		trigger: 'change',
	},
	provider_id: {
		required: true,
		trigger: 'change',
		type: 'string',
		validator: (rule: FormItemRule, value: number) => {
			if (!value) {
				return new Error($t('t_0_1746858920894'))
			}
		},
	},
	'inputs.fromNodeId': {
		required: true,
		message: $t('t_3_1745748298161'),
		trigger: 'change',
	},

	certPath: {
		required: true,
		message: $t('t_30_1746667591892'),
		trigger: 'input',
	},
	keyPath: {
		required: true,
		message: $t('t_31_1746667593074'),
		trigger: 'input',
	},

	// btpanel相关字段
	siteName: {
		required: true,
		message: $t('请输入网址名'),
		trigger: 'input',
	},
	// 1panel相关字段
	site_id: {
		required: true,
		message: $t('t_24_1745735766826'),
		trigger: 'input',
	},
	// CDN相关字段
	domain: {
		required: true,
		trigger: 'input',
		validator: (rule: FormItemRule, value: string) => {
			if (!isDomain(value)) {
				return new Error($t('t_0_1744958839535'))
			}
		},
	},
	// 存储桶相关字段
	region: {
		required: true,
		message: $t('t_25_1745735766651'),
		trigger: 'input',
	},
	bucket: {
		required: true,
		message: $t('t_26_1745735767144'),
		trigger: 'input',
	},
} as FormRules
