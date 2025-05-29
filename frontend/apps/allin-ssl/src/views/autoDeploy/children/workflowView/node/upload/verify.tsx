import { FormRules } from 'naive-ui'
import { $t } from '@locales/index'
import { createNodeValidator } from '@workflowView/lib/NodeValidator'

// 创建上传节点验证器
const validator = createNodeValidator($t('t_12_1747817611391'))

// 导出上传节点验证规则
export default {
	key: validator.required('key', $t('t_38_1745735769521'), ['input', 'blur', 'focus']),
	cert: validator.required('cert', $t('t_40_1745735815317'), ['input', 'blur', 'focus']),
} as FormRules
