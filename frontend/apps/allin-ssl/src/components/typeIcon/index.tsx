import { defineComponent, PropType } from 'vue'
import { NTag, NFlex } from 'naive-ui'

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
		 * 图标类型键。支持单个字符串或字符串数组。
		 * 该键用于从 /lib/data.tsx 配置中查找对应的图标和名称。
		 */
		icon: {
			type: [String, Array] as PropType<AuthApiTypeIconProps['icon']>,
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
		const { iconPath, typeName, iconItems } = useAuthApiTypeIconController(props)

		return () => {
			// 如果是多个图标，显示多个标签
			if (Array.isArray(props.icon) && props.icon.length > 1) {
				return (
					<NFlex size="small" wrap={true} style="gap: 4px; flex-wrap: wrap;">
						{iconItems.value.map((item, index) => (
							<NTag
								key={item.key}
								type={props.type}
								size="small"
								class="w-auto text-ellipsis overflow-hidden whitespace-normal p-[.6rem] h-auto mb-1"
								style="margin-right: 4px; max-width: 100%;"
							>
								<SvgIcon icon={item.iconPath} size="1.2rem" class="mr-[0.4rem] flex-shrink-0" />
								{props.text && <span class="text-[12px] truncate">{item.typeName}</span>}
							</NTag>
						))}
					</NFlex>
				)
			}

			// 单个图标的显示（包括数组只有一个元素的情况）
			return (
				<NTag
					type={props.type}
					size="small"
					class="w-auto text-ellipsis overflow-hidden whitespace-normal p-[.6rem] h-auto"
					style="max-width: 100%;"
				>
					<SvgIcon icon={iconPath.value} size="1.2rem" class="mr-[0.4rem] flex-shrink-0" />
					{props.text && <span class="text-[12px] truncate">{typeName.value}</span>}
				</NTag>
			)
		}
	},
})
