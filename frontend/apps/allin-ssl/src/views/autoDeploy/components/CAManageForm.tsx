import { defineComponent } from 'vue'
import { useCAFormController } from '../useController'

/**
 * CA授权表单组件
 */
export default defineComponent({
	name: 'CAManageForm',
	setup() {
		const { CAForm } = useCAFormController()
		return () => <CAForm labelPlacement="top" />
	},
})
