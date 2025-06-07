import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import {
	getSystemSetting,
	saveSystemSetting,
	getReportList,
	updateReport,
	deleteReport,
	addReport,
	testReport,
} from '@/api/setting'
import type {
	SaveSettingParams,
	SystemSetting,
	ReportType,
	GetReportListParams,
	AddReportParams,
	UpdateReportParams,
	DeleteReportParams,
	ReportMail,
	TestReportParams,
	ReportFeishu,
	ReportWebhook,
	ReportDingtalk,
	ReportWecom,
} from '@/types/setting'

const { handleError } = useError()
/**
 * 设置页面状态 Store
 * @description 用于管理设置相关的状态和操作
 */
export const useSettingsStore = defineStore('settings-store', () => {
	// -------------------- 状态定义 --------------------
	// 当前激活的标签页
	const activeTab = ref<'general' | 'notification' | 'about'>('general')

	// 标签页选项
	const tabOptions = ref([
		{ key: 'general', title: '常用设置', icon: 'SettingOutlined' },
		{ key: 'notification', title: '告警通知', icon: 'BellOutlined' },
		{ key: 'about', title: '关于我们', icon: 'InfoCircleOutlined' },
	])

	const generalSettings = ref<SystemSetting>({
		timeout: 30,
		secure: '',
		username: 'admin',
		password: '',
		https: 0,
		key: '',
		cert: '',
	})
	// // 通知设置表单数据
	// const notificationSettings = ref<CertEndNoticeTemplate>({
	// 	title: '【AllIn SSL】系统告警通知', // 通知标题
	// 	content: '尊敬的用户，您的系统出现了以下警告：{{content}}，请及时处理。', // 通知内容模板
	// })

	// 通知渠道列表
	const notifyChannels = ref<ReportType<ReportMail>[]>([])

	// 通知渠道类型
	const channelTypes = ref<Record<string, string>>({
		mail: $t('t_68_1745289354676'),
		dingtalk: $t('t_32_1746773348993'),
		workwx: $t('t_33_1746773350932'),
		feishu: $t('t_34_1746773350153'),
		webhook: 'WebHook',
	})

	// 邮箱通知渠道表单
	const emailChannelForm = ref<ReportMail>({
		name: '',
		enabled: '1',
		receiver: '', // 接受邮箱
		sender: '', // 发送邮箱
		smtpHost: '', // SMTP服务器
		smtpPort: '465', //SMTP端口
		smtpTLS: false, // TLS协议，加密
		password: '',
	})

	// 飞书通知渠道表单
	const feishuChannelForm = ref<ReportFeishu>({
		name: '',
		enabled: '1',
		webhook: '', // 飞书webhook地址
		secret: '', // 飞书webhook加密密钥（可选）
	})

	// Webhook通知渠道表单
	const webhookChannelForm = ref<ReportWebhook>({
		name: '',
		enabled: '1',
		url: '', // WebHook回调地址
		data: '', // WebHook推送通知回调数据（可选）
		method: 'post', // 请求方式
		headers: 'Content-Type: application/json', // WebHook请求头（可选）
		ignore_ssl: false, // 忽略SSL/TLS证书错误
	})

	// 钉钉通知渠道表单
	const dingtalkChannelForm = ref<ReportDingtalk>({
		name: '',
		enabled: '1',
		webhook: '', // 钉钉webhook地址
		secret: '', // 钉钉webhook加密密钥（可选）
	})

	// 企业微信通知渠道表单
	const wecomChannelForm = ref<ReportWecom>({
		name: '',
		enabled: '1',
		url: '', // 企业微信webhook地址
		data: `{
  "msgtype": "news",
  "news": {
    "articles": [
      {
        "title": "__subject__",
        "description": "__body__。",
        "url": "https://allinssl.com/",
        "picurl": "https://allinssl.com/logo.svg"
      }
    ]
  }
}`, // 企业微信推送数据格式
	})

	// 关于页面数据
	const aboutInfo = ref({
		version: '1.0.0',
		hasUpdate: false,
		latestVersion: '',
		updateLog: '',
		qrcode: {
			service: 'https://example.com/service_qr.png',
			wechat: 'https://example.com/wechat_qr.png',
		},
		description: $t('t_0_1747904536291'),
	})

	// -------------------- 工具方法 --------------------
	/**
	 * 获取系统设置
	 */
	const fetchGeneralSettings = async () => {
		try {
			const { data } = await getSystemSetting().fetch()
			generalSettings.value = { ...generalSettings.value, ...(data || {}) }
		} catch (error) {
			handleError(error).default($t('t_0_1745464080226'))
		}
	}
	/**
	 * 保存系统设置
	 */
	const saveGeneralSettings = async (params: SaveSettingParams) => {
		try {
			const { fetch, message } = saveSystemSetting(params)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_1_1745464079590'))
		}
	}

	/**
	 * 获取通知渠道列表
	 */
	const fetchNotifyChannels = async (params: GetReportListParams = { p: 1, search: '', limit: 1000 }) => {
		try {
			const { data } = await getReportList(params).fetch()
			notifyChannels.value = (data || []).map(({ config, ...otherwise }) => {
				console.log(config)
				return {
					config: JSON.parse(config),
					...otherwise,
				}
			})

			console.log(notifyChannels.value)
		} catch (error) {
			notifyChannels.value = []
			handleError(error).default($t('t_4_1745464075382'))
		}
	}

	/**
	 * 添加通知渠道
	 */
	const addReportChannel = async (params: AddReportParams) => {
		try {
			const { fetch, message } = addReport(params)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_5_1745464086047'))
		}
	}

	/**
	 * 更新通知渠道
	 */
	const updateReportChannel = async (params: UpdateReportParams) => {
		try {
			const { fetch, message } = updateReport(params)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_6_1745464075714'))
		}
	}

	/**
	 * 测试通知渠道
	 */
	const testReportChannel = async (params: TestReportParams) => {
		try {
			const { fetch, message } = testReport(params)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_0_1746676862189'))
		}
	}
	/**
	 * 删除通知渠道
	 */
	const deleteReportChannel = async ({ id }: DeleteReportParams) => {
		try {
			const { fetch, message } = deleteReport({ id })
			message.value = true
			await fetch()
			await fetchNotifyChannels()
		} catch (error) {
			handleError(error).default($t('t_7_1745464073330'))
		}
	}

	// /**
	//  * 检查版本更新
	//  */
	// const checkUpdate = async () => {
	// 	try {
	// 		const res = await systemUpdate().fetch()
	// 		// 实际应用中可能需要修改API或类型定义
	// 		aboutInfo.value = {
	// 			...aboutInfo.value,
	// 			...(res.data || {
	// 				hasUpdate: false,
	// 				latestVersion: '--',
	// 				updateLog: '--',
	// 			}),
	// 		}
	// 	} catch (error) {
	// 		handleError(error).default($t('t_8_1745464081472'))
	// 		return null
	// 	}
	// }

	return {
		// 状态
		activeTab,
		tabOptions,
		generalSettings,
		notifyChannels,
		channelTypes,
		emailChannelForm,
		feishuChannelForm,
		webhookChannelForm,
		dingtalkChannelForm,
		wecomChannelForm,
		aboutInfo,

		// 方法
		fetchGeneralSettings,
		saveGeneralSettings,

		fetchNotifyChannels,
		addReportChannel,
		updateReportChannel,
		deleteReportChannel,
		testReportChannel,
	}
})

/**
 * 组合式 API 使用 Store
 * @description 提供对设置页面 Store 的访问，并返回响应式引用
 * @returns {Object} 包含所有 store 状态和方法的对象
 */
export const useStore = () => {
	const store = useSettingsStore()
	return { ...store, ...storeToRefs(store) }
}
