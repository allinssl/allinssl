import { FormRules } from 'naive-ui'
import md5 from 'crypto-js/md5'
import { useFormHooks, useModal, useDialog, useForm, useMessage, useLoadingMask } from '@baota/naive-ui/hooks'
import { clearCookie, clearSession } from '@baota/utils/browser'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import { useStore } from './useStore'

import EmailChannelModel from './components/channel/EmailChannelModel'
import FeishuChannelModel from './components/channel/FeishuChannelModel'
import WebhookChannelModel from './components/channel/WebhookChannelModel'
import DingtalkChannelModel from './components/channel/DingtalkChannelModel'
import WecomChannelModel from './components/channel/WecomChannelModel'
import type { ReportMail, SaveSettingParams, ReportType } from '@/types/setting'

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
	updateReportChannel,
	testReportChannel,
	deleteReportChannel,
} = useStore()
const message = useMessage()
const { handleError } = useError()
const { useFormInput, useFormInputNumber, useFormSwitch, useFormTextarea } = useFormHooks()

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
			component: EmailChannelModel,
			footer: true,
		})
	}

	/**
	 * 打开添加飞书通知渠道弹窗
	 * @function openAddFeishuChannelModal
	 * @description 打开添加飞书通知渠道的模态框，并在关闭后刷新通知渠道列表
	 * @returns {void} 无返回值
	 */
	const openAddFeishuChannelModal = (limit: number = 1) => {
		if (limit >= 1) {
			message.warning($t('t_0_1748591495320'))
			return
		}
		useModal({
			title: $t('t_9_1746676857164'),
			area: 650,
			component: FeishuChannelModel,
			footer: true,
		})
	}

	/**
	 * 打开添加Webhook通知渠道弹窗
	 * @function openAddWebhookChannelModal
	 * @description 打开添加Webhook通知渠道的模态框，并在关闭后刷新通知渠道列表
	 * @returns {void} 无返回值
	 */
	const openAddWebhookChannelModal = (limit: number = 1) => {
		if (limit >= 1) {
			message.warning($t('t_1_1748591498948'))
			return
		}
		useModal({
			title: $t('t_11_1746676859158'),
			area: 650,
			component: WebhookChannelModel,
			footer: true,
		})
	}

	/**
	 * 打开添加钉钉通知渠道弹窗
	 * @function openAddDingtalkChannelModal
	 * @description 打开添加钉钉通知渠道的模态框，并在关闭后刷新通知渠道列表
	 * @returns {void} 无返回值
	 */
	const openAddDingtalkChannelModal = (limit: number = 1) => {
		if (limit >= 1) {
			message.warning($t('t_2_1748591495339'))
			return
		}
		useModal({
			title: '添加钉钉通知',
			area: 650,
			component: DingtalkChannelModel,
			footer: true,
		})
	}

	/**
	 * 打开添加企业微信通知渠道弹窗
	 * @function openAddWecomChannelModal
	 * @description 打开添加企业微信通知渠道的模态框，并在关闭后刷新通知渠道列表
	 * @returns {void} 无返回值
	 */
	const openAddWecomChannelModal = (limit: number = 1) => {
		if (limit >= 1) {
			message.warning('企业微信通知渠道已达到上限')
			return
		}
		useModal({
			title: '添加企业微信通知',
			area: 650,
			component: WecomChannelModel,
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
	const editChannelConfig = (item: ReportType<any>) => {
		console.log(item)
		if (item.type === 'mail') {
			useModal({
				title: $t('t_0_1745895057404'),
				area: 650,
				component: EmailChannelModel,
				componentProps: {
					data: item,
				},
				footer: true,
				onClose: () => fetchNotifyChannels(),
			})
		} else if (item.type === 'feishu') {
			useModal({
				title: $t('t_9_1746676857164'),
				area: 650,
				component: FeishuChannelModel,
				componentProps: {
					data: item,
				},
				footer: true,
				onClose: () => fetchNotifyChannels(),
			})
		} else if (item.type === 'webhook') {
			useModal({
				title: $t('t_11_1746676859158'),
				area: 650,
				component: WebhookChannelModel,
				componentProps: {
					data: item,
				},
				footer: true,
				onClose: () => fetchNotifyChannels(),
			})
		} else if (item.type === 'dingtalk') {
			useModal({
				title: '编辑钉钉通知',
				area: 650,
				component: DingtalkChannelModel,
				componentProps: {
					data: item,
				},
				footer: true,
				onClose: () => fetchNotifyChannels(),
			})
		} else if (item.type === 'workwx') {
			useModal({
				title: '编辑企业微信通知',
				area: 650,
				component: WecomChannelModel,
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
	const testChannelConfig = (item: ReportType<any>) => {
		if (
			item.type !== 'mail' &&
			item.type !== 'feishu' &&
			item.type !== 'webhook' &&
			item.type !== 'dingtalk' &&
			item.type !== 'workwx'
		) {
			message.warning($t('t_19_1746773352558'))
			return
		}
		const typeMap = {
			mail: $t('t_1_1745735764953'),
			feishu: $t('t_34_1746773350153'),
			webhook: $t('t_3_1748591484673'),
			dingtalk: $t('t_32_1746773348993'),
			workwx: $t('t_33_1746773350932'),
		}
		const { open, close } = useLoadingMask({ text: $t('t_4_1748591492587', { type: typeMap[item.type] }) })
		useDialog({
			title: $t('t_5_1748591491370', { type: typeMap[item.type] }),
			content: $t('t_0_1748591669194', { type: typeMap[item.type] }),
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
		openAddFeishuChannelModal,
		openAddWebhookChannelModal,
		openAddDingtalkChannelModal,
		openAddWecomChannelModal,
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
