import { defineComponent, ref, type PropType, reactive, computed, watch } from 'vue'
import {
	NForm,
	NFormItem,
	NInput,
	NSelect,
	NButton,
	NInputNumber,
	NSpace,
	NCascader,
	useMessage,
	type FormInst,
	type FormRules,
	type SelectOption,
	NFlex,
	NIcon,
} from 'naive-ui'
import { DnsRecordForm } from '../../types'
import { useModalHooks } from '@baota/naive-ui/hooks'
import { useDnsAnalysisStore } from './useStore'
import { useApp } from '@/components/layout/useStore'


  // 获取Store
  const {
    createRecord,
    updateRecord,
  } = useDnsAnalysisStore();
/**
 * 域名解析表单组件
 */
export default defineComponent({
	name: 'DnsAnalysisForm',
	props: {
		/** 是否显示表单 */
		visible: {
			type: Boolean,
			default: false,
		},
		/** 表单模式：add-新增, edit-编辑 */
		mode: {
			type: String as PropType<'add' | 'edit'>,
			default: 'add',
		},
		/** 初始表单数据 */
		initialData: {
			type: Object as () => Partial<DnsRecordForm & { domain_id: number }>,
			default: () => ({}),
		},
		recordTypesOptions: {
			type: Array as PropType<SelectOption[]>,
			default: () => [],
		},
		viewsOptions: {
			type: Array as PropType<SelectOption[]>,
			default: () => [],
		},
		/** 刷新数据函数 */
		refresh: {
			type: Function as PropType<() => Promise<void>>,
			default: () => Promise.resolve(),
		},
	},
	setup(props) {
		// const { handleFormSubmit } = useController(props)
		// 表单引用和消息实例
		const message = useMessage()
		const { close } = useModalHooks()
		const { isMobile } = useApp()
		const formRef = ref<FormInst | null>(null)
		const handleCloseModal = close() // 构建关闭方式

		// 表单数据
		const formData = reactive<DnsRecordForm & { domain_id: number }>({
			// 基础信息
			domain_id: 0,
			record_id: '',
			record: '',
			type: '',
			value: '',
			mx: 0,
			ttl: 0,
			remark: '',
			viewId: 0,
			...props.initialData,
		})

		// 当前选中的字段，用于切换下方帮助信息
		const activeField = ref<string>('record')

		// 表单验证规则
		const rules: FormRules = {
			record: { required: true, message: '请输入主机记录' },
			value: { required: true, message: '请输入记录值' },
			mx: { required: true, message: '请输入MX值' },
			ttl: { required: true, message: '请输入TTL值' },
			remark: { required: true, message: '请输入备注' },
		}

		/**
		 * 提交表单
		 */
		const handleSubmit = async () => {
			try {
				await formRef.value?.validate()
				const submitData = { ...formData }

				if (props.mode === 'add') {
					await createRecord(submitData)
					handleCloseModal()
					props.refresh()
				} else {
					await updateRecord({
						record_id: submitData.record_id as string,
						...submitData,
					})
					handleCloseModal()
					props.refresh()
				}
			} catch (error) {
				console.error('表单验证失败:', error)
				message.error('请检查表单填写是否正确')
			}
		}

		// -------- 快填面板（移动端）逻辑 --------
		// const isMobileDevice = computed(() => typeof window !== 'undefined' && window.innerWidth <= 740)
		// // 由可用帮助项决定步骤（不包含备注）
		// const baseStepFields: Array<keyof DnsRecordForm> = ['record', 'type', 'value', 'ttl']
		// const steps = computed(() => {
		// 	// 仅保留在帮助集中定义的字段
		// 	const allowed = baseStepFields.filter((f) => !!getFieldHelpInfo(String(f), formData.type || 'A'))
		// 	// MX 类型时插入 mx
		// 	if ((formData.type || 'A') === 'MX') {
		// 		allowed.push('mx')
		// 	}
		// 	return allowed
		// })
		// const currentStepIndex = ref<number>(0)
		// const currentStepField = computed(() => steps.value[currentStepIndex.value])
		// // 面板显隐
		// const showQuickFill = ref(true)
		// // 当前步骤选中的建议索引
		// const selectedSuggestionIndex = ref<number | null>(null)
		// // 记录值步骤的提示文本
		// const valueStepHint = ref<string>('')

		// // 进入"记录值"步骤时自动生成提示
		// watch(currentStepField, (field) => {
		// 	if (field === 'value') {
		// 		valueStepHint.value = getValueStepHint(formData.type || 'A')
		// 	} else {
		// 		valueStepHint.value = ''
		// 	}
		// })

		// const goPrev = () => {
		// 	currentStepIndex.value = Math.max(0, currentStepIndex.value - 1)
		// 	activeField.value = (currentStepField.value as string) || 'record'
		// 	selectedSuggestionIndex.value = null
		// 	valueStepHint.value = ''
		// }
		// const goNext = () => {
		// 	currentStepIndex.value = Math.min(steps.value.length - 1, currentStepIndex.value + 1)
		// 	activeField.value = (currentStepField.value as string) || 'record'
		// 	selectedSuggestionIndex.value = null
		// 	valueStepHint.value = ''
		// }

		// const ensureValueThenNext = () => {
		// 	const field = currentStepField.value
		// 	if (!field) return
		// 	const val = (formData as any)[field]
		// 	if (field === 'mx' || field === 'ttl') {
		// 		if (val === null || val === undefined) return
		// 	} else if (!val) {
		// 		return
		// 	}
		// 	goNext()
		// }

		// // 生成"记录值"步骤的类型提示
		// const getValueStepHint = (type: string): string => {
		// 	switch (String(type || 'A').toUpperCase()) {
		// 		case 'MX':
		// 			return '您选择的是 MX 记录，请在此填写邮件服务器的域名或 IP 地址，一般由邮件注册商提供，域名结尾"."表示根域，系统默认自动添加'
		// 		case 'A':
		// 			return '当前为 A 记录，请填写域名指向一个 IPv4 地址，例如 8.8.8.8'
		// 		case 'AAAA':
		// 			return '当前为 AAAA 记录，请填写域名指向一个 IPv6 地址，如 ff06:0:0:0:0:0:0:c3'
		// 		case 'CNAME':
		// 			return '当前为 CNAME 记录，请域名指向的另一个域名地址，不可填写 IP 地址'
		// 		case 'TXT':
		// 			return '当前为 TXT 记录，请填写文本内容，常用于验证/配置'
		// 		case 'NS':
		// 			return '当前为 NS 记录，请填写权威 DNS 服务器域名'
		// 		default:
		// 			return '请根据记录类型填写对应格式的记录值'
		// 	}
		// }

		// // 建议项生成
		// type Suggestion = { label: string; value: any; desc?: string }
		// const getTypeSuggestions = (): Suggestion[] => {
		// 	const opts = (props.recordTypesOptions || []) as any[]
		// 	return opts.map((o) => ({ label: String(o.label ?? o.value), value: o.value, desc: o.desc }))
		// }
		// const getValueSuggestions = (): Suggestion[] => {
		// 	const help = getFieldHelpInfo('value', formData.type || 'A')
		// 	return (help.examples || []).map((e: any) => ({ label: e.value, value: e.value, desc: e.desc }))
		// }
		// const getRecordSuggestions = (): Suggestion[] => {
		// 	const help = getFieldHelpInfo('record', formData.type || 'A')
		// 	return (help.examples || []).map((e: any) => ({ label: e.value, value: e.value, desc: e.desc }))
		// }
		// const getTtlSuggestions = (): Suggestion[] => [300, 600, 1200].map((v) => ({ label: String(v), value: v }))
		// const getMxSuggestions = (): Suggestion[] => [5, 10, 20].map((v) => ({ label: String(v), value: v }))
		// const getRemarkSuggestions = (): Suggestion[] => []

		// const suggestions = computed<Suggestion[]>(() => {
		// 	switch (currentStepField.value) {
		// 		case 'record':
		// 			return getRecordSuggestions()
		// 		case 'type':
		// 			return getTypeSuggestions()
		// 		case 'value':
		// 			return getValueSuggestions()
		// 		case 'ttl':
		// 			return getTtlSuggestions()
		// 		case 'mx':
		// 			return getMxSuggestions()
		// 		case 'remark':
		// 			return getRemarkSuggestions()
		// 		default:
		// 			return []
		// 	}
		// })

		// const applySuggestion = (s: Suggestion, idx?: number) => {
		// 	const field = currentStepField.value
		// 	if (!field) return
		// 	// 切换选中态（瞬时视觉反馈）
		// 	if (typeof idx === 'number') {
		// 		selectedSuggestionIndex.value = idx
		// 	}
		// 	// 在"记录值"步骤，不直接填充，仅展示类型提示
		// 	if (field === 'value') {
		// 		valueStepHint.value = getValueStepHint(formData.type || 'A')
		// 		return
		// 	}
		// 	;(formData as any)[field] = s.value
		// 	// 立即进入下一步
		// 	goNext()
		// }

		// const stepTitleMap: Record<string, string> = {
		// 	record: '主机记录',
		// 	type: '记录类型',
		// 	value: '记录值',
		// 	viewId: '线路类型',
		// 	ttl: 'TTL',
		// 	mx: 'MX/权重',
		// 	remark: '备注',
		// }

		return () => (
			<div class="flex flex-col gap-3">
				{/* 上层：表单 */}
				<NForm
					ref={formRef}
					model={formData}
					rules={rules}
					labelPlacement={isMobile.value ? 'top' : 'left'}
					labelWidth="120px"
					requireMarkPlacement="right-hanging"
				>
					{/* 两列布局表单 */}
					<NFormItem label="主机记录">
						<NInput
							value={formData.record}
							onFocus={() => (activeField.value = 'record')}
							onUpdateValue={(v: string) => (formData.record = v)}
							placeholder="@ / www / *"
						/>
					</NFormItem>
					<NFormItem label="记录类型">
						<NSelect
							value={formData.type}
							options={props.recordTypesOptions as any}
							onFocus={() => (activeField.value = 'type')}
							onUpdateValue={(v: any) => (formData.type = v)}
						/>
					</NFormItem>
					<NFormItem label="线路类型">
						<NCascader
							value={formData.viewId}
							options={props.viewsOptions as any}
							onFocus={() => (activeField.value = 'viewId')}
							onUpdateValue={(v: any) => (formData.viewId = v)}
						/>
					</NFormItem>
					<NFormItem label="记录值">
						<NInput
							value={formData.value}
							onFocus={() => (activeField.value = 'value')}
							onUpdateValue={(v: string) => (formData.value = v)}
							placeholder="目标IP或域名"
						/>
					</NFormItem>
					<NSpace>
						<NFormItem label="TTL">
							<NInputNumber
								value={formData.ttl}
								min={1}
								onFocus={() => (activeField.value = 'ttl')}
								onUpdateValue={(v: any) => (formData.ttl = Number(v) || 1)}
							/>
						</NFormItem>
						<NFormItem label="MX(可选)">
							<NInputNumber
								value={formData.mx}
								min={0}
								max={100}
								onFocus={() => (activeField.value = 'mx')}
								onUpdateValue={(v: any) => (formData.mx = Number(v) || 0)}
							/>
						</NFormItem>
					</NSpace>
					<NFormItem label="备注(可选)">
						<NInput value={formData.remark} onUpdateValue={(v: string) => (formData.remark = v)} />
					</NFormItem>

					{/* 表单操作按钮 */}
					<NFormItem>
						<NFlex class="mt-4 w-full" justify="end">
							<NButton onClick={handleCloseModal}>取消</NButton>
							<NButton type="primary" onClick={handleSubmit}>
								保存
							</NButton>
						</NFlex>
					</NFormItem>
				</NForm>

				{/* 移动端快填面板 */}
				{/*isMobileDevice.value && showQuickFill.value && (
					<div class="fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
						<div class="flex items-center justify-between mb-2">
							<div class="text-[12px] text-gray-500">
								步骤 {currentStepIndex.value + 1}/{steps.value.length} （快填）
							</div>
							<div class="flex items-center gap-2">
								<NButton size="small" tertiary onClick={goPrev} disabled={currentStepIndex.value === 0}>
									上一项
								</NButton>
								<NButton
									size="small"
									tertiary
									onClick={goNext}
									disabled={currentStepIndex.value >= steps.value.length - 1}
								>
									下一项
								</NButton>
								<NButton size="small" quaternary onClick={() => (showQuickFill.value = false)} aria-label="关闭快填">
									<NIcon size={16}>
										<CloseOutline />
									</NIcon>
								</NButton>
							</div>
						</div>
						<div class="text-[13px] font-medium text-slate-800 mb-2">
							{stepTitleMap[currentStepField.value as string] || '当前字段'}
						</div>
						<div class="text-[12px] text-gray-600 mb-2 line-clamp-2">
							{(getFieldHelpInfo(String(currentStepField.value || ''), formData.type || 'A') as any)?.desc ||
								(getFieldHelpInfo(String(currentStepField.value || ''), formData.type || 'A') as any)?.description}
						</div>
						{currentStepField.value === 'value' && valueStepHint.value ? (
							<div class="text-[12px] text-gray-600 mt-2">
								<span class="px-3 py-2 bg-red-50 border-l-4 border-red-500 rounded text-[11px] text-slate-800 block">
									<span class="font-medium">提示：</span>
									{valueStepHint.value}
								</span>
							</div>
						) : (
							suggestions.value.length > 0 && (
								<div class="max-h-[160px] overflow-y-auto flex flex-col gap-1 mb-2 pr-1">
									{suggestions.value.map((s, i) => (
										<div key={i}>
											<NButton
												size="small"
												quaternary
												onClick={() => applySuggestion(s, i)}
												class={
													(selectedSuggestionIndex.value === i ? 'bg-blue-50 border border-blue-200 ' : '') +
													'!text-[12px] !px-2 !py-1 bg-gray-50 hover:bg-gray-100 w-full justify-start'
												}
											>
												<span>{s.label}</span>
												{s.desc && <span class="ml-1 text-[11px] text-gray-500">- {s.desc}</span>}
											</NButton>
										</div>
									))}
								</div>
							)
						)}
						<NFlex justify="end" class="mt-2">
							<NButton size="small" onClick={ensureValueThenNext} type="primary">
								{currentStepIndex.value >= steps.value.length - 1 ? '保存' : '填入并下一步'}
							</NButton>
						</NFlex>
					</div>
				)*/}
			</div>
		)
	},
})
