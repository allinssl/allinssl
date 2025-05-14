/**
 * 文件定义：数据处理方法
 * 包含：1、数据类型检查。2、数据转换。3、日期处理。4、数据校验。5、数据过滤与重组。6、特殊场景处理
 */

import * as R from 'ramda'

// ===============  数据转换 ===============

/**
 * 将对象的所有值转换为字符串
 * @param {Record<string, any>} obj - 要转换的对象
 * @returns {Record<string, string>} 转换后的对象
 */
export const objectToString = R.map(String)

/**
 * 将数组转换为对象，使用指定的 key
 * @param {string} key - 要转换的 key
 * @param {Record<string, any>[]} array - 要转换的数组
 * @returns {Record<string, Record<string, any>>} 转换后的对象
 */
export const arrayToObject = R.curry((key: string, array: Record<string, any>[]) => R.indexBy(R.prop(key), array)) as <
	T extends Record<string, any>,
>(
	key: string,
	array: T[],
) => Record<string, T>

/**
 * 深度扁平化对象（建议深度嵌套的对象使用）
 * @param {Record<string, any>} obj - 要扁平化的对象
 * @returns {Record<string, any>} 扁平化后的对象
 */
export const flattenObject = (obj: Record<string, unknown>): Record<string, unknown> => {
	const result: Record<string, unknown> = {}

	const flatten = (obj: Record<string, any>, prefix: string = '') => {
		for (const key in obj) {
			const value = obj[key]
			const newKey = prefix ? `${prefix}.${key}` : key
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				flatten(value, newKey)
			} else {
				result[newKey] = value
			}
		}
	}

	flatten(obj)
	return result
}

/**
 * 验证字符串是否符合正则表达式
 * @param {RegExp} pattern - 要验证的正则表达式
 * @param {string} str - 要验证的字符串
 * @returns {boolean} 如果字符串符合正则表达式，则返回 true，否则返回 false
 */
export const matchesPattern = R.curry((pattern: RegExp, str: string) => R.test(pattern, str)) as <T extends RegExp>(
	pattern: T,
	str: string,
) => boolean

/**
 * 验证对象是否包含所有必需的键
 * @param {Record<string, any>} obj - 要验证的对象
 * @param {string[]} requiredKeys - 要验证的键
 * @returns {boolean} 如果对象包含所有必需的键，则返回 true，否则返回 false
 */
export const hasRequiredKeys = R.curry((obj: Record<string, unknown>, requiredKeys: string[]) =>
	R.all(R.flip(R.has)(obj), requiredKeys),
) as {
	(obj: Record<string, unknown>): (requiredKeys: string[]) => boolean
	(obj: Record<string, unknown>, requiredKeys: string[]): boolean
}

// ... existing code ...
/**
 * 验证值是否在指定范围内
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} value - 要验证的值
 * @returns {boolean} 如果值在指定范围内，则返回 true，否则返回 false
 */
export const isInRange = R.curry((min: number, max: number, value: number) =>
	R.both(R.gte(R.__, min), R.lte(R.__, max))(value),
) as <T extends number>(min: T, max: T, value: T) => boolean

// =============== 数据过滤与重组 ===============

/**
 * 根据条件过滤对象的属性
 * @param {Function} predicate - 要过滤的条件
 * @param {Record<string, any>} obj - 要过滤的对象
 * @returns {Record<string, any>} 过滤后的对象
 */
export const filterObject = R.curry(
	<T extends Record<string, any>>(predicate: (value: T[keyof T]) => boolean, obj: T) =>
		Object.fromEntries(Object.entries(obj).filter(([_, value]) => predicate(value))),
) as {
	<T extends Record<string, any>>(predicate: (value: T[keyof T]) => boolean): (obj: T) => Partial<T>
	<T extends Record<string, any>>(predicate: (value: T[keyof T]) => boolean, obj: T): Partial<T>
}

/**
 * 按照指定的键对数组进行分组
 * @param {string} key - 要分组的键
 * @param {Record<string, any>[]} array - 要分组的数组
 * @returns {Record<string, Record<string, any>[]>} 分组后的对象
 */
export const groupByKey = R.curry(<T extends Record<string, any>>(key: string, array: T[]) =>
	R.groupBy(R.prop(key), array),
) as <T extends Record<string, any>>(key: string, array: T[]) => Record<string, T[]>

/**
 * 从对象数组中提取指定的键值
 * @param {string[]} path - 要提取的键
 * @param {Record<string, any>[]} list - 要提取的对象数组
 * @returns {Record<string, any>[]} 提取后的对象数组
 */
export const pluckDeep = R.curry(<T>(path: string[], list: T[]) => R.map(R.path(path), list)) as <
	T extends Record<string, any>,
>(
	path: string[],
	list: T[],
) => T[]

/**
 * 对嵌套数组进行扁平化和去重
 * @param {any[]} array - 要扁平化和去重的数组
 * @returns {any[]} 扁平化和去重后的数组
 */
export const flattenAndUniq = R.pipe(R.flatten, R.uniq) as <T>(array: T[]) => T[]

// ===============  数据映射 ===============
type MapperOption = {
	inherit?: string[] // 继承字段
	deep?: boolean // 深度映射
	ignore?: string[] // 忽略字段
}

type MapperType = [string, string][] | Record<string, string>
type DataType = Record<string, unknown> | Record<string, unknown>[]

/**
 * 对象/数组映射，根据映射表，将数组或对象映射为新的对象和数组
 * 支持继承/过滤，通过参数继承/过滤，选取自己需要的数据
 * 增加异常处理，如果值不存在，则抛出异常。
 * 返回新的对象/数组
 */
export const mapData = (mapper: MapperType, data: DataType, options: MapperOption = { deep: true }): DataType => {
	const { inherit, deep, ignore } = options

	// 验证 inherit 和 ignore 不能同时使用
	if (inherit && ignore) {
		throw new Error('inherit 和 ignore 选项不能同时使用')
	}

	// 将 mapper 转换为对象形式
	const mapperObj = Array.isArray(mapper)
		? mapper.reduce<Record<string, string>>((acc, [key, value]) => ({ ...acc, [key]: value }), {})
		: mapper

	// 处理数组
	if (Array.isArray(data)) {
		return data.map((item) => mapData(mapperObj, item, options) as Record<string, unknown>)
	}

	// 处理对象
	if (typeof data === 'object' && data !== null) {
		// 根据选项过滤 mapper
		let finalMapper = { ...mapperObj }
		if (inherit) {
			finalMapper = Object.entries(mapperObj)
				.filter(([key]) => inherit.includes(key))
				.reduce<Record<string, string>>((acc, [key, value]) => ({ ...acc, [key]: value }), {})
		} else if (ignore) {
			finalMapper = Object.entries(mapperObj)
				.filter(([key]) => !ignore.includes(key))
				.reduce<Record<string, string>>((acc, [key, value]) => ({ ...acc, [key]: value }), {})
		}

		return Object.entries(finalMapper).reduce<Record<string, unknown>>((result, [sourceKey, targetKey]) => {
			// 处理嵌套路径
			const value = sourceKey.split('.').reduce<unknown>((obj, key) => {
				if (obj === undefined || obj === null) {
					throw new Error(`映射键 "${sourceKey}" 不存在于源数据中`)
				}
				return (obj as Record<string, unknown>)[key]
			}, data)

			// 处理值不存在的情况
			if (value === undefined) {
				throw new Error(`映射键 "${sourceKey}" 的值不存在`)
			}

			// 处理深度映射
			if (deep && typeof value === 'object' && value !== null) {
				const nestedMapper = Object.entries(mapperObj)
					.filter(([key]) => key.startsWith(`${sourceKey}.`))
					.reduce<Record<string, string>>(
						(acc, [key, val]) => ({
							...acc,
							[key.slice(sourceKey.length + 1)]: val,
						}),
						{},
					)

				if (Object.keys(nestedMapper).length > 0) {
					return {
						...result,
						[targetKey]: mapData(nestedMapper, value as Record<string, unknown>, options),
					}
				}
			}

			// 处理嵌套目标路径
			const targetPath = (targetKey as string).split('.')
			const finalKey = targetPath.pop()!
			const targetObj = targetPath.reduce<Record<string, unknown>>((obj, key) => {
				if (!(key in obj)) {
					obj[key] = {}
				}
				return obj[key] as Record<string, unknown>
			}, result)

			if (finalKey && targetObj) {
				targetObj[finalKey] = value
			}

			return result
		}, {})
	}

	return data
}

/**
 * @description 生成映射表，将所有字段转换为小驼峰
 * @param {Record<string, unknown>} obj - 要转换的对象
 * @returns {Record<string, unknown>} 转换后的对象
 */
export const generateMapper = (obj: Record<string, unknown>) => {
	return Object.entries(obj).map(([key, value]) => [
		key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
		value,
	])
}

/**
 * 将对象转换为查询字符串
 * @param {Record<string, any>} obj - 要转换的对象
 * @returns {string} 转换后的查询字符串
 */
export const objectToQueryString = (obj: Record<string, any>) => {
	return Object.entries(obj)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join('&')
}


/**
 * 深度合并两个对象
 * @param {Record<string, any>} target - 目标对象
 * @param {Record<string, any>} source - 源对象
 * @returns {Record<string, any>} 合并后的对象
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: T, isMergeArray: boolean = true): T => {
	const result = { ...target } as T

	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			const sourceValue = source[key]
			const targetValue = target[key]

			if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
				// 如果是数组，则合并数组
				result[key] = (isMergeArray ? [...targetValue, ...sourceValue] : sourceValue) as T[Extract<keyof T, string>]
			} else if (isObject(sourceValue) && isObject(targetValue)) {
				// 如果是对象，则递归合并
				result[key] = deepMerge(targetValue, sourceValue) as T[Extract<keyof T, string>]
			} else {
				// 其他情况直接覆盖
				result[key] = sourceValue as T[Extract<keyof T, string>]
			}
		}
	}

	return result
}

/**
 * 判断是否为对象
 * @param {any} value - 要判断的值
 * @returns {boolean} 是否为对象
 */
const isObject = (value: any): boolean => {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
}


/**
 * @description 清理对象前后字符串
 * @param {Record<string, any>} obj - 要清理的对象
 * @returns {Record<string, any>} 清理后的对象
 */
export const trimObject = (obj: Record<string, any>) => {
	return Object.entries(obj).reduce<Record<string, any>>((acc, [key, value]) => {
		acc[key.trim()] = value.trim()
		return acc
	}, {})
}


/**
 * 深拷贝对象（简单版）
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export const deepClone = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj))
}


