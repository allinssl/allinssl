import { defineComponent, ref, type PropType } from 'vue'
import { NForm, NFormItem, NInput, NSelect, NRadioGroup, NRadioButton, type FormInst } from 'naive-ui'
import { useModalHooks, useModalClose } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { useStore } from '@settings/useStore'
import CustomApiEditor, { createCustomApiStep, matchCustomApiUsage } from '@components/customApiEditor'
import { getAccessAllList } from '@api/access'
import type { ReportCustomApi } from '@/types/setting'

/** 通知场景的系统内置变量 */
const notifySystemVars = [
	{ label: '通知主题', value: '{{subject}}' },
	{ label: '通知正文内容', value: '{{body}}' },
	{ label: '通知对象（证书）的域名列表，无证书时为空', value: '{{domains}}' },
	{ label: '通知对象（证书）的第一个域名', value: '{{domain}}' },
]

export default defineComponent({
	name: 'CustomApiChannelModel',
	props: {
		data: {
			type: Object as PropType<{ id?: number; name: string; type: string; config: string | Partial<ReportCustomApi> } | null>,
			default: () => null,
		},
	},
	setup(props) {
		const { handleError } = useError()
		const { confirm } = useModalHooks()
		const closeModal = useModalClose()
		const { fetchNotifyChannels, customApiChannelForm } = useStore()

		const formRef = ref<FormInst | null>(null)
		const formData = ref<ReportCustomApi>(JSON.parse(JSON.stringify(customApiChannelForm.value)))
		formData.value.source = formData.value.source || 'inline'
		formData.value.access_id = formData.value.access_id || ''

		// 授权API（自定义HTTP(S)）提供方选项（仅告警提供商用途）
		const accessOptions = ref<Array<{ label: string; value: string }>>([])
		const isLoadingAccess = ref(false)
		const loadAccessOptions = async () => {
			isLoadingAccess.value = true
			try {
				const { data } = await getAccessAllList({ type: 'custom_api' }).fetch()
				accessOptions.value = (data || [])
					.filter((item) => matchCustomApiUsage((item as any).config || '', 'notify'))
					.map((item) => ({
						label: item.name,
						value: String(item.id),
					}))
			} catch (error) {
				handleError(error)
			} finally {
				isLoadingAccess.value = false
			}
		}
		loadAccessOptions()

		if (props.data) {
			try {
				const parsed =
					typeof props.data.config === 'string' ? JSON.parse(props.data.config || '{}') : props.data.config || {}
				formData.value = {
					name: props.data.name || '',
					enabled: parsed.enabled ?? '1',
					source: parsed.source || 'inline',
					access_id: parsed.access_id || '',
					variables: parsed.variables || [],
					steps: parsed.steps?.length ? parsed.steps : [createCustomApiStep('step1')],
				}
			} catch {
				formData.value.name = props.data.name || ''
			}
		}

		const validateForm = async () => {
			try {
				await formRef.value?.validate()
				return true
			} catch {
				return false
			}
		}

		const handleSubmit = async () => {
			if (!(await validateForm())) {
				return false
			}
			const payload = {
				type: 'custom_api',
				name: formData.value.name || '',
				config: JSON.stringify({
					enabled: formData.value.enabled,
					source: formData.value.source,
					access_id: formData.value.access_id,
					variables: formData.value.variables,
					steps: formData.value.steps,
				}),
			}
			try {
				const { addReportChannel, updateReportChannel } = useStore()
				if (props.data?.id) {
					await updateReportChannel({ id: props.data.id, ...payload })
				} else {
					await addReportChannel(payload)
				}
				fetchNotifyChannels()
				return true
			} catch (error) {
				handleError(error)
				return false
			}
		}

		confirm(async () => {
			const ok = await handleSubmit()
			if (ok) {
				closeModal()
			}
		})

		return () => (
			<div class="custom-api-channel-form p-2">
				<NForm ref={formRef} model={formData.value} labelPlacement="top">
					<NFormItem label="渠道名称" path="name" rule={{ required: true, message: '请输入渠道名称', trigger: 'blur' }}>
						<NInput v-model:value={formData.value.name} placeholder="自定义API" />
					</NFormItem>
					<NFormItem label="配置来源" path="source">
						<NRadioGroup v-model:value={formData.value.source}>
							<NRadioButton value="inline">内联配置</NRadioButton>
							<NRadioButton value="access">引用授权API</NRadioButton>
						</NRadioGroup>
					</NFormItem>
					{formData.value.source === 'access' ? (
						<NFormItem
							label="授权API（自定义HTTP(S)）"
							path="access_id"
							rule={{ required: true, message: '请选择授权API', trigger: 'change' }}
						>
							<NSelect
								v-model:value={formData.value.access_id}
								options={accessOptions.value}
								loading={isLoadingAccess.value}
								filterable
								placeholder="在授权API管理中维护，可复用于签发/部署/告警"
							/>
						</NFormItem>
					) : (
						<CustomApiEditor value={formData.value} systemVars={notifySystemVars} />
					)}
				</NForm>
			</div>
		)
	},
})
