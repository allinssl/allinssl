import { describe, it, expect } from 'vitest'
import * as dataUtils from '../src/data'

describe('数据处理工具函数测试', () => {
	describe('数据转换', () => {
		describe('objectToString', () => {
			it('应当正确将对象值转换为字符串', () => {
				const input = { a: 1, b: true, c: null }
				const expected = { a: '1', b: 'true', c: 'null' }
				expect(dataUtils.objectToString(input)).toEqual(expected)
			})
		})

		describe('arrayToObject', () => {
			it('应当正确将数组转换为对象', () => {
				const input = [
					{ id: '1', name: 'test1' },
					{ id: '2', name: 'test2' },
				]
				const expected = {
					'1': { id: '1', name: 'test1' },
					'2': { id: '2', name: 'test2' },
				}
				expect(dataUtils.arrayToObject('id', input)).toEqual(expected)
			})
		})

		describe('flattenObject', () => {
			it('应当正确扁平化对象', () => {
				const input = {
					a: 1,
					b: {
						c: 2,
						d: {
							e: 3,
						},
					},
				}
				const expected = {
					a: 1,
					'b.c': 2,
					'b.d.e': 3,
				}
				console.log('dataUtils.flattenObject(input)', dataUtils.flattenObject(input))
				expect(dataUtils.flattenObject(input)).toEqual(expected)
			})
		})
	})

	describe('数据验证', () => {
		describe('matchesPattern', () => {
			it('应当正确验证正则表达式', () => {
				const pattern = /^test\d+$/
				expect(dataUtils.matchesPattern(pattern, 'test123')).toBe(true)
				expect(dataUtils.matchesPattern(pattern, 'test')).toBe(false)
			})
		})

		describe('hasRequiredKeys', () => {
			it('应当正确验证必需的键', () => {
				const obj = { a: 1, b: 2, c: 3 }
				expect(dataUtils.hasRequiredKeys(obj, ['a', 'b'])).toBe(true)
				expect(dataUtils.hasRequiredKeys(obj, ['a', 'd'])).toBe(false)
			})
		})

		describe('isInRange', () => {
			it('应当正确验证值是否在范围内', () => {
				expect(dataUtils.isInRange(1, 10, 5)).toBe(true)
				expect(dataUtils.isInRange(1, 10, 0)).toBe(false)
				expect(dataUtils.isInRange(1, 10, 11)).toBe(false)
			})
		})
	})

	describe('数据过滤与重组', () => {
		describe('filterObject', () => {
			it('应当正确过滤对象的属性', () => {
				const input = { a: 1, b: null, c: undefined, d: 'test' }
				const expected = { a: 1, d: 'test' }
				expect(dataUtils.filterObject((value) => value != null, input)).toEqual(expected)
			})
		})

		describe('groupByKey', () => {
			it('应当正确按键对数组进行分组', () => {
				const input = [
					{ type: 'A', value: 1 },
					{ type: 'B', value: 2 },
					{ type: 'A', value: 3 },
				]
				const expected = {
					A: [
						{ type: 'A', value: 1 },
						{ type: 'A', value: 3 },
					],
					B: [{ type: 'B', value: 2 }],
				}
				expect(dataUtils.groupByKey('type', input)).toEqual(expected)
			})
		})

		describe('pluckDeep', () => {
			it('应当正确提取深层属性', () => {
				const input = [{ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }]
				expect(dataUtils.pluckDeep(['a', 'b', 'c'], input)).toEqual([1, 2])
			})
		})

		describe('flattenAndUniq', () => {
			it('应当正确扁平化和去重数组', () => {
				const input = [
					[1, 2],
					[2, 3],
					[3, 4],
				]
				expect(dataUtils.flattenAndUniq(input)).toEqual([1, 2, 3, 4])
			})
		})
	})
})
