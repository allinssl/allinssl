import { describe, it, expect } from 'vitest'
import * as typeUtils from '../src/type'

describe('类型检查工具函数测试', () => {
	describe('基础类型检查', () => {
		it('应当正确检查数字类型', () => {
			expect(typeUtils.isNumber(123)).toBe(true)
			expect(typeUtils.isNumber('123')).toBe(false)
			expect(typeUtils.isNumber(NaN)).toBe(true)
			expect(typeUtils.isNumber(Infinity)).toBe(true)
		})

		it('应当正确检查字符串类型', () => {
			expect(typeUtils.isString('test')).toBe(true)
			expect(typeUtils.isString(123)).toBe(false)
			expect(typeUtils.isString('')).toBe(true)
		})

		it('应当正确检查对象类型', () => {
			expect(typeUtils.isObject({})).toBe(true)
			expect(typeUtils.isObject([])).toBe(false)
			expect(typeUtils.isObject(null)).toBe(false)
		})

		it('应当正确检查布尔类型', () => {
			expect(typeUtils.isBoolean(true)).toBe(true)
			expect(typeUtils.isBoolean(false)).toBe(true)
			expect(typeUtils.isBoolean(1)).toBe(false)
		})

		it('应当正确检查数组类型', () => {
			expect(typeUtils.isArray([])).toBe(true)
			expect(typeUtils.isArray([1, 2, 3])).toBe(true)
			expect(typeUtils.isArray({})).toBe(false)
		})
	})

	describe('特殊类型检查', () => {
		it('应当正确检查Promise类型', () => {
			expect(typeUtils.isPromise(Promise.resolve())).toBe(true)
			expect(typeUtils.isPromise({})).toBe(false)
		})

		it('应当正确检查函数类型', () => {
			expect(typeUtils.isFunction(() => {})).toBe(true)
			expect(typeUtils.isFunction(function () {})).toBe(true)
			expect(typeUtils.isFunction({})).toBe(false)
		})

		it('应当正确检查正则表达式类型', () => {
			expect(typeUtils.isRegExp(/test/)).toBe(true)
			expect(typeUtils.isRegExp(new RegExp('test'))).toBe(true)
			expect(typeUtils.isRegExp({})).toBe(false)
		})

		it('应当正确检查日期类型', () => {
			expect(typeUtils.isDate(new Date())).toBe(true)
			expect(typeUtils.isDate('2024-02-27')).toBe(false)
		})
	})

	describe('空值检查', () => {
		it('应当正确检查null值', () => {
			expect(typeUtils.isNull(null)).toBe(true)
			expect(typeUtils.isNull(undefined)).toBe(true)
			expect(typeUtils.isNull(0)).toBe(false)
		})

		it('应当正确检查undefined值', () => {
			expect(typeUtils.isUndefined(undefined)).toBe(true)
			expect(typeUtils.isUndefined(null)).toBe(true)
			expect(typeUtils.isUndefined(0)).toBe(false)
		})

		it('应当正确检查空值', () => {
			expect(typeUtils.isEmpty('')).toBe(true)
			expect(typeUtils.isEmpty([])).toBe(true)
			expect(typeUtils.isEmpty({})).toBe(true)
			expect(typeUtils.isEmpty('test')).toBe(false)
			expect(typeUtils.isEmpty([1])).toBe(false)
			expect(typeUtils.isEmpty({ key: 'value' })).toBe(false)
		})
	})

	describe('类型获取和比较', () => {
		it('应当正确获取值的类型', () => {
			expect(typeUtils.getType(123)).toBe('Number')
			expect(typeUtils.getType('test')).toBe('String')
			expect(typeUtils.getType(true)).toBe('Boolean')
			expect(typeUtils.getType([])).toBe('Array')
			expect(typeUtils.getType({})).toBe('Object')
		})

		it('应当正确检查指定类型', () => {
			expect(typeUtils.isType('Number', 123)).toBe(true)
			expect(typeUtils.isType('String', 'test')).toBe(true)
			expect(typeUtils.isType('Boolean', true)).toBe(true)
			expect(typeUtils.isType('Array', [])).toBe(true)
			expect(typeUtils.isType('Object', {})).toBe(true)
		})
	})
})
