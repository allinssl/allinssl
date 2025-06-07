import { ref, watch, onMounted } from 'vue'
import type { CAProviderSelectProps, CAProviderOption, CAProviderSelectEmits } from './types'

// 绝对内部导入 - API
import { getAllEabList } from '@api/access'
// 绝对内部导入 - Hooks
import { useError } from '@baota/hooks/error'
// 绝对内部导入 - Utilities
import { $t } from '@locales/index'

/**
 * @function useCAProviderSelectController
 * @description CAProviderSelect 组件的控制器逻辑
 * @param props - 组件的 props
 * @param emit - 组件的 emit 函数
 * @returns {CAProviderControllerExposes} 控制器暴露给视图的数据和方法
 */
export function useCAProviderSelectController(props: CAProviderSelectProps, emit: CAProviderSelectEmits) {
	const { handleError } = useError()

	const param = ref<CAProviderOption>({
		label: '',
		value: '',
		ca: '',
		email: '',
	})
	const caProviderRef = ref<CAProviderOption[]>([])
	const isLoading = ref(false)
	const errorMessage = ref('')

	/**
	 * @function goToAddCAProvider
	 * @description 跳转到CA授权管理页面
	 */
	const goToAddCAProvider = (type: string) => {
		window.open(`/auto-deploy?type=${type}`, '_blank')
	}

	/**
	 * @function handleUpdateType
	 * @description 根据当前 param.value 更新 param 对象的 label 和 ca，并 emit 更新事件
	 */
	const handleUpdateType = () => {
		const selectedProvider = caProviderRef.value.find((item) => item.value === param.value.value)

		if (selectedProvider) {
			// 对于 Let's Encrypt 和 Buypass，使用传入的工作流邮件
			let email = selectedProvider.email
			if (selectedProvider.ca === 'letsencrypt' || selectedProvider.ca === 'buypass') {
				email = props.email || selectedProvider.email
			}

			param.value = {
				label: selectedProvider.label,
				value: selectedProvider.value,
				ca: selectedProvider.ca,
				email: email,
			}
		} else if (caProviderRef.value.length > 0 && param.value.value === '') {
			// 如果 param.value 为空（例如初始状态或清空后），且 caProviderRef 列表不为空，则默认选中第一个
			const firstProvider = caProviderRef.value[0]
			let email = firstProvider?.email || ''
			if (firstProvider && (firstProvider.ca === 'letsencrypt' || firstProvider.ca === 'buypass')) {
				email = props.email || firstProvider.email
			}

			param.value = {
				label: firstProvider?.label || '',
				value: firstProvider?.value || '',
				ca: firstProvider?.ca || '',
				email: email,
			}
		}

		// 始终触发邮件更新事件，确保邮件字段能正确渲染
		emit('update:email', param.value.email)

		emit('update:value', { value: param.value.value, ca: param.value.ca, email: param.value.email })
	}

	/**
	 * @function handleUpdateValue
	 * @description 更新 param.value 并触发类型更新
	 * @param value - 新的选中值
	 */
	const handleUpdateValue = (value: string) => {
		param.value.value = value
		handleUpdateType()
	}

	/**
	 * @function loadCAProviders
	 * @description 加载CA授权选项
	 */
	const loadCAProviders = async () => {
		isLoading.value = true
		errorMessage.value = ''
		try {
			// 添加Let's Encrypt作为首选项，使用传入的工作流邮件
			const letsEncryptOption: CAProviderOption = {
				label: "Let's Encrypt",
				value: '',
				ca: 'letsencrypt',
				email: props.email || '',
			}

			// 添加Buypass作为第二选项，使用传入的工作流邮件
			const buypassOption: CAProviderOption = {
				label: 'Buypass',
				value: 'buypass',
				ca: 'buypass',
				email: props.email || '',
			}

			// 获取其他CA授权列表，使用接口返回的邮件
			const { data } = await getAllEabList({ ca: '' }).fetch()
			const eabOptions: CAProviderOption[] = (data || []).map((item) => ({
				label: item.name,
				value: item.id.toString(),
				ca: item.ca,
				email: item.mail,
			}))

			// 合并选项，Let's Encrypt在首位，Buypass在第二位
			caProviderRef.value = [letsEncryptOption, buypassOption, ...eabOptions]

			// 数据加载后，如果 props.value 有值，尝试根据 props.value 初始化 param
			if (props.value) {
				handleUpdateValue(props.value)
			} else {
				handleUpdateType() // 确保在 caProviderRef 更新后，param 也得到相应更新
			}
		} catch (error) {
			errorMessage.value = typeof error === 'string' ? error : $t('t_3_1747990229599')
			handleError(error)
		} finally {
			isLoading.value = false
		}
	}

	/**
	 * @function handleFilter
	 * @description NSelect 组件的搜索过滤函数
	 * @param pattern - 搜索文本
	 * @param option - 当前选项
	 * @returns {boolean} 是否匹配
	 */
	const handleFilter = (pattern: string, option: CAProviderOption): boolean => {
		return option.label.toLowerCase().includes(pattern.toLowerCase())
	}

	watch(
		() => props.value,
		(newValue) => {
			// 仅当外部 props.value 与内部 param.value.value 不一致时才更新
			if (newValue !== param.value.value) {
				handleUpdateValue(newValue)
			}
		},
		{ immediate: true },
	)

	onMounted(() => {
		loadCAProviders()
	})

	return {
		param,
		caProviderRef,
		isLoading,
		errorMessage,
		goToAddCAProvider,
		handleUpdateValue,
		loadCAProviders,
		handleFilter,
	}
}
