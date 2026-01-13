import { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { useFormHooks, useLoadingMask } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import { useStore } from '@settings/useStore'
import type {
	ReportMail,
	ReportFeishu,
	ReportWebhook,
	ReportDingtalk,
	ReportWecom,
	AddReportParams,
} from '@/types/setting'

const {
	emailChannelForm,
	feishuChannelForm,
	webhookChannelForm,
	dingtalkChannelForm,
	wecomChannelForm,
	addReportChannel,
	updateReportChannel,
} = useStore()

const { handleError } = useError()
const { useFormInput, useFormSwitch, useFormTextarea, useFormSelect, useFormSlot } = useFormHooks()

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

/**
 * 飞书通知渠道表单控制器
 * @function useFeishuChannelFormController
 * @description 提供飞书通知渠道表单的配置、规则和提交方法
 * @returns {object} 返回表单相关配置、规则和方法
 */
export const useFeishuChannelFormController = () => {
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
		webhook: {
			required: true,
			trigger: ['input', 'blur'],
			message: '请输入飞书webhook地址',
		},
	}

	/**
	 * 表单配置
	 * @type {ComputedRef<FormConfig>}
	 * @description 生成飞书通知渠道表单的字段配置
	 */
	const config = computed(() => [
		useFormInput($t('t_2_1745289353944'), 'name'),
		useFormInput('飞书WebHook地址', 'webhook'),
		useFormInput('飞书WebHook密钥（可选）', 'secret', {}, { showRequireMark: false }),
	])

	/**
	 * 提交表单
	 * @async
	 * @function submitForm
	 * @description 验证并提交飞书通知渠道表单
	 * @param {any} params - 表单参数
	 * @param {Ref<FormInst>} formRef - 表单实例引用
	 * @returns {Promise<boolean>} 提交成功返回true，失败返回false
	 */
	const submitForm = async (
		{ config, ...other }: AddReportParams<ReportFeishu>,
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
		feishuChannelForm,
		submitForm,
	}
}

/**
 * Webhook通知渠道表单控制器
 * @function useWebhookChannelFormController
 * @description 提供Webhook通知渠道表单的配置、规则和提交方法
 * @returns {object} 返回表单相关配置、规则和方法
 */
export const useWebhookChannelFormController = () => {
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
		url: {
			required: true,
			trigger: ['input', 'blur'],
			message: '请输入WebHook回调地址',
		},
	}

	/**
	 * 表单配置
	 * @type {ComputedRef<FormConfig>}
	 * @description 生成Webhook通知渠道表单的字段配置
	 */
	const config = computed(() => [
		useFormInput($t('t_2_1745289353944'), 'name'),
		useFormInput('WebHook回调地址', 'url'),
		useFormSelect('请求方式', 'method', [
			{ label: 'POST', value: 'post' },
			{ label: 'GET', value: 'get' },
		]),
		useFormTextarea(
			'WebHook请求头（可选）',
			'headers',
			{ rows: 3, placeholder: 'Content-Type: application/json' },
			{ showRequireMark: false },
		),
		useFormTextarea(
			'WebHook推送通知回调数据（可选）',
			'data',
			{ rows: 3, placeholder: '请使用JSON格式，例如：{"title":"test","content":"test"}' },
			{ showRequireMark: false },
		),
		useFormSwitch('忽略SSL/TLS证书错误', 'ignore_ssl'),
	])

	/**
	 * 提交表单
	 * @async
	 * @function submitForm
	 * @description 验证并提交Webhook通知渠道表单
	 * @param {any} params - 表单参数
	 * @param {Ref<FormInst>} formRef - 表单实例引用
	 * @returns {Promise<boolean>} 提交成功返回true，失败返回false
	 */
	const submitForm = async (
		{ config, ...other }: AddReportParams<ReportWebhook>,
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
		webhookChannelForm,
		submitForm,
	}
}

/**
 * 钉钉通知渠道表单控制器
 * @function useDingtalkChannelFormController
 * @description 提供钉钉通知渠道表单的配置、规则和提交方法
 * @returns {object} 返回表单相关配置、规则和方法
 */
export const useDingtalkChannelFormController = () => {
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
		webhook: {
			required: true,
			trigger: ['input', 'blur'],
			message: '请输入钉钉webhook地址',
		},
	}

	/**
	 * 表单配置
	 * @type {ComputedRef<FormConfig>}
	 * @description 生成钉钉通知渠道表单的字段配置
	 */
	const config = computed(() => [
		useFormInput($t('t_2_1745289353944'), 'name'),
		useFormInput('钉钉WebHook地址', 'webhook'),
		useFormInput('钉钉WebHook密钥（可选）', 'secret', {}, { showRequireMark: false }),
	])

	/**
	 * 提交表单
	 * @async
	 * @function submitForm
	 * @description 验证并提交钉钉通知渠道表单
	 * @param {any} params - 表单参数
	 * @param {Ref<FormInst>} formRef - 表单实例引用
	 * @returns {Promise<boolean>} 提交成功返回true，失败返回false
	 */
	const submitForm = async (
		{ config, ...other }: AddReportParams<ReportDingtalk>,
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
		dingtalkChannelForm,
		submitForm,
	}
}

/**
 * 企业微信通知渠道表单控制器
 * @function useWecomChannelFormController
 * @description 提供企业微信通知渠道表单的配置、规则和提交方法
 * @returns {object} 返回表单相关配置、规则和方法
 */
export const useWecomChannelFormController = () => {
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
		url: {
			required: true,
			trigger: ['input', 'blur'],
			message: '请输入企业微信webhook地址',
		},
	}

	/**
	 * 表单配置
	 * @type {ComputedRef<FormConfig>}
	 * @description 生成企业微信通知渠道表单的字段配置
	 */
	const config = computed(() => [
		useFormInput($t('t_2_1745289353944'), 'name'),
		useFormInput('企业微信WebHook地址', 'url'),
		useFormTextarea(
			'推送数据格式',
			'data',
			{
				placeholder: `请输入企业微信推送数据格式，支持模板变量 __subject__ 和 __body__

示例格式：
{
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
}`,
				rows: 12,
			},
			{ showRequireMark: false },
		),
	])

	/**
	 * 提交表单
	 * @async
	 * @function submitForm
	 * @description 验证并提交企业微信通知渠道表单
	 * @param {any} params - 表单参数
	 * @param {Ref<FormInst>} formRef - 表单实例引用
	 * @returns {Promise<boolean>} 提交成功返回true，失败返回false
	 */
	const submitForm = async (
		{ config, ...other }: AddReportParams<ReportWecom>,
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
		wecomChannelForm,
		submitForm,
	}
}
