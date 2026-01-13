import { defineComponent, type PropType } from 'vue'
import { useMonitorFormController } from '../useController'

import type { UpdateSiteMonitorParams } from '@/types/monitor'

/**
 * 监控表单组件
 * @description 用于添加和编辑证书监控的表单界面
 */
export default defineComponent({
	name: 'MonitorForm',
	props: {
		/**
		 * 是否为编辑模式
		 */
		isEdit: {
			type: Boolean,
			default: false,
		},
		/**
		 * 编辑时的初始数据
		 */
		data: {
			type: Object as PropType<UpdateSiteMonitorParams | null>,
			default: () => null,
		},
	},
	setup(props) {
		// 使用表单控制器获取表单组件
		const { component: MonitorForm } = useMonitorFormController(props.data)

		// 返回渲染函数
		return () => <MonitorForm labelPlacement="top" />
	},
})
