import { FormRules } from 'naive-ui'
import { useModal, useForm, useFormHooks, useLoadingMask, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { isDomain, isDomainGroup, isWildcardDomain } from '@baota/utils/business'
import { useStore as useWorkflowViewStore } from '@autoDeploy/children/workflowView/useStore'
import { $t } from '@locales/index'
import { useStore } from './useStore'
import CertificateForm from './components/FreeProductModal'
import DnsProviderSelect from '@components/DnsProviderSelect'

// 错误处理
const { handleError } = useError()

/**
 * useController
 * @description 组合式API使用store
 * @returns {object} store - 返回store对象
 */
export const useController = () => {
	const {
		test,
		handleTest,
		activeMainTab,
		activeTab,
		mainTabOptions,
		typeOptions,
		sslTypeList,
		sslTypeDescriptions,
		freeProducts,
		filteredProducts,
	} = useStore()

	// const dialog = useDialog()

	// -------------------- 业务逻辑 --------------------
	// 处理商业产品购买按钮点击
	const handleBuyProduct = () => {
		// 跳转到堡塔官网SSL证书购买页面
		window.open('https://www.bt.cn/new/ssl.html', '_blank')
	}

	// 格式化价格显示
	const formatPrice = (price: number) => {
		return Math.floor(price)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	}

	/**
	 * @description 打开申请弹窗
	 */
	const handleOpenApplyModal = () => {
		useModal({
			title: $t(`申请免费证书 - Let's Encrypt`),
			area: '500px',
			component: CertificateForm,
			footer: true,
		})
	}

	return {
		test,
		handleTest,
		activeMainTab,
		activeTab,
		mainTabOptions,
		typeOptions,
		sslTypeList,
		sslTypeDescriptions,
		freeProducts,
		filteredProducts,
		handleBuyProduct,
		handleOpenApplyModal,
		formatPrice,
	}
}

/**
 * @description 证书申请表单控制器
 * @returns {object} 返回controller对象
 */
export const useCertificateFormController = () => {
	// 表单hooks
	const { useFormInput } = useFormHooks()
	const { addNewWorkflow } = useWorkflowViewStore()

	// 加载遮罩
	const { open: openLoad, close: closeLoad } = useLoadingMask({ text: $t('t_6_1746667592831') })

	// 消息和对话框
	const { confirm } = useModalHooks()

	// 表单数据
	const formData = ref({
		domains: '',
		provider_id: '',
		provider: '',
	})

	// 表单配置
	const config = computed(() => [
		useFormInput($t('t_17_1745227838561'), 'domains'),
		{
			type: 'custom' as const,
			render: () => {
				return (
					<DnsProviderSelect
						type="dns"
						path="provider_id"
						value={formData.value.provider_id}
						onUpdate:value={(val: { value: string; type: string }) => {
							formData.value.provider_id = val.value
							formData.value.provider = val.type
						}}
					/>
				)
			},
		},
	])

	/**
	 * @description 表单验证规则
	 */
	const rules = {
		domains: {
			required: true,
			message: $t('t_7_1746667592468'),
			trigger: 'input',
			validator: (rule: any, value: any, callback: any) => {
				if (isDomain(value) || isWildcardDomain(value) || isDomainGroup(value, ',')) {
					callback()
				} else {
					callback(new Error($t('t_7_1746667592468')))
				}
			},
		},
		provider_id: {
			required: true,
			message: $t('t_8_1746667591924'),
			trigger: 'change',
			type: 'string',
		},
	} as FormRules

	/**
	 * @description 提交表单
	 */
	const request = async () => {
		try {
			await addNewWorkflow({
				name: `申请免费证书-Let's Encrypt（${formData.value.domains}）`,
				exec_type: 'manual',
				active: '1',
				content: JSON.stringify({
					id: 'start-1',
					name: '开始',
					type: 'start',
					config: { exec_type: 'manual' },
					childNode: {
						id: 'apply-1',
						name: '申请证书',
						type: 'apply',
						config: {
							...formData.value,
							email: 'test@test.com',
							end_day: 30,
						},
					},
				}),
			})
		} catch (error) {
			handleError(error)
		}
	}

	// 使用表单hooks
	const { component: CertificateForm, fetch } = useForm({
		config,
		defaultValue: formData,
		request,
		rules,
	})

	// 关联确认按钮
	confirm(async (close) => {
		try {
			openLoad()
			await fetch()
			close()
		} catch (error) {
			return handleError(error)
		} finally {
			closeLoad()
		}
	})

	return {
		CertificateForm,
	}
}
