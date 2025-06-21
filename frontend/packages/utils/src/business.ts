/**
 * 文件定义：业务处理
 */

import * as R from 'ramda'
import { isArray } from './type'

/* -------------- 1、常用正则验证 -------------- */
// 常量定义区域
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^1[3-9]\d{9}$/
const ID_CARD_REGEX = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
const URL_REGEX = /^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

// 增强版域名正则表达式 - 支持国际化域名和更多顶级域名
const ENHANCED_DOMAIN_REGEX =
	/^(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)|(?:\*))\.)+(?:[a-zA-Z\u00a1-\uffff]{2,}|xn--[a-zA-Z0-9]+)$/

// 通配符域名正则表达式 - 支持通配符域名格式 (如 *.example.com)
const WILDCARD_DOMAIN_REGEX = /^\*\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

// IPv4正则表达式 - 更精确的数字范围
const IPV4_SEGMENT = '(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])'
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}$`)

// IPv6正则表达式 - 更精确的十六进制表示
const IPV6_HEX_4DIGIT = '[0-9A-Fa-f]{1,4}'
const IPV6_REGEX = new RegExp(
	[
		// 标准IPv6地址
		`^(${IPV6_HEX_4DIGIT}:){7}${IPV6_HEX_4DIGIT}$`,
		// 压缩形式
		`^(${IPV6_HEX_4DIGIT}:){1,7}:$`,
		'^:((:[0-9A-Fa-f]{1,4}){1,7}|:)$',
		// 混合形式
		`^(${IPV6_HEX_4DIGIT}:){1,6}:${IPV6_HEX_4DIGIT}$`,
		`^(${IPV6_HEX_4DIGIT}:){1,5}(:${IPV6_HEX_4DIGIT}){1,2}$`,
		`^(${IPV6_HEX_4DIGIT}:){1,4}(:${IPV6_HEX_4DIGIT}){1,3}$`,
		`^(${IPV6_HEX_4DIGIT}:){1,3}(:${IPV6_HEX_4DIGIT}){1,4}$`,
		`^(${IPV6_HEX_4DIGIT}:){1,2}(:${IPV6_HEX_4DIGIT}){1,5}$`,
		`^${IPV6_HEX_4DIGIT}:(:${IPV6_HEX_4DIGIT}){1,6}$`,
		// 特殊形式
		`^fe80:(:[0-9A-Fa-f]{1,4}){0,4}%[0-9A-Za-z]{1,}$`,
		// IPv4映射到IPv6
		`^::((ffff(:0{1,4})?:)?${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT})$`,
		`^(${IPV6_HEX_4DIGIT}:){1,4}:${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}$`,
	].join('|'),
)

// IP段正则表达式
const IPS_REGEX = new RegExp(
	`^${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}\\.${IPV4_SEGMENT}(\\/([1-2][0-9]|3[0-2]|[1-9]))?$`,
)

// MAC地址正则表达式
const MAC_REGEX = /^([0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}$/

// 中文正则表达式
const CHINESE_REGEX = /^[\u4e00-\u9fa5]+$/

// 端口正则表达式 - 更精确的数字范围
const PORT_REGEX = /^([1-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/

/**
 * 判断是否为邮箱
 * @param {string} email - 要判断的邮箱
 * @returns {boolean} 如果邮箱是有效的，则返回 true，否则返回 false
 */
export const isEmail = R.test(EMAIL_REGEX)

/**
 * 判断是否为手机号
 * @param {string} phone - 要判断的手机号
 * @returns {boolean} 如果手机号是有效的，则返回 true，否则返回 false
 */
export const isPhone = R.test(PHONE_REGEX)

/**
 * 判断是否为身份证号
 * @param {string} idCard - 要判断的身份证号
 * @returns {boolean} 如果身份证号是有效的，则返回 true，否则返 false
 */
export const isIdCard = R.test(ID_CARD_REGEX)

/**
 * 判断是否为URL
 * @param {string} url - 要判断的url
 * @returns {boolean} 如果url是有效的，则返回 true，否则返回 false
 */
export const isUrl = R.test(URL_REGEX)

/**
 * 判断是否为IPv4地址
 * @param {string} ip - 要判断的IP地址
 * @returns {boolean} 如果是有效的IPv4地址，则返回 true，否则返回 false
 */
export const isIpv4 = R.test(IPV4_REGEX)

/**
 * 判断是否为IPv6地址
 * @param {string} ip - 要判断的IP地址
 * @returns {boolean} 如果是有效的IPv6地址，则返回 true，否则返回 false
 */
export const isIpv6 = R.test(IPV6_REGEX)

/**
 * 判断是否为IP地址（IPv4或IPv6）
 * @param {string} ip - 要判断的IP地址
 * @returns {boolean} 如果IP地址是有效的，则返回 true，否则返回 false
 */
export const isIp = (ip: string): boolean => isIpv4(ip) || isIpv6(ip)

/**
 * 判断是否为IP段
 * @param {string} ips - 要判断的IP段
 * @returns {boolean} 如果IP段是有效的，则返回 true，否则返回 false
 */
export const isIps = R.test(IPS_REGEX)

/**
 * 判断端口
 * @param {string} port - 判断端口
 * @returns {boolean} 如果端口是有效的，则返回 true，否则返回 false
 */
export const isPort = R.test(PORT_REGEX)

/**
 * 判断是否为MAC地址
 * @param {string} mac - 要判断的MAC地址
 * @returns {boolean} 如果MAC地址是有效的，则返回 true，否则返回 false
 */
export const isMac = R.test(MAC_REGEX)

/**
 * 判断是否为中文
 * @param {string} str - 要判断的字符串
 * @returns {boolean} 如果字符串是中文，则返回 true，否则返回 false
 */
export const isChinese = R.test(CHINESE_REGEX)

/**
 * 判断是否为域名
 * @param {string} domain - 要判断的域名
 * @returns {boolean} 如果域名是有效的，则返回 true，否则返回 false
 */
export const isDomain = R.test(DOMAIN_REGEX)

/**
 * 判断是否为域名(增强版)
 * @param {string} domain - 要判断的域名，支持国际化域名和更多顶级域名
 * @returns {boolean} 如果域名是有效的，则返回 true，否则返回 false
 */
export const isEnhancedDomain = R.test(ENHANCED_DOMAIN_REGEX)

/**
 * 判断是否为通配符域名
 * @param {string} domain - 要判断的通配符域名
 * @returns {boolean} 如果通配符域名是有效的，则返回 true，否则返回 false
 */
export const isWildcardDomain = R.test(WILDCARD_DOMAIN_REGEX)

/**
 * 判断是否为域名或通配符域名
 * @param {string} domain - 要判断的域名
 * @returns {boolean} 如果域名或通配符域名是有效的，则返回 true，否则返回 false
 */
export const isDomainOrWildcardDomain = (domain: string): boolean => isDomain(domain) || isWildcardDomain(domain)

/**
 * 判断域名组，通过特定字符串分割
 * @param {string} domain - 要判断的域名
 * @param {string} separator - 分割符
 * @returns {boolean} 如果域名组是有效的，则返回 true，否则返回 false
 */
export const isDomainGroup = (domain: string, separator: string = ',') => {
	return R.all(
		R.equals(true),
		R.map(
			(item: string) => isDomain(item) || isWildcardDomain(item) || isEnhancedDomain(item),
			R.split(separator, domain),
		),
	)
}

/* -------------- 2、常用业务操作 -------------- */

/**
 * 手机号加密
 * @param {string} phone - 要加密的手机号
 * @returns {string} 加密后的手机号
 */
export const encryptPhone = (phone: string): string => phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

/**
 * 身份证号加密
 * @param {string} idCard - 要加密的身份证号（18位，最后一位可以是X）
 * @returns {string} 加密后的身份证号
 */
export const encryptIdCard = (idCard: string): string => idCard.replace(/(\d{6})\d{8}([\dXx]{4})/, '$1****$2')

/**
 * 版本号比较
 * @param {string} version1 - 版本号1
 * @param {string} version2 - 版本号2
 * @returns {number} 如果版本号1大于版本号2，则返回1，如果版本号1小于版本号2，则返回-1，如果版本号1等于版本号2，则返回0
 */
export const compareVersion = (version1: string, version2: string): number => {
	// 使用Ramda的pipe函数组合操作
	const parseVersion = R.pipe(
		R.split('.'),
		R.map((v: string) => parseInt(v || '0', 10)),
	)
	const v1 = parseVersion(version1) // 解析版本号1
	const v2 = parseVersion(version2) // 解析版本号2

	// 确保两个数组长度相同
	const len = Math.max(v1.length, v2.length)

	// 使用Ramda的repeat和take函数来填充数组
	const paddedV1 = R.concat(v1, R.repeat(0, len - v1.length))
	const paddedV2 = R.concat(v2, R.repeat(0, len - v2.length))

	// 使用Ramda的zipWith比较每个版本号段
	const comparisons = R.zipWith((a: number, b: number) => (a === b ? 0 : a > b ? 1 : -1), paddedV1, paddedV2)

	// 找到第一个非零的比较结果
	const result = R.find(R.complement(R.equals(0)), comparisons)
	return result ?? 0
}

/**
 * 字节转换
 * @param {number} bytes - 要转换的字节数
 * @param {number} [fixed=2] - 保留小数位数
 * @param {boolean} [isUnit=true] - 是否显示单位
 * @param {string} [endUnit=''] - 指定结束单位，如果指定则转换到该单位为止
 * @returns {string} 转换后的字节数
 */
export const formatBytes = (bytes: number, fixed: number = 2, isUnit: boolean = true, endUnit: string = ''): string => {
	if (bytes === 0) return isUnit ? '0 B' : '0'
	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const c = 1024

	// 使用Ramda的递归函数进行单位转换
	const convert = (value: number, unitIndex: number): string => {
		const unit = units[unitIndex]
		const formattedValue = unitIndex === 0 || fixed === 0 ? Math.round(value).toString() : value.toFixed(fixed)
		// 如果指定了结束单位或者已经是最小单位
		if ((endUnit && unit === endUnit) || value < c || unitIndex >= units.length - 1) {
			return isUnit ? `${formattedValue} ${unit}` : formattedValue
		}
		// 继续转换到下一个单位
		return convert(value / c, unitIndex + 1)
	}
	return convert(bytes, 0)
}

/**
 * 柯里化版本的formatBytes
 * @param {number} bytes - 要转换的字节数
 * @param {number} [fixed=2] - 保留小数位数
 * @param {boolean} [isUnit=true] - 是否显示单位
 * @param {string} [endUnit=''] - 指定结束单位，如果指定则转换到该单位为止
 * @returns {string} 转换后的字节数
 */
export const formatBytesCurried: {
	(bytes: number, fixed: number, isUnit: boolean, endUnit: string): string
	(bytes: number): (fixed?: number, isUnit?: boolean, endUnit?: string) => string
	(bytes: number, fixed: number): (isUnit?: boolean, endUnit?: string) => string
	(bytes: number, fixed: number, isUnit: boolean): (endUnit?: string) => string
} = R.curry(formatBytes)

/**
 * 分页字符串转换
 * @param {string} page - 分页字符串
 * @returns {string} 转换后的分页字符串
 */
export const formatPage = (page: string): number => {
	const newPage = page.match(/class='Pcount'>共([0-9]*)条</)
	if (isArray(newPage) && newPage.length >= 2) return Number(newPage[1])
	return 0
}

/* -------------- 3、代理函数 -------------- */

export type ProxyConfig = {
	requestTime: number
	requestToken: string
	request_time: number
	request_token: string
}

/**
 * 代理配置，仅在开发环境生效
 * @param {string} proxyKey - 代理密钥
 * @param {string} usage 使用场景 "query" | "params"
 * @returns {Object} 返回对象包含 request_time 和 request_token
 */
export const getProxyConfig = async (proxyKey: string, usage: 'query' | 'params' = 'params') => {
	const md5 = await import('md5')
	const request_time = Date.now()
	const request_token = md5.default(String(request_time).concat(md5.default(proxyKey)))
	if (usage === 'params') {
		return { request_time, request_token, requestTime: request_time, requestToken: request_token }
	}
	return `request_time=${request_time}&request_token=${request_token}`
}

/** -------------- 4、接口缓存配置 -------------- */

/**
 * 接口缓存配置
 * @param {function} method - 接口请求方法
 * @param {string} params - 接口请求参数
 * @param {Record<string, any>} options - 接口请求配置
 * @returns {string} 返回数据
 */
export const getCacheConfig = (method: Function, params: string, options: Record<string, any> = {}) => {
	console.log(method, params, options)
}
