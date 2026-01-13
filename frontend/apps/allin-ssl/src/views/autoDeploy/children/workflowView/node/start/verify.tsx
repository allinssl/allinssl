import type { FormRules } from 'naive-ui'
import { $t } from '@locales/index'

export default {
	exec_type: { required: true, message: $t('t_31_1745735767891'), trigger: 'change' },
	type: { required: true, message: $t('t_32_1745735767156'), trigger: 'change' },
	week: { required: true, message: $t('t_33_1745735766532'), trigger: 'input', type: 'number' },
	month: { required: true, message: $t('t_33_1745735766532'), trigger: 'input', type: 'number' },
	hour: { required: true, message: $t('t_33_1745735766532'), trigger: 'input', type: 'number' },
	minute: { required: true, message: $t('t_33_1745735766532'), trigger: 'input', type: 'number' },
} as FormRules
