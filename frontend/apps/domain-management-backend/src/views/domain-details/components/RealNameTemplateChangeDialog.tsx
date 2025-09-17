/**
 * 实名模板更换弹窗组件
 * 负责展示当前模板信息和提供新模板选择功能
 */

import { defineComponent, ref, computed, type PropType } from 'vue';
import { NAlert, NCard, NSelect, NButton, NFlex, NGrid, NGridItem, NSpin, NTag, NIcon } from 'naive-ui'
import { useDomainDetailState } from '../useStore';
import { useMessage } from '@baota/naive-ui/hooks';
import type { DomainInfo, RealNameInfo } from '@/types/domain';
import type { ContactTemplateItem } from '@/types/real-name';
import { updateDomainRealName } from '@/api/domain'
import { maskUtils } from '@/views/real-name/useStore'
import { useModal } from '@baota/naive-ui/hooks'
import DomainRegistrationForm from '@/views/real-name/components/DomainRegistrationForm/index'
import { RefreshFilled } from '@vicons/material'

export default defineComponent({
  name: 'RealNameTemplateChangeDialog',
  props: {
    domainId: { 
      type: Number, 
      required: true 
    },
    domainInfo: { 
      type: Object as PropType<DomainInfo | null>, 
      default: null 
    },
    currentTemplate: { 
      type: Object as PropType<RealNameInfo | null>, 
      default: null 
    },
    refresh: { 
      type: Function as PropType<() => Promise<void>>, 
      required: true 
    },
  },
  
  setup(props) {
		const { realNameTemplates, realNameTemplatesLoading, openTemplateChangeDialog, fetchRealNameTemplateList } =
			useDomainDetailState()

		const message = useMessage()
		const selectedTemplateId = ref<string>('')
		const submitting = ref(false)

		// 模板选项（排除当前模板）
		const templateOptions = computed(() => {
			return realNameTemplates.value
				.filter((template) => template.registrant_id !== props.currentTemplate?.registrant_id)
				.map((template) => ({
					label: `${template.template_name || template.owner_name}（${template.type === 1 ? '个人实名认证' : '企业实名认证'}）`,
					value: template.registrant_id,
				}))
		})

		// 获取选中的模板详情
		const selectedTemplateDetail = computed(() => {
			if (!selectedTemplateId.value) return null
			return realNameTemplates.value.find((template) => template.registrant_id === selectedTemplateId.value)
		})

		// 选中实名模板
		const handleSelectRealName = (val: string) => {
			if (val === '-1') openCreateRealNameModal()
			else selectedTemplateId.value = val
		}
		/** 创建实名模板窗口（步骤一入口中的快捷按钮） */
		const openCreateRealNameModal = () => {
			const modal = useModal({
				title: '创建实名模板',
				area: '1000px',
				component: DomainRegistrationForm,
				componentProps: {
					mode: 'add',
					refresh: async () => {
						await fetchRealNameTemplateList()
					},
				},
				footer: false,
			})
			return modal
		}

		// 提交更换
		const handleSubmit = async () => {
			if (!selectedTemplateId.value) {
				message.warning('请选择新的实名模板')
				return
			}

			try {
				submitting.value = true
				const { fetch, message, data } = updateDomainRealName({
					domain_id: props.domainId,
					new_registrant_id: selectedTemplateId.value,
				})
				message.value = true
				await fetch()
				if (data.value.status) {
					await props.refresh()
					openTemplateChangeDialog.value?.close()
				}
			} catch (error) {
				// 错误已在 store 中处理
			} finally {
				submitting.value = false
			}
		}

		// 取消操作
		const handleCancel = () => {
			openTemplateChangeDialog.value?.close()
		}

		// 渲染模板详细信息的通用函数
		const renderTemplateDetail = (template: RealNameInfo | ContactTemplateItem | null, title: string) => {
			if (!template) return null

			// 统一数据格式处理
			const templateData = {
				id: (template as ContactTemplateItem).id || (template as RealNameInfo).registrant_id || '-',
				name:
					(template as ContactTemplateItem).template_name ||
					(template as ContactTemplateItem).owner_name ||
					(template as RealNameInfo).owner_name ||
					'-',
				type: template.type === 1 ? '个人实名认证' : '企业实名认证',
				idNumber: (template as ContactTemplateItem).id_number || (template as RealNameInfo).id_number || '-',
				owner: (template as ContactTemplateItem).owner_name || (template as RealNameInfo).owner_name || '-',
				email: template.email || '-',
				phone: (template as ContactTemplateItem).phone || (template as RealNameInfo).contact_person || '-',
				status:
					(template as ContactTemplateItem).status === 2
						? '已审核'
						: (template as RealNameInfo).status === 2
							? '已通过'
							: '审核中',
			}

			return (
				<NCard class="mb-4" size="small">
					<div class="font-bold mb-2">{title}</div>
					<NGrid cols="2" xGap="16" yGap="12">
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">模板ID:</span>
								<span class="ml-2">{templateData.id}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">模板名称:</span>
								<span class="ml-2">{templateData.name}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">认证类型:</span>
								<span class="ml-2">{templateData.type}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">证件号码:</span>
								<span class="ml-2">{maskUtils.maskCertificateNumber(templateData.idNumber)}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">模板所有者:</span>
								<span class="ml-2">{templateData.owner}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">邮箱:</span>
								<span class="ml-2">{templateData.email}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">手机号码:</span>
								<span class="ml-2">{templateData.phone}</span>
							</div>
						</NGridItem>
						<NGridItem>
							<div class="flex items-center">
								<span class="text-gray-600 min-w-20">审核状态:</span>
								<NTag type="success" size="small" class="ml-2">
									{templateData.status}
								</NTag>
							</div>
						</NGridItem>
					</NGrid>
				</NCard>
			)
		}

		return () => (
			<>
				{/* 蓝色提示条 */}
				<NAlert type="info" class="mb-6" showIcon>
					模板更换处理时间约1-30分钟，请耐心等待
				</NAlert>

				{/* 标题说明 */}
				<div class="mb-4">
					<div class="font-bold">当前模板与选择新模板</div>
					<div class="text-sm text-gray-600">以下是当前使用的实名模板，请选择要更换的新模板。</div>
				</div>

				{/* 当前使用模板 */}
				{renderTemplateDetail(props.currentTemplate, '当前使用模板')}

				{/* 备选信息模板选择器 */}
				<div class="mb-4">
					<div class="mb-2 flex items-center justify-between">
						<div>
							切换实名信息模板<span class="text-gray-400">（切换时不会影响域名使用）</span>
						</div>
						<NButton ghost text size="tiny" onClick={() => fetchRealNameTemplateList()}>
							{{
								default: () => (
									<>
										<NIcon class="flex cursor-pointer ml-1" size={16}>
											<RefreshFilled />
										</NIcon>
										<span>刷新实名列表</span>
									</>
								),
							}}
						</NButton>
					</div>
					<NSpin show={realNameTemplatesLoading.value}>
						<NSelect
							value={selectedTemplateId.value}
							onUpdateValue={(val) => handleSelectRealName(val)}
							options={[...templateOptions.value, { label: '创建实名模板…', value: '-1' }]}
							placeholder="请选择需要替换的实名模板"
							disabled={templateOptions.value.length === 0}
							clearable
						/>
					</NSpin>
				</div>

				{/* 新选择的模板详细信息 */}
				{selectedTemplateDetail.value && renderTemplateDetail(selectedTemplateDetail.value, '新选择的模板详细信息')}

				{/* 操作按钮 */}
				<NFlex justify="end" size="medium" class="mt-6">
					<NButton size="large" onClick={handleCancel}>
						取消
					</NButton>
					<NButton
						type="primary"
						size="large"
						loading={submitting.value}
						disabled={!selectedTemplateId.value}
						onClick={handleSubmit}
					>
						提交更换请求
					</NButton>
				</NFlex>
			</>
		)
	},
}); 