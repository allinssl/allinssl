/**
 * 敏感操作限制组件
 * 负责敏感操作保护开关管理
 */
import { defineComponent, computed } from 'vue'
import { NAlert, NCard, NTag, NSwitch, NSpace, NH3, NP, NList, NListItem, NIcon } from 'naive-ui'
import { ShieldCheckmarkOutline, WarningOutline } from '@vicons/ionicons5'
import { useDomainSecurityState } from '../../useStore'
import { useController } from '../../useController'

export default defineComponent({
	name: 'OperationProtection',
	setup() {
		const { securityStatus, loading } = useDomainSecurityState()
		const { handleOperationProtectionToggle } = useController()

		// 计算属性：操作保护状态
		const operationProtection = computed(() => {
			return securityStatus.value?.operation_protection
		})

		// 处理开关切换
		const handleToggle = async (value: boolean) => {
			await handleOperationProtectionToggle(value)
		}

		return () => (
			<div class="operation-protection-container">
				{/* 顶部区域 */}
				<div class="flex justify-between items-start mb-6">
					<div>
						<NH3 class="mb-2">敏感操作限制开关</NH3>
						<NP class="text-gray-600 mb-0">开启后，域名相关的敏感操作将需要验证密保问题才能执行</NP>
					</div>
					<NSpace align="center">
						<NTag type={operationProtection.value ? 'success' : 'default'}>
							{operationProtection.value ? '已开启' : '已关闭'}
						</NTag>
						<NSwitch
							value={operationProtection.value}
							onUpdateValue={handleToggle}
							loading={loading.value}
							size="large"
						/>
					</NSpace>
				</div>

				{/* 中部提示区域 */}
				{!operationProtection.value ? (
					<NAlert
						title="安全提示"
						type="warning"
						class="mb-6"
						v-slots={{
							icon: () => <NIcon component={WarningOutline} />,
						}}
					>
						建议您开启敏感操作限制，这将为您的域名提供额外的安全保护。开启后，执行敏感操作时需要验证密保问题。
					</NAlert>
				) : (
					<NAlert
						title="安全建议"
						type="success"
						class="mb-6"
						v-slots={{
							icon: () => <NIcon component={ShieldCheckmarkOutline} />,
						}}
					>
						敏感操作限制已开启，您的域名安全得到了有效保护。请妥善保管您的密保问题答案。
					</NAlert>
				)}

				{/* 底部功能说明 */}
				<NCard title="功能说明" class="mb-4">
					<NList>
						<NListItem>
							<div class="flex items-start">
								<div>
									<div class="font-semibold mb-1">域名转移保护</div>
									<div class="text-gray-600">开启后，域名转移操作需要验证密保答案</div>
								</div>
							</div>
						</NListItem>
						<NListItem>
							<div class="flex items-start">
								<div>
									<div class="font-semibold mb-1">DNS修改保护</div>
									<div class="text-gray-600">开启后，DNS服务器修改需要验证密保答案</div>
								</div>
							</div>
						</NListItem>
						<NListItem>
							<div class="flex items-start">
								<div>
									<div class="font-semibold mb-1">敏感操作保护</div>
									<div class="text-gray-600">开启后，其他敏感域名操作需要验证密保答案</div>
								</div>
							</div>
						</NListItem>
					</NList>
				</NCard>
			</div>
		)
	},
})
