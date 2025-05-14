import { defineComponent, PropType } from 'vue'
import { NTag, NText } from 'naive-ui'
import SvgIcon from '../svgIcon/index' // 注意修改引入路径以匹配实际位置

// 定义支持的访问类型
const types = {
	ssh: 'SSH',
	aliyun: '阿里云',
	tencentcloud: '腾讯云',
	btpanel: '宝塔面板',
	'1panel': '1Panel',
	huaweicloud: '华为云',
	cloudflare: 'Cloudflare',
	mail: '邮件',
	dingtalk: '钉钉',
	wecom: '企业微信',
	feishu: '飞书',
	webhook: 'WebHook',
	'tencentcloud-cdn': '腾讯云CDN',
	'tencentcloud-cos': '腾讯云COS',
	'aliyun-cdn': '阿里云CDN',
	'aliyun-oss': '阿里云OSS',
	'1panel-site': '1Panel网站',
	'btpanel-site': '宝塔面板网站',
}

export const AuthApiTypeIcon = defineComponent({
	name: 'TypeIcon',
	props: {
		// 图标类型
		icon: {
			type: String as PropType<keyof typeof types | string>,
			required: true,
		},
		// tag类型
		type: {
			type: String as PropType<'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'>,
			default: 'default',
		},
		// 对齐方式
		align: {
			type: String as PropType<'left' | 'right'>,
			default: 'left',
		},
		// 是否显示文本
		text: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		// 获取图标路径的函数 - 进一步优化版
		const iconPath = computed(() => {
			const isNotify = ['mail', 'dingtalk', 'wecom', 'feishu', 'webhook'].includes(props.icon)
			const RESOURCE_PREFIX = isNotify ? 'notify-' : 'resources-'

			// 所有支持的类型直接映射到对应的资源名称
			const iconMap: Record<string, string> = {
				ssh: 'ssh',
				aliyun: 'aliyun',
				tencentcloud: 'tencentcloud',
				btpanel: 'btpanel',
				'1panel': '1panel',
				huaweicloud: 'huaweicloud',
				cloudflare: 'cloudflare',
				mail: 'mail',
				dingtalk: 'dingtalk',
				wecom: 'wecom',
				feishu: 'feishu',
				webhook: 'webhook',
				'tencentcloud-cdn': 'tencentcloud',
				'tencentcloud-cos': 'tencentcloud',
				'aliyun-cdn': 'aliyun',
				'aliyun-oss': 'aliyun',
				'1panel-site': '1panel',
				'btpanel-site': 'btpanel',
			}

			// 返回匹配的图标路径或默认图标
			return RESOURCE_PREFIX + (iconMap[props.icon] || 'default')
		})
		const typeName = computed(() => types[props.icon as keyof typeof types] || props.icon)

		watch(
			() => props.icon,
			(newVal) => {
				console.log(newVal, 'newVal')
			},
		)

		watch(
			() => props.type,
			(newVal) => {
				console.log(newVal, 'newVal')
			},
		)

		return () => (
			<NTag type={props.type} size="small">
				<SvgIcon icon={iconPath.value} size="1.2rem" class="mr-[0.4rem]" />
				<span class="text-[12px]">{props.text && <span>{typeName.value}</span>}</span>
			</NTag>
		)
	},
})

// 默认导出组件，方便使用
export default AuthApiTypeIcon
