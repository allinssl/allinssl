/**
 * 实名模板管理页面状态管理
 * 负责管理模板数据、筛选条件、分页等状态
 * 包含硬编码的映射内容和响应式数据源
 */

import { ref, reactive } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { fetchContactUserDetail, deleteUserDetail } from '@/api/real-name'
import { useError } from '@baota/hooks/error'
import { c, type SelectOption } from 'naive-ui'

import type { RealNameTemplate, GetUserDetailRequest, TagType, ContactTemplateItem } from './types.d'
import type { DomainRegistrationFormData } from './types.d'
import { TableResponse } from '@baota/naive-ui/types/table'

const { handleError } = useError()

/**
 * 硬编码的映射内容（从config.tsx移植）
 */

/**
 * 模板类型映射配置
 */
const TEMPLATE_TYPE_MAP = {
	1: { text: '个人', color: '#1890ff' },
	2: { text: '企业', color: '#722ed1' },
	unknown: { text: '未知类型', color: '#666666' },
} as const

/**
 * 证件类型映射配置
 */
const CERTIFICATE_TYPE_MAP = {
	1: { text: '身份证', color: '#1890ff' },
	2: { text: '营业执照', color: '#52c41a' },
	3: { text: '护照', color: '#faad14' },
	unknown: { text: '未知证件', color: '#666666' },
} as const

/**
 * 模板状态映射配置
 */
const TEMPLATE_STATUS_MAP = {
	1: { type: 'warning' as const, text: '待审核', color: '#faad14' },
	2: { type: 'success' as const, text: '已认证', color: '#52c41a' },
	3: { type: 'error' as const, text: '审核失败', color: '#ff4d4f' },
	unknown: { type: 'default' as const, text: '未知状态', color: '#666666' },
} as const

/** 模板类型选项 */
const templateTypeOptions: SelectOption[] = [
	{ label: '全部类型', value: -1 },
	{ label: '个人', value: 1 },
	{ label: '企业', value: 2 },
]

/** 模板状态选项 */
const templateStatusOptions: SelectOption[] = [
	{ label: '全部状态', value: -1 },
	{ label: '待审核', value: 0 },
	{ label: '已认证', value: 1 },
	{ label: '审核失败', value: 2 },
]

/**
 * 脱敏处理工具函数
 */
const maskUtils = {
	/**
	 * 脱敏证件号码
	 * @param number 证件号码
	 */
	maskCertificateNumber: (number?: string | null): string => {
		if (!number || typeof number !== 'string' || number.length < 8) return number || ''
		const start = number.slice(0, 3)
		const end = number.slice(-4)
		const middle = '*'.repeat(Math.max(0, number.length - 7))
		return `${start}${middle}${end}`
	},

	/**
	 * 脱敏手机号
	 * @param phone 手机号
	 */
	maskPhone: (phone?: string | null): string => {
		if (!phone || typeof phone !== 'string' || phone.length < 7) return phone || ''
		const start = phone.slice(0, 3)
		const end = phone.slice(-4)
		return `${start}****${end}`
	},

	/**
	 * 脱敏邮箱
	 * @param email 邮箱
	 */
	maskEmail: (email?: string | null): string => {
		if (!email || typeof email !== 'string' || !email.includes('@')) return email || ''
		const [username, domain] = email.split('@')
		if (!username || !domain || username.length <= 2) return email
		const maskedUsername = username.slice(0, 2) + '****'
		return `${maskedUsername}@${domain}`
	},
}

/**
 * 实名模板管理页面状态Store
 */
export const useRealNameStore = defineStore('real-name-store', () => {
	// -------------------- 状态定义 --------------------

	/** 页面加载状态 */
	const loading = ref(false)

	/** 选中的模板ID列表 */
	const selectedTemplateIds = ref<number[]>([])

	/** 分页参数 */
	const templateTableParams = reactive({
		p: 1,
		type: -1,
		rows: 10,
	})

	/** 当前选中的模板 */
	const currentTemplate = ref<RealNameTemplate | null>(null)

	// -------------------- 方法定义 --------------------

	// -------------------- 映射工具方法 --------------------

	/**
	 * 获取模板类型文本
	 * @param type 类型值
	 */
	const getTemplateTypeText = (type: number | undefined): string =>
		TEMPLATE_TYPE_MAP[type as keyof typeof TEMPLATE_TYPE_MAP]?.text ?? TEMPLATE_TYPE_MAP.unknown.text

	/**
	 * 获取模板类型颜色
	 * @param type 类型值
	 */
	const getTemplateTypeColor = (type: number | undefined): string =>
		TEMPLATE_TYPE_MAP[type as keyof typeof TEMPLATE_TYPE_MAP]?.color ?? TEMPLATE_TYPE_MAP.unknown.color

	/**
	 * 获取证件类型文本
	 * @param type 证件类型值
	 */
	const getCertificateTypeText = (type: number | undefined): string =>
		CERTIFICATE_TYPE_MAP[type as keyof typeof CERTIFICATE_TYPE_MAP]?.text ?? CERTIFICATE_TYPE_MAP.unknown.text

	/**
	 * 获取模板状态文本
	 * @param status 状态值
	 */
	const getTemplateStatusText = (status: number | undefined): string =>
		TEMPLATE_STATUS_MAP[status as keyof typeof TEMPLATE_STATUS_MAP]?.text ?? TEMPLATE_STATUS_MAP.unknown.text

	/**
	 * 获取模板状态类型（用于NTag组件）
	 * @param status 状态值
	 */
	const getTemplateStatusType = (status: number | undefined): TagType =>
		TEMPLATE_STATUS_MAP[status as keyof typeof TEMPLATE_STATUS_MAP]?.type ?? TEMPLATE_STATUS_MAP.unknown.type

	/**
	 * 获取实名模板列表数据
	 * @param params 查询参数
	 */
	const fetchTemplateList = async <T = ContactTemplateItem,>(
		params: GetUserDetailRequest = {},
	): Promise<TableResponse<T>> => {
		const { fetch, data } = fetchContactUserDetail(params)
		try {
			await fetch()
			const {
				data: { data: list, count },
			} = data.value
			return { list: list as T[], total: count }
		} catch (error) {
			handleError(error)
			console.log({ list: [] as T[], total: 0 })
			return { list: [] as T[], total: 0 }
		}
		console.log('...')
	}

	/**
	 * 删除实名模板
	 * @param id 实名模板id
	 */
	const deleteTemplateById = async (id: number) => {
		try {
			const { data, fetch, message } = deleteUserDetail({ id })
			message.value = true
			await fetch()
			return data
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 将RealNameTemplate转换为DomainRegistrationFormData
	 * @param template 实名模板数据
	 * @returns 表单数据
	 */
	const convertToFormData = (template: RealNameTemplate): DomainRegistrationFormData => {
		return {
			// 基础信息
			template_name: template.template_name || '',
			type: template.type || 1,
			id_type: template.id_type || 1,
			id_number: template.id_number || '',
			id_image_front: [],
			id_image_back: [],
			business_license: [],
			is_default: template.is_default === 1,
			// 中文模板信息
			owner_name: template.owner_name || '',
			contact_person: template.contact_person || '',
			phone: template.phone || '',
			email: template.email || '',
			city: template.city,
			city_id: template.city_id,
			address: template.address || '',
			postal_code: template.postal_code || '',
			// 英文模板信息
			owner_name_en: template.owner_name_en || '',
			address_en: template.address_en || '',
		}
	}

	/**
	 * 设置当前选中的模板
	 * @param template 模板数据
	 */
	const setCurrentTemplate = (template: RealNameTemplate | null) => {
		currentTemplate.value = template
	}

	/**
	 * 更新筛选参数并刷新列表
	 * @param params 筛选参数
	 */
	const updateFilterParams = async () => {
		templateTableParams.p = 1 // 重置到第一页
		await fetchTemplateList()
	}
	
	const openRealNameDialog = ref()

	// 返回状态和方法
	return {
		// 状态
		loading,
		selectedTemplateIds,
		// templatesData,
		templateTableParams,
		// pagination,
		// filterParams,
		currentTemplate,
		openRealNameDialog,

		// 映射工具
		getTemplateTypeText,
		getTemplateTypeColor,
		getCertificateTypeText,
		getTemplateStatusText,
		getTemplateStatusType,
		maskUtils,

		// 常量
		templateTypeOptions,
		templateStatusOptions,

		// 方法
		fetchTemplateList,
		deleteTemplateById,
		convertToFormData,
		setCurrentTemplate,
		updateFilterParams,
	}
})

/**
 * 导出Store实例
 */
export const useRealNameState = () => {
	const store = useRealNameStore()
	return {
		...store,
		...storeToRefs(store),
	}
}

/**
 * 导出映射工具和常量
 */
export {
	TEMPLATE_TYPE_MAP,
	CERTIFICATE_TYPE_MAP,
	TEMPLATE_STATUS_MAP,
	templateTypeOptions,
	templateStatusOptions,
	maskUtils,
}
