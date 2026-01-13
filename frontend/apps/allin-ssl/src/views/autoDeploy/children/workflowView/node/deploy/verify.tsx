import { FormRules } from 'naive-ui'
import { $t } from '@locales/index'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'
import { isDomainOrWildcardDomain } from '@baota/utils/business'

// 创建部署节点验证器
const validator = createNodeValidator($t('t_11_1747817612051'))

// 导出部署节点验证规则
export default {
	provider: validator.required('provider', $t('t_0_1746858920894')),

	provider_id: validator.custom((rule, value) => {
		if (!value) {
			return new Error($t('t_0_1746858920894'))
		}
		return true
	}),

	'inputs.fromNodeId': validator.required('inputs.fromNodeId', $t('t_3_1745748298161')),

	// SSH相关字段验证
	certPath: validator.required('certPath', $t('t_30_1746667591892'), 'input'),
	keyPath: validator.required('keyPath', $t('t_31_1746667593074'), 'input'),

	// 站点相关字段验证
	siteName: validator.custom((rule, value) => {
		if (!value) {
			return new Error($t('t_1_1747296175494'))
		}
		// 支持字符串和数组两种类型
		if (typeof value === 'string') {
			if (!value.trim()) {
				return new Error($t('t_1_1747296175494'))
			}
		} else if (Array.isArray(value)) {
			if (value.length === 0) {
				return new Error($t('t_1_1747296175494'))
			}
		} else {
			return new Error($t('t_1_1747296175494'))
		}
		return true
	}, 'input'),

	// 1panel相关字段验证
	site_id: validator.required('site_id', $t('t_24_1745735766826'), 'input'),

	// CDN相关字段验证
	domain: validator.custom((rule, value) => {
		if (!value) {
			return new Error($t('t_0_1744958839535'))
		}
		return true
	}, 'input'),

	// 存储桶相关字段验证
	region: validator.required('region', $t('t_25_1745735766651'), 'input'),
	bucket: validator.required('bucket', $t('t_26_1745735767144'), 'input'),

	// 插件相关字段验证
	action: validator.required('action', '请选择插件方法', 'select'),
} as FormRules
