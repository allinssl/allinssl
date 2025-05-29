import { defineComponent, PropType } from 'vue'
import { NTag } from 'naive-ui'

// 类型导入
import type { AuthApiTypeIconProps } from './types'

// 绝对路径内部导入 - 组件
import SvgIcon from '@components/SvgIcon' // 请确保此路径 @components/SvgIcon 是正确的

// 相对路径内部导入 - Controllers/Composables
import { useAuthApiTypeIconController } from './useController'

/**
 * @component AuthApiTypeIcon
 * @description 用于显示不同授权API或资源类型的图标和文本标签。
 *              数据来源于 /lib/data.tsx。
 *
 * @example
 * <AuthApiTypeIcon icon="aliyun" type="primary" />
 * <AuthApiTypeIcon icon="mail" />
 * <AuthApiTypeIcon icon="custom-type-key" :text="false" />
 */
export default defineComponent({
	name: 'AuthApiTypeIcon',
	props: {
		/**
		 * 图标类型键。
		 * 该键用于从 /lib/data.tsx 配置中查找对应的图标和名称。
		 */
		icon: {
			type: String as PropType<AuthApiTypeIconProps['icon']>,
			required: true,
		},
		/**
		 * NTag 的类型。
		 */
		type: {
			type: String as PropType<AuthApiTypeIconProps['type']>,
			default: 'default',
		},
		/**
		 * 文本是否显示。
		 */
		text: {
			type: Boolean as PropType<AuthApiTypeIconProps['text']>,
			default: true,
		},
	},
	setup(props: AuthApiTypeIconProps) {
		const { iconPath, typeName } = useAuthApiTypeIconController(props)

		return () => (
			<NTag type={props.type} size="small">
				<SvgIcon icon={iconPath.value} size="1.2rem" class="mr-[0.4rem]" />
				{props.text && <span class="text-[12px]">{typeName.value}</span>}
			</NTag>
		)
	},
})
