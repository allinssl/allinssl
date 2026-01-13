import { useForm, useFormHooks, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { deepClone } from '@baota/utils/data'

import { $t } from '@locales/index'
import { getCertList, uploadCert } from '@api/cert'
import { useStore } from '@components/FlowChart/useStore'
import verifyRules from './verify'

import type { FormConfig } from '@baota/naive-ui/types/form'
import type { UploadNodeConfig } from '@components/FlowChart/types'
import type { CertItem } from '@/types/cert'
import { noSideSpace } from '@lib/utils'

export default defineComponent({
	name: 'UploadNodeDrawer',
	props: {
		// 节点配置数据
		node: {
			type: Object as PropType<{ id: string; config: UploadNodeConfig }>,
			default: () => ({
				id: '',
				config: {
					cert_id: '',
					cert: '',
					key: '',
				},
			}),
		},
	},
	setup(props) {
		// 获取store
		const { updateNodeConfig, isRefreshNode } = useStore()
		// 获取表单助手函数
		const { useFormTextarea, useFormSelect, useFormHelp } = useFormHooks()
		// 节点配置数据
		const param = ref(deepClone(props.node.config))
		// 弹窗辅助
		const { confirm, options } = useModalHooks()
		// 错误处理
		const { handleError } = useError()
		// 弹窗配置
		const modalOptions = options()

		// 证书列表
		const certList = ref<{ cert: string; key: string; label: string; value: string }[]>([
			{
				cert: '',
				key: '',
				label: '自定义证书',
				value: '',
			},
		])

		const isReadonly = computed(() => {
			return param.value.cert_id === '' ? false : true
		})

		const textAreaProps = computed(() => {
			return {
				readonly: isReadonly.value,
				allowInput: noSideSpace,
				rows: 6,
			}
		})

		// 表单渲染配置
		const formConfig = computed(
			() =>
				[
					useFormSelect(
						$t('t_0_1747110184700'),
						'cert_id',
						certList.value,
						{
							filterable: true,
							onUpdateValue: (val: string) => {
								param.value.cert_id = val
								const item = findCertItem(val)
								if (item) {
									param.value.cert = item.cert
									param.value.key = item.key
								}
							},
						},
						{ showRequireMark: false },
					),
					useFormTextarea($t('t_34_1745735771147'), 'cert', {
						placeholder: $t('t_35_1745735781545'),
						...textAreaProps.value,
					}),
					useFormTextarea($t('t_36_1745735769443'), 'key', {
						placeholder: $t('t_37_1745735779980'),
						...textAreaProps.value,
					}),
					useFormHelp([{ content: $t('t_1_1747110191587') }, { content: $t('t_2_1747110193465') }]),
				] as FormConfig,
		)

		// 创建表单实例
		const {
			component: Form,
			data,
			example,
		} = useForm<UploadNodeConfig>({
			defaultValue: param,
			config: formConfig,
			rules: verifyRules,
		})

		/**
		 * 查找证书项
		 * @param {string} val 证书值
		 * @returns {object} 证书项
		 */
		const findCertItem = (val: string) => {
			return certList.value.find((item) => item.value === val)
		}

		/**
		 * @description 渲染证书列表
		 */
		const renderCertList = async () => {
			try {
				const { data } = await getCertList({ p: 1, limit: 100 }).fetch()
				certList.value =
					data?.map((item: CertItem) => ({
						cert: item.cert,
						key: item.key,
						label: item.domains + ' 【 ' + item.issuer + ' 】',
						value: item.sha256,
					})) || []
				certList.value.unshift({
					cert: '',
					key: '',
					label: '自定义证书',
					value: '',
				})
			} catch (error) {
				certList.value = []
				handleError(error)
			}
		}
		onMounted(async () => {
			await renderCertList()
		})

		modalOptions.value.confirmText = computed(() => {
			return param.value.cert_id === '' ? $t('t_3_1747110185110') : $t('t_2_1744861190040')
		})

		// 确认事件触发
		confirm(async (close) => {
			try {
				await example.value?.validate()
				if (param.value.cert_id === '') {
					const { data } = await uploadCert(param.value).fetch()
					param.value.cert_id = data
				}
				updateNodeConfig(props.node.id, data.value) // 更新节点配置
				isRefreshNode.value = props.node.id // 刷新节点
				close()
			} catch (error) {
				handleError(error)
			}
		})

		return () => (
			<div class="upload-node-drawer">
				<Form labelPlacement="top" />
			</div>
		)
	},
})
