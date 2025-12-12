/**
 * 基础安全组件
 * 负责密保问题管理功能
 */
import { defineComponent, computed, ref } from 'vue'
import { NAlert, NCard, NTag, NButton, NSpace } from 'naive-ui'
import { useModal } from '@baota/naive-ui/hooks'
import { useDomainSecurityState } from '../../useStore'
import SecurityQuestionDialog from '../SecurityQuestionDialog'

export default defineComponent({
	name: 'BasicSecurity',
	setup() {
		const { securityStatus, loading, fetchSecurityStatus } = useDomainSecurityState()

		// 计算属性：是否已设置密保问题
		const hasSecurityQuestions = computed(() => {
			return securityStatus.value?.has_security_questions
		})

		// 计算属性：当前密保问题
		const currentQuestions = computed(() => {
			return securityStatus.value?.questions || '您还未设置密保问题'
		})

		// 对话框引用
		const securityDialogRef = ref()

		// 打开密保问题设置对话框
		const openSecurityQuestionDialog = () => {
			securityDialogRef.value = useModal({
				title: '密保问题设置',
				area: '600px',
				component: SecurityQuestionDialog,
				componentProps: {
					refresh: fetchSecurityStatus,
					close: () => securityDialogRef.value?.close?.(),
				},
				footer: false,
			})
		}

		// 关闭对话框
		const closeSecurityQuestionDialog = () => {
			securityDialogRef.value?.close?.()
		}

		return () => (
			<div class="basic-security-container">
				{/* 状态提示区域 */}
				{!hasSecurityQuestions.value && (
					<NAlert title="密保问题未设置" type="warning" class="mb-4">
						您还未设置密保问题，为了您的账户安全，建议您尽快设置密保问题。密保问题将用于验证您的身份，保护您的域名安全。
					</NAlert>
				)}

				{/* 密保问题管理卡片 */}
				<NCard
					title="密保问题管理"
					class="mb-4"
					v-slots={{
						'header-extra': () => (
							<NSpace align="center">
								<NTag type={hasSecurityQuestions.value ? 'success' : 'warning'}>
									{hasSecurityQuestions.value ? '已设置' : '未设置'}
								</NTag>
								<NButton
									type="primary"
									size="small"
									onClick={openSecurityQuestionDialog}
									loading={loading.value}
								>
									{hasSecurityQuestions.value ? '重置密保问题' : '设置密保问题'}
								</NButton>
							</NSpace>
						),
					}}
				>
					{!hasSecurityQuestions.value ? (
						<div>
							<div class="font-bold mb-2">当前密保问题</div>
							<div class="text-gray-500">您还未设置密保问题，请点击右上角按钮进行设置</div>
						</div>
					) : (
						<div>
							<div class="font-bold mb-2">当前密保问题</div>
							{currentQuestions.value}
						</div>
					)}
				</NCard>


			</div>
		)
	},
})