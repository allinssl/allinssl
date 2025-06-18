import { defineComponent } from 'vue'
import { useCAFormController } from '../useController'

interface CAManageFormProps {
	isEdit?: boolean
	editId?: string
}

/**
 * ACME账户表单组件
 */
export default defineComponent({
	name: 'CAManageForm',
	props: {
		isEdit: {
			type: Boolean,
			default: false,
		},
		editId: {
			type: String,
			default: '',
		},
	},
	setup(props: CAManageFormProps) {
		const { CAForm } = useCAFormController(props)
		return () => <CAForm labelPlacement="top" />
	},
})
