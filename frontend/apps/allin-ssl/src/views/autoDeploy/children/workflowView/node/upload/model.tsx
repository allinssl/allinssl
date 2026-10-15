import { NButton, NFormItem, NSelect } from 'naive-ui'
import { useForm, useFormHooks, useModal, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { deepClone } from '@baota/utils/data'

import { $t } from '@locales/index'
import { getCertList } from '@api/cert'
import { useStore } from '@components/FlowChart/useStore'
import verifyRules from './verify'

import type { FormConfig } from '@baota/naive-ui/types/form'
import type { UploadNodeConfig } from '@components/FlowChart/types'
import type { CertItem } from '@/types/cert'
import UploadCertForm from './uploadCert'

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
					domains: '',
					use_local_cert: false,
					end_day: 30,
				},
			}),
		},
	},
	setup(props) {
		// 获取store
		const { updateNodeConfig, isRefreshNode } = useStore()
		// 获取表单助手函数
		const { useFormCustom, useFormHelp, useFormInput, useFormSwitch, useFormInputNumber } = useFormHooks()
		// 节点配置数据
		const { cert, key, ...config } = deepClone(props.node.config)
		const param = ref<UploadNodeConfig>({ cert_id: '', domains: '', use_local_cert: false, end_day: 30, ...config })
		// 弹窗辅助
		const { confirm, options } = useModalHooks()
		// 错误处理
		const { handleError } = useError()
		// 弹窗配置
		const modalOptions = options()

		// 证书列表
		const certList = ref<{ domains: string; label: string; value: string; id?: number }[]>([])
		const openUpload = () => useModal({
			title: '上传证书',
			area: 600,
			component: UploadCertForm,
			componentProps: {
				cert: param.value.cert_id ? '' : cert,
				privateKey: param.value.cert_id ? '' : key,
				onUploaded: async (certId: string) => {
					await renderCertList()
					const selected = certList.value.find((item) => item.value === certId)
					if (!selected) throw new Error('未获取到已上传证书的域名')
					param.value.cert_id = selected.value
					param.value.domains = selected.domains
				},
			},
			footer: true,
			confirmText: '上传',
		})

		// 表单渲染配置
		const formConfig = computed(
			() =>
				[
					useFormCustom(() => (
						<NFormItem label={$t('t_0_1747110184700')} path="cert_id">
							<div class="flex w-full gap-2">
								<NSelect
									class="flex-1 min-w-0"
									filterable
									placeholder="请选择证书"
									options={certList.value}
									value={param.value.cert_id || null}
									onUpdateValue={(val: string) => {
										param.value.cert_id = val
										param.value.domains = certList.value.find((item) => item.value === val)?.domains || ''
									}}
								/>
								<NButton onClick={openUpload}>上传</NButton>
							</div>
						</NFormItem>
					)),
					useFormSwitch('从本地获取符合条件的证书', 'use_local_cert'),
					...(param.value.use_local_cert ? [
						useFormInput('域名', 'domains', { readonly: true, placeholder: '选择证书后自动填入域名' }),
						useFormInputNumber('剩余有效期阈值（天）', 'end_day', { min: 1, precision: 0, class: 'w-full', placeholder: '请输入剩余有效期阈值' }),
						useFormHelp([{ content: '原证书剩余有效期小于等于此天数时，按保存域名获取剩余有效期大于此天数的本地证书；没有匹配证书则报错。' }]),
					] : []),
				] as FormConfig,
		)

		// 创建表单实例
		const {
			component: Form,
			data,
			example,
			rules,
		} = useForm<UploadNodeConfig>({
			defaultValue: param,
			config: formConfig,
			rules: verifyRules(param.value),
		})
		watch(() => [param.value.cert_id, param.value.use_local_cert], () => {
			rules.value = verifyRules(param.value)
		})

		/**
		 * @description 渲染证书列表
		 */
		const renderCertList = async () => {
			try {
				const { data } = await getCertList({ p: 1, limit: -1 }).fetch()
				certList.value =
					data?.map((item: CertItem) => ({
						domains: item.domains,
						id: item.id,
						label: item.domains + ' 【 ' + item.issuer + ' 】',
						value: item.sha256,
					})) || []
				const selected = certList.value.find((item) => item.value === param.value.cert_id || String(item.id) === String(param.value.cert_id))
				if (selected && param.value.cert_id) {
					param.value.cert_id = selected.value
					if (!param.value.domains) param.value.domains = selected.domains
				}
			} catch (error) {
				certList.value = []
				throw error
			}
		}
		onMounted(() => {
			renderCertList().catch(handleError)
		})

		modalOptions.value.confirmText = $t('t_2_1744861190040')

		// 确认事件触发
		confirm(async (close) => {
			try {
				await nextTick()
				await example.value?.validate()
				const { cert_id, domains, use_local_cert, end_day } = data.value
				updateNodeConfig(props.node.id, { cert_id, domains, use_local_cert, end_day })
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
