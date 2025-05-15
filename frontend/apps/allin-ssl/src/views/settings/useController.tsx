import { FormInst, FormItemRule, FormRules } from 'naive-ui'
import md5 from 'crypto-js/md5'
import { useFormHooks, useModal, useDialog, useForm, useMessage, useLoadingMask } from '@baota/naive-ui/hooks'
import { clearCookie, clearLocal, clearSession } from '@baota/utils/browser'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import { useStore } from './useStore'

import EmailChannelForm from './components/emailChannelForm'
import type { ReportMail, AddReportParams, SaveSettingParams, ReportType } from '@/types/setting'

const {
	// 标签页
	activeTab,
	tabOptions,
	// 常用设置
	generalSettings,
	channelTypes,
	aboutInfo,
	fetchGeneralSettings,
	saveGeneralSettings,
	// 通知设置
	fetchNotifyChannels,
	notifyChannels,
	// 邮箱通知渠道表单
	emailChannelForm,
	addReportChannel,
	updateReportChannel,
	testReportChannel,
	deleteReportChannel,
} = useStore()
const message = useMessage()
const { handleError } = useError()
const { useFormInput, useFormInputNumber, useFormSwitch, useFormTextarea, useFormSlot } = useFormHooks()

/**
 * 设置页面业务逻辑控制器
 * @function useController
 * @description 提供设置页面所需的全部业务逻辑和状态数据，负责协调不同设置组件的交互行为
 * @returns {Object} 返回设置页面相关的状态数据和处理方法
 */
export const useController = () => {
	const route = useRoute()
	const router = useRouter()

	/**
	 * @description 检测是否需要添加工作流
	 */
	const isCutTab = () => {
		const { tab } = route.query
		if (tab?.includes('notification')) {
			activeTab.value = 'notification'
			router.push({ query: {} })
		}
	}
	/**
	 * 一次性加载所有设置数据
	 * @async
	 * @function fetchAllSettings
	 * @description 页面初始化时调用，并行加载系统设置、通知设置和通知渠道数据
	 * @returns {Promise<void>} 无返回值
	 */
	const fetchAllSettings = async () => {
		try {
			await Promise.all([fetchGeneralSettings(), fetchNotifyChannels()])
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * @description md5 密码加密
	 * @param {string} password - 原始密码
	 * @returns {string} 加密后的密码
	 */
	const encryptPassword = (password: string): string => {
		return md5(`${password}_bt_all_in_ssl`).toString()
	}

	/**
	 * 保存常用设置
	 * @async
	 * @function handleSaveGeneralSettings
	 * @description 验证并保存常用设置表单数据
	 * @param {SaveSettingParams} params - 保存设置请求参数
	 * @param {Ref<FormInst | null>} formRef - 表单实例引用，用于验证表单数据
	 * @returns {Promise<void>} 无返回值
	 */
	const handleSaveGeneralSettings = async (params: SaveSettingParams) => {
		try {
			await saveGeneralSettings({
				...params,
				password: params.password !== '' ? encryptPassword(params.password) : '',
			})
			setTimeout(() => {
				clearCookie()
				clearSession()
				window.location.href = `${params.secure}`
			}, 2000)
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 打开添加邮箱通知渠道弹窗
	 * @function openAddEmailChannelModal
	 * @description 打开添加邮箱通知渠道的模态框，并在关闭后刷新通知渠道列表
	 * @returns {void} 无返回值
	 */
	const openAddEmailChannelModal = (limit: number = 1) => {
		if (limit >= 1) {
			message.warning($t('t_16_1746773356568'))
			return
		}
		useModal({
			title: $t('t_18_1745457490931'),
			area: 650,
			component: EmailChannelForm,
			footer: true,
		})
	}

	// 处理启用状态切换
	const handleEnableChange = async (item: ReportType<ReportMail>) => {
		useDialog({
			title: $t('t_17_1746773351220', [
				Number(item.config.enabled) ? $t('t_5_1745215914671') : $t('t_6_1745215914104'),
			]),
			content: $t('t_18_1746773355467', [
				Number(item.config.enabled) ? $t('t_5_1745215914671') : $t('t_6_1745215914104'),
			]),
			onPositiveClick: async () => {
				try {
					await updateReportChannel({
						id: Number(item.id),
						name: item.name,
						type: item.type,
						config: JSON.stringify(item.config),
					})
					await fetchNotifyChannels()
				} catch (error) {
					handleError(error)
				}
			},
			// 取消后刷新通知渠道列表
			onNegativeClick: () => {
				fetchNotifyChannels()
			},
			onClose: () => {
				fetchNotifyChannels()
			},
		})
	}

	/**
	 * 查看通知渠道配置
	 * @function viewChannelConfig
	 * @description 显示特定通知渠道的详细配置信息
	 * @param {ReportType<ReportMail>} item - 要查看的通知渠道对象
	 * @returns {void} 无返回值
	 */
	const editChannelConfig = (item: ReportType<ReportMail>) => {
		console.log(item)
		if (item.type === 'mail') {
			useModal({
				title: $t('t_0_1745895057404'),
				area: 650,
				component: EmailChannelForm,
				componentProps: {
					data: item,
				},
				footer: true,
				onClose: () => fetchNotifyChannels(),
			})
		}
	}

	/**
	 * 测试通知渠道配置
	 * @function testChannelConfig
	 * @description 测试通知渠道配置
	 * @param {ReportType<ReportMail>} item - 要测试的通知渠道对象
	 * @returns {void} 无返回值
	 */
	const testChannelConfig = (item: ReportType<ReportMail>) => {
		if (item.type !== 'mail') {
			message.warning($t('t_19_1746773352558'))
			return
		}
		const { open, close } = useLoadingMask({ text: $t('t_20_1746773356060') })

		useDialog({
			title: $t('t_21_1746773350759'),
			content: $t('t_22_1746773360711'),
			onPositiveClick: async () => {
				try {
					open()
					await testReportChannel({ id: item.id })
				} catch (error) {
					handleError(error)
				} finally {
					close()
				}
			},
		})
	}

	/**
	 * 删除通知渠道
	 * @function confirmDeleteChannel
	 * @description 确认并删除指定的通知渠道
	 * @param {ReportType<ReportMail>} item - 要删除的通知渠道对象
	 * @returns {void} 无返回值
	 */
	const confirmDeleteChannel = (item: ReportType<ReportMail>) => {
		useDialog({
			title: $t('t_23_1746773350040'),
			content: $t('t_0_1746773763967', [item.name]),
			onPositiveClick: async () => {
				try {
					await deleteReportChannel({ id: item.id })
					await fetchNotifyChannels()
				} catch (error) {
					handleError(error)
				}
			},
		})
	}

	return {
		activeTab,
		isCutTab,
		tabOptions,
		generalSettings,
		notifyChannels,
		channelTypes,
		aboutInfo,
		fetchAllSettings,
		handleSaveGeneralSettings,
		openAddEmailChannelModal,
		handleEnableChange,
		editChannelConfig,
		testChannelConfig,
		confirmDeleteChannel,
	}
}

/**
 * 常用设置表单控制器
 * @function useGeneralSettingsController
 * @description 提供常用设置表单的配置、规则和组件
 * @returns {object} 返回表单相关配置、规则和组件
 */
export const useGeneralSettingsController = () => {
	/**
	 * 表单验证规则
	 * @type {FormRules}
	 */
	const rules: FormRules = {
		timeout: {
			required: true,
			type: 'number',
			trigger: ['input', 'blur'],
			message: '请输入超时时间',
		},
		secure: {
			required: true,
			trigger: ['input', 'blur'],
			message: '请输入安全入口',
		},
		username: {
			required: true,
			trigger: ['input', 'blur'],
			message: '请输入管理员账号',
		},
		password: {
			trigger: ['input', 'blur'],
			message: '请输入管理员密码',
		},
		cert: {
			required: true,
			trigger: 'input',
			message: '请输入SSL证书',
		},
		key: {
			required: true,
			trigger: 'input',
			message: '请输入SSL密钥',
		},
	}

	/**
	 * 表单配置
	 * @type {ComputedRef<FormConfig>}
	 * @description 动态生成表单项配置，根据SSL启用状态显示或隐藏SSL相关字段
	 */
	const config = computed(() => {
		const options = [
			useFormInputNumber('超时时间 (秒)', 'timeout', { class: 'w-full' }),
			useFormInput('安全入口', 'secure'),
			useFormInput('管理员账号', 'username'),
			useFormInput('管理员密码', 'password', { type: 'password', showPasswordOn: 'click' }),
			useFormSwitch('启用SSL', 'https', {
				checkedValue: '1',
				uncheckedValue: '0',
			}),
		]
		if (Number(generalSettings.value.https) === 1) {
			options.push(useFormTextarea('SSL证书', 'cert', { rows: 3 }), useFormTextarea('SSL密钥', 'key', { rows: 3 }))
		}
		return options
	})

	/**
	 * 创建表单组件
	 * @type {Object}
	 */
	const { component: GeneralForm } = useForm({
		config,
		defaultValue: generalSettings,
		rules,
	})

	return {
		GeneralForm,
		config,
		rules,
	}
}

/**
 * 邮箱通知渠道表单控制器
 * @function useEmailChannelFormController
 * @description 提供邮箱通知渠道表单的配置、规则和提交方法
 * @returns {object} 返回表单相关配置、规则和方法
 */
export const useEmailChannelFormController = () => {
	const { open: openLoad, close: closeLoad } = useLoadingMask({ text: $t('t_0_1746667592819') })
	/**
	 * 表单验证规则
	 * @type {FormRules}
	 */
	const rules: FormRules = {
		name: {
			required: true,
			trigger: ['input', 'blur'],
			message: $t('t_25_1746773349596'),
		},

		smtpHost: {
			required: true,
			trigger: ['input', 'blur'],
			message: $t('t_15_1745833940280'),
		},
		smtpPort: {
			required: true,
			trigger: 'input',
			validator: (rule: FormItemRule, value: string) => {
				const port = Number(value)
				if (isNaN(port) || port < 1 || port > 65535) {
					return new Error($t('t_26_1746773353409'))
				} else {
					return true
				}
			},
		},
		password: {
			required: true,
			trigger: ['input', 'blur'],
			message: $t('t_27_1746773352584'),
		},
		sender: {
			required: true,
			trigger: ['input', 'blur'],
			type: 'email',
			message: $t('t_28_1746773354048'),
		},
		receiver: {
			required: true,
			trigger: ['input', 'blur'],
			type: 'email',
			message: $t('t_29_1746773351834'),
		},
	}

	/**
	 * 表单配置
	 * @type {ComputedRef<FormConfig>}
	 * @description 生成邮箱通知渠道表单的字段配置
	 */
	const config = computed(() => [
		useFormInput($t('t_2_1745289353944'), 'name'),
		useFormSlot('smtp-template'),
		useFormSlot('username-template'),
		useFormInput($t('t_30_1746773350013'), 'sender'),
		useFormInput($t('t_31_1746773349857'), 'receiver'),
	])

	/**
	 * 提交表单
	 * @async
	 * @function submitForm
	 * @description 验证并提交邮箱通知渠道表单
	 * @param {any} params - 表单参数
	 * @param {Ref<FormInst>} formRef - 表单实例引用
	 * @returns {Promise<boolean>} 提交成功返回true，失败返回false
	 */
	const submitForm = async (
		{ config, ...other }: AddReportParams<ReportMail>,
		formRef: Ref<FormInst | null>,
		id?: number,
	) => {
		try {
			openLoad()
			if (id) {
				await updateReportChannel({ id, config: JSON.stringify(config), ...other })
			} else {
				await addReportChannel({ config: JSON.stringify(config), ...other })
			}
			return true
		} catch (error) {
			handleError(error)
			return false
		} finally {
			closeLoad()
		}
	}

	return {
		config,
		rules,
		emailChannelForm,
		submitForm,
	}
}
