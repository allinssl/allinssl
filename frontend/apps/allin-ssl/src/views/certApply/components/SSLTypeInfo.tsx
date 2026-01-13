import { NCard, NText, NList, NListItem, NIcon, NDivider, NButton, NSpace } from 'naive-ui'
import { SafetyCertificateOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@vicons/antd'

interface SSLTypeInfoProps {
	certType: string
	typeInfo: {
		title: string
		features: string[]
		advantages: string
		disadvantages: string
		recommendation: string
	}
}

/**
 * SSL证书类型说明组件
 */
export default defineComponent({
	name: 'SSLTypeInfo',
	props: {
		certType: {
			type: String,
			required: true,
		},
		typeInfo: {
			type: Object as PropType<SSLTypeInfoProps['typeInfo']>,
			required: true,
		},
	},
	setup(props) {
		// 获取图标类型
		const getIcon = (certType: string) => {
			switch (certType) {
				case 'dv':
					return <SafetyCertificateOutlined />
				case 'ov':
					return <SafetyCertificateOutlined />
				case 'ev':
					return <SafetyCertificateOutlined />
				default:
					return <InfoCircleOutlined />
			}
		}

		// 获取图标颜色
		const getColor = (certType: string) => {
			switch (certType) {
				case 'dv':
					return '#18a058'
				case 'ov':
					return '#2080f0'
				case 'ev':
					return '#8a2be2'
				default:
					return '#999'
			}
		}

		return () => (
			<NCard class="mb-[2.4rem]">
				<div class="flex items-center gap-[1.2rem]">
					<NIcon size={36} color={getColor(props.certType)}>
						{getIcon(props.certType)}
					</NIcon>
					<h3 class="m-0 text-lg">{props.typeInfo.title}</h3>
				</div>

				<NDivider />

				<div class="mb-[2rem]">
					<NText depth={2}>证书特点</NText>
					<NList>
						{props.typeInfo.features.map((feature, index) => (
							<NListItem key={index}>
								<NSpace align="center">
									<NIcon color={getColor(props.certType)} size={16}>
										<CheckCircleOutlined />
									</NIcon>
									<span>{feature}</span>
								</NSpace>
							</NListItem>
						))}
					</NList>

					<div class="mb-[1.2rem]">
						<NText depth={2}>{props.typeInfo.advantages}</NText>
					</div>

					<div class="mb-[1.2rem]">
						<NText depth={2}>{props.typeInfo.disadvantages}</NText>
					</div>

					<div class="mt-[1.6rem] text-center">
						<NText strong>{props.typeInfo.recommendation}</NText>
					</div>
				</div>

				<div>
					<NButton type="primary" onClick={() => window.open('https://www.bt.cn/new/ssl.html', '_blank')} block>
						了解更多详情
					</NButton>
				</div>
			</NCard>
		)
	},
})
