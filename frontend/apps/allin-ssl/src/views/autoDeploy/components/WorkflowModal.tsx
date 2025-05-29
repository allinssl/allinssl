import { NCard, NSpace, NFormItem, NRadio } from 'naive-ui'
import { useStore } from '@autoDeploy/useStore'
import { useAddWorkflowController } from '@autoDeploy/useController'
import { $t } from '@locales/index'

/**
 * 添加工作流模态框组件
 */
export default defineComponent({
	name: 'AddWorkflowModal',
	setup() {
		const { workflowTemplateOptions, workflowFormData } = useStore()
		const { AddWorkflowForm } = useAddWorkflowController()
		return () => (
			<NCard bordered={false} class="shadow-none" content-class="!p-[10px]">
				<AddWorkflowForm
					labelPlacement="top"
					labelWidth={100}
					v-slots={{
						template: () => {
							return (
								<NFormItem label={$t('t_0_1745474945127')} required>
									<NSpace vertical class="flex !flex-row ">
										{workflowTemplateOptions.value.map((item) => (
											<div
												key={item.value}
												class={`cursor-pointer transition-all duration-300 `}
												onClick={() => {
													workflowFormData.value.templateType = item.value
												}}
											>
												<NCard
													class={`rounded-lg border-1 ${workflowFormData.value.templateType === item.value ? 'border-primary-500' : ''}`}
													hoverable
												>
													<NSpace align="center" justify="space-between">
														<div>
															<div class="font-medium text-[14px]">{item.label}</div>
															<div class="text-gray-500 text-[12px] mt-1">{item.description}</div>
														</div>
														<NRadio checked={workflowFormData.value.templateType === item.value} />
													</NSpace>
												</NCard>
											</div>
										))}
									</NSpace>
								</NFormItem>
							)
						},
					}}
				/>
			</NCard>
		)
	},
})
