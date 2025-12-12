/**
 * 文件定义：数据类型检查
 */

import * as R from 'ramda'

// =============== 1. 数据类型检查 ===============

/**
 * 检查值是否为数字
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是数字，则返回 true，否则返回 false
 */
export const isNumber = R.is(Number) as (value: unknown) => value is number

/**
 * 检查值是否为字符串
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是字符串，则返回 true，否则返回 false
 */
export const isString = R.is(String) as (value: unknown) => value is string

/**
 * 检查值是否为对象
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是对象，则返回 true，否则返回 false
 */
export const isObject = R.both(R.is(Object), R.complement(R.is(Array))) as (value: unknown) => value is object

/**
 * 检查是否为布尔值
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是布尔值，则返回 true，否则返回 false
 */
export const isBoolean = R.is(Boolean) as (value: unknown) => value is boolean

/**
 * 检查值是否为数组
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是数组，则返回 true，否则返回 false
 */
export const isArray = R.is(Array) as (value: unknown) => value is any[]

/**
 * 检查是否为Porime函数
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是Porime函数，则返回 true，否则返回 false
 */
export const isPromise = R.is(Promise) as (value: unknown) => value is Promise<unknown>

/**
 * 检查是否为函数
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是函数，则返回 true，否则返回 false
 */
export const isFunction = R.is(Function) as (value: unknown) => value is Function

/**
 * 检查是否为正则表达式
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是正则表达式，则返回 true，否则返回 false
 */
export const isRegExp = R.is(RegExp) as (value: unknown) => value is RegExp

/**
 * 检查是否为日期
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是日期，则返回 true，否则返回 false
 */
export const isDate = R.is(Date) as unknown as (value: unknown) => value is Date

/**
 * 检查是否为null(和undefined区分)
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是null，则返回 true，否则返回 false
 */
export const isNull = R.isNil as (value: unknown) => value is null

/**
 * 检查是否为undefined
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是undefined，则返回 true，否则返回 false
 */
export const isUndefined = R.isNil as (value: unknown) => value is undefined

/**
 * 检查值是否为空（'', [], {}）,排除null和undefined
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是空，则返回 true，否则返回 false
 */
export const isEmpty = R.both(R.complement(R.isNil), R.isEmpty) as (value: unknown) => value is '' | any[] | object

/* 获取值的类型
 * @param {any} value - 要获取类型的值
 * @returns {string} 值的类型
 */
export const getType = R.type as (value: unknown) => string

/**
 * 检查值是否为指定类型
 * @param {string} type - 要检查的类型
 * @param {any} value - 要检查的值
 * @returns {boolean} 如果值是指定类型，则返回 true，否则返回 false
 */
export const isType = R.curry((type: string, value: unknown) => R.equals(getType(value), type)) as <T>(
	type: string,
	value: unknown,
) => value is T
