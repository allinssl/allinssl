import type { FormOption } from './NodeFormConfig' // 假设 FormOption 主要是类型定义

import { ApiProjectConfig, ApiProjectType } from '@config/data'
import { $t } from '@locales/index'

/**
 * 部署类型分类
 */
export const DeployCategories = {
	// 默认分类-全部
	ALL: 'all' as const,
} as const

// 添加动态分类，基于ApiProjectConfig配置
// 创建一个单独的对象，存储分类映射关系
export const CategoryMap: Record<string, string> = {}

// 初始化分类映射
Object.entries(ApiProjectConfig).forEach(([key, config]) => {
	if (config.type?.includes('host') && config.icon) {
		// 将提供商的icon作为分类ID
		CategoryMap[key] = config.icon
	}
})

/**
 * 部署提供商类型
 */
export type DeployProviderType = keyof typeof ApiProjectConfig

/**
 * 支持部署操作的提供商
 * @returns 可部署的提供商类型数组
 */
export function getDeployableProviders(): DeployProviderType[] {
	return Object.keys(ApiProjectConfig).filter((key) => {
		const config = ApiProjectConfig[key as DeployProviderType] as ApiProjectType
		return Array.isArray(config.type) && config.type.includes('host')
	}) as DeployProviderType[]
}

/**
 * 获取部署类型所属分类
 * @param provider 提供商类型
 * @returns 对应的分类
 */
export function getProviderCategory(provider: string): string {
	// 提取主要提供商部分（如 'aliyun-cdn' 返回 'aliyun'）
	const mainProvider = provider.split('-')[0] as DeployProviderType

	// 从映射中获取分类
	return CategoryMap[mainProvider] || DeployCategories.ALL
}

/**
 * 获取部署类型选项
 * @returns 部署类型选项列表
 */
export function getDeployTypeOptions(): FormOption[] {
	const deployTypeOptions: FormOption[] = []
	const deployableProviders = getDeployableProviders()

	// 遍历所有支持部署的提供商
	deployableProviders.forEach((provider) => {
		const providerConfig = ApiProjectConfig[provider] as ApiProjectType
		const { icon } = providerConfig

		// 使用类型守卫进行安全访问
		if ('hostRelated' in providerConfig && providerConfig.hostRelated) {
			const hostRelated = providerConfig.hostRelated as Record<string, { name: string }>

			// 安全地检查并访问default属性
			if ('default' in hostRelated && hostRelated.default && 'name' in hostRelated.default) {
				deployTypeOptions.push({
					label: hostRelated.default.name,
					value: provider,
					category: getProviderCategory(provider),
					icon,
				})
			}

			// 添加其他部署相关选项
			Object.entries(hostRelated).forEach(([relatedKey, relatedValue]) => {
				if (relatedKey !== 'default' && relatedValue && typeof relatedValue === 'object' && 'name' in relatedValue) {
					// 构建部署类型值，如 'aliyun-cdn'
					const deployType = `${provider}-${relatedKey}`

					deployTypeOptions.push({
						label: relatedValue.name,
						value: deployType,
						category: getProviderCategory(provider),
						icon,
					})
				}
			})
		}
	})

	// 根据ApiProjectConfig中的sort字段进行排序
	return deployTypeOptions.sort((a, b) => {
		// 提取主要提供商部分（如 'aliyun-cdn' 返回 'aliyun'）
		const aProvider = (a.value?.toString() || '').split('-')[0]
		const bProvider = (b.value?.toString() || '').split('-')[0]

		// 获取排序值，如果没有定义sort则使用999作为默认值
		const aConfig = aProvider ? ApiProjectConfig[aProvider as keyof typeof ApiProjectConfig] : undefined
		const bConfig = bProvider ? ApiProjectConfig[bProvider as keyof typeof ApiProjectConfig] : undefined
		const aSort = aConfig && typeof aConfig === 'object' && 'sort' in aConfig ? aConfig.sort || 999 : 999
		const bSort = bConfig && typeof bConfig === 'object' && 'sort' in bConfig ? bConfig.sort || 999 : 999

		// 首先按sort字段排序
		if (aSort !== bSort) {
			return aSort - bSort
		}

		// 同一提供商内按标签名称排序
		const aLabel = a.label?.toString() || ''
		const bLabel = b.label?.toString() || ''
		return aLabel.localeCompare(bLabel)
	})
}

/**
 * 获取部署类型标签名称 - 动态获取
 * @param category 分类标识
 * @returns 适合展示的标签名称
 */
export function getDeployTabName(category: string): string {
	// 处理特殊的全部分类
	if (category === DeployCategories.ALL) {
		return $t('t_7_1747271292060') // 全部
	}

	// 从ApiProjectConfig中查找匹配的图标，并返回对应的提供商名称
	for (const [_, config] of Object.entries(ApiProjectConfig)) {
		if (config.icon === category) {
			if (config.name === '本地部署') return $t('t_0_1747969933657')
			return config.name
		}
	}
	return ''
}

/**
 * 获取部署类型标签选项
 * @returns 部署类型标签选项
 */
export function getDeployTabOptions(): { name: string; tab: string }[] {
	// 获取所有用到的分类
	const categories = Array.from(
		new Set(
			getDeployTypeOptions()
				.map((option) => option.category)
				.filter(Boolean),
		),
	) as string[]

	// 确保ALL总是第一个
	if (!categories.includes(DeployCategories.ALL)) {
		categories.unshift(DeployCategories.ALL)
	} else {
		const index = categories.indexOf(DeployCategories.ALL)
		categories.splice(index, 1)
		categories.unshift(DeployCategories.ALL)
	}

	// 根据ApiProjectConfig中的sort字段进行分类排序
	const sortedCategories = categories.sort((a, b) => {
		// 全部分类始终排在第一位
		if (a === DeployCategories.ALL) return -1
		if (b === DeployCategories.ALL) return 1

		// 查找对应的提供商配置
		const aProviderEntry = Object.entries(ApiProjectConfig).find(([_, config]) => config.icon === a)
		const bProviderEntry = Object.entries(ApiProjectConfig).find(([_, config]) => config.icon === b)

		// 获取排序值，如果没有定义sort则使用999作为默认值
		const aSort = aProviderEntry?.[1]?.sort || 999
		const bSort = bProviderEntry?.[1]?.sort || 999

		return aSort - bSort
	})

	// 生成标签选项
	return sortedCategories.map((category) => {
		return {
			name: category,
			tab: getDeployTabName(category),
		}
	})
}

/**
 * 获取本地部署提供商选项
 * @returns 本地部署提供商选项
 */
export function getLocalProviderOptions(): FormOption[] {
	const localProvider = ApiProjectConfig.localhost

	if (localProvider && Array.isArray(localProvider.type) && localProvider.type.includes('host')) {
		return [
			{
				label: localProvider.hostRelated?.default?.name || $t('t_6_1747271296994'),
				value: 'localhost',
			},
		]
	}

	return [{ label: $t('t_6_1747271296994'), value: 'localhost' }]
}

/**
 * 过滤部署类型选项
 * @param options 所有部署类型选项
 * @param category 类别
 * @param keyword 搜索关键词
 * @returns 过滤后的选项
 */
export function filterDeployTypeOptions(options: FormOption[], category: string, keyword: string): FormOption[] {
	let filtered = [...options]

	// 根据标签过滤
	if (category !== DeployCategories.ALL) {
		filtered = filtered.filter((item) => item.category === category)
	}

	// 根据搜索关键词过滤
	if (keyword) {
		const searchTerm = keyword.toLowerCase()
		filtered = filtered.filter(
			(item) =>
				(item.label?.toString().toLowerCase() || '').includes(searchTerm) ||
				(item.value?.toString().toLowerCase() || '').includes(searchTerm),
		)
	}

	return filtered
}
