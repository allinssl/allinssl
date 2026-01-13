/**
 * 全局转移锁组件
 * 负责全局转移锁开关管理
 */
import { defineComponent, computed } from 'vue'
import { NAlert, NCard, NTag, NSwitch, NSpace, NH3, NP, NList, NListItem, NIcon } from 'naive-ui'
import { LockClosedOutline, InformationCircleOutline, WarningOutline } from '@vicons/ionicons5'
import { useDomainSecurityState } from '../../useStore'
import { useController } from '../../useController'

export default defineComponent({
	name: 'GlobalTransferLock',
	setup() {
		const { securityStatus, loading } = useDomainSecurityState()
		const { handleGlobalTransferLockToggle } = useController()

		// 计算属性：全局转移锁状态
		const globalTransferLock = computed(() => {
			// 将数字类型 (0|1) 转换为布尔值
			return securityStatus.value?.global_transfer_lock
		})
		// 计算属性：全局密保问题状态
		const hasSecurityQuestions = computed(() => {
			// 将数字类型 (0|1) 转换为布尔值
			return securityStatus.value?.has_security_questions
		})

		// 处理开关切换
		const handleToggle = async (value: boolean) => {
			await handleGlobalTransferLockToggle(value)
		}

		return () => (
			<div class="global-transfer-lock-container">
				{/* 顶部区域 */}
				<div class="flex justify-between items-start mb-6">
					<div>
						<NH3 class="mb-2">全局转移锁开关</NH3>
						<NP class="text-gray-600 mb-0">提供账户级别的域名转移保护</NP>
					</div>
					<NSpace align="center">
						<NTag type={globalTransferLock.value ? 'error' : 'default'}>
							{globalTransferLock.value ? '已锁定' : '未锁定'}
						</NTag>
						<NSwitch
							value={globalTransferLock.value}
							onUpdateValue={handleToggle}
							loading={loading.value}
							size="large"
						/>
					</NSpace>
				</div>

				{/* 中部提示区域 */}
				{!hasSecurityQuestions.value ? (
					<NAlert
						title="需要先设置密保问题"
						type="success"
						class="mb-6"
						v-slots={{
							icon: () => <NIcon component={WarningOutline} />,
						}}
					>
						请先设置密保问题后再配置全局转移锁功能。
					</NAlert>
				) : !globalTransferLock.value ? (
					<NAlert
						title="全局转移锁已关闭"
						type="success"
						class="mb-6"
						v-slots={{
							icon: () => <NIcon component={InformationCircleOutline} />,
						}}
					>
						域名可以正常进行转移操作，如需加强保护可开启转移锁。
					</NAlert>
				) : (
					<NAlert
						title="全局转移锁已开启"
						type="error"
						class="mb-6"
						v-slots={{
							icon: () => <NIcon component={LockClosedOutline} />,
						}}
					>
						所有域名转移操作已被锁定，需要验证密保答案才能关闭。
					</NAlert>
				)}

				{/* 底部功能说明 */}
				<NCard title="功能说明" class="mb-4">
					<NList>
						<NListItem>
							<div class="flex items-start">
								<div>
									<div class="font-semibold mb-1">完全锁定转移</div>
									<div class="text-gray-600">开启后，所有域名的转移操作将被完全锁定</div>
								</div>
							</div>
						</NListItem>
						<NListItem>
							<div class="flex items-start">
								<div>
									<div class="font-semibold mb-1">密保验证解锁</div>
									<div class="text-gray-600">需要验证密保答案才能关闭转移锁</div>
								</div>
							</div>
						</NListItem>
						<NListItem>
							<div class="flex items-start">
								<div>
									<div class="font-semibold mb-1">适用场景说明</div>
									<div class="text-gray-600">适用于长期不需要转移域名的用户，提供保护</div>
								</div>
							</div>
						</NListItem>
					</NList>
				</NCard>
			</div>
		)
	},
})
