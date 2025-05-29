import { defineComponent } from 'vue'
import { useApiFormController } from '../useController'
import type { AccessItem } from '@/types/access'
import type { PropType } from 'vue'

/**
 * API管理表单组件Props接口
 */
interface ApiManageFormProps {
	data?: AccessItem
}

/**
 * 授权API管理表单组件
 * @description 用于添加和编辑授权API的表单组件
 */
export default defineComponent({
	name: 'ApiManageForm',
	props: {
		data: {
			type: Object as PropType<AccessItem>,
			default: () => undefined,
		},
	},
	setup(props) {
		const { ApiManageForm } = useApiFormController(props as ApiManageFormProps)
		return () => (
			<div class="p-4">
				<ApiManageForm labelPlacement="top" requireMarkPlacement="right-hanging" />
			</div>
		)
	},
})
