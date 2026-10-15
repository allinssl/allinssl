import { FormRules } from 'naive-ui'
import { $t } from '@locales/index'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'
import type { UploadNodeConfig } from '@components/FlowChart/types'

// 创建上传节点验证器
const validator = createNodeValidator($t('t_12_1747817611391'))

// 导出上传节点验证规则
export default (config: UploadNodeConfig): FormRules => ({
	...(config.cert_id || (!config.cert && !config.key) ? {
		cert_id: validator.required('cert_id', '请选择证书'),
	} : {
		key: validator.required('key', $t('t_38_1745735769521'), ['input', 'blur', 'focus']),
		cert: validator.required('cert', $t('t_40_1745735815317'), ['input', 'blur', 'focus']),
	}),
	...(config.use_local_cert ? {
		domains: validator.required('domains', '请选择证书以获取匹配域名'),
		end_day: { type: 'number', required: true, min: 1, message: '请填写剩余有效期阈值（至少1天）', trigger: ['input', 'blur'] },
	} : {}),
})
