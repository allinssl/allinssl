import { describe, it, expect } from 'vitest'
import * as randomUtils from '../src/random'

describe('随机数生成工具函数测试', () => {
	describe('randomInt', () => {
		it('应当生成指定范围内的随机整数', () => {
			const min = 1
			const max = 10
			for (let i = 0; i < 100; i++) {
				const result = randomUtils.randomInt(min, max)
				expect(result).toBeGreaterThanOrEqual(min)
				expect(result).toBeLessThanOrEqual(max)
				expect(Number.isInteger(result)).toBe(true)
			}
		})

		it('应当正确处理最小值等于最大值的情况', () => {
			const value = 5
			expect(randomUtils.randomInt(value, value)).toBe(value)
		})
	})

	describe('randomChart', () => {
		it('应当生成指定长度的随机字符串', () => {
			const length = 32
			const result = randomUtils.randomChart(length)
			expect(result.length).toBe(length)
		})

		it('应当正确处理不同选项', () => {
			// 只包含特殊字符
			const specialOnly = randomUtils.randomChart(10, {
				isSpecial: true,
				isLower: false,
				isUpper: false,
				isNumber: false,
			})
			expect(specialOnly).toMatch(/^[!@#$%^&*?]+$/)

			// 只包含小写字母
			const lowerOnly = randomUtils.randomChart(10, {
				isSpecial: false,
				isLower: true,
				isUpper: false,
				isNumber: false,
			})
			expect(lowerOnly).toMatch(/^[a-z]+$/)

			// 只包含大写字母
			const upperOnly = randomUtils.randomChart(10, {
				isSpecial: false,
				isLower: false,
				isUpper: true,
				isNumber: false,
			})
			expect(upperOnly).toMatch(/^[A-Z]+$/)

			// 只包含数字
			const numberOnly = randomUtils.randomChart(10, {
				isSpecial: false,
				isLower: false,
				isUpper: false,
				isNumber: true,
			})
			expect(numberOnly).toMatch(/^[0-9]+$/)
		})
	})

	describe('randomChartWithMinLength', () => {
		it('应当生成包含最小长度要求的随机字符串', () => {
			const length = 32
			const options = {
				minUpper: 5,
				minLower: 5,
				minNumber: 5,
				minSpecial: 2,
			}
			const result = randomUtils.randomChartWithMinLength(length, options)

			expect(result.length).toBe(length)
			expect(result.match(/[A-Z]/g)?.length).toBeGreaterThanOrEqual(options.minUpper)
			expect(result.match(/[a-z]/g)?.length).toBeGreaterThanOrEqual(options.minLower)
			expect(result.match(/[0-9]/g)?.length).toBeGreaterThanOrEqual(options.minNumber)
			expect(result.match(/[!@#$%^&*?]/g)?.length).toBeGreaterThanOrEqual(options.minSpecial)
		})

		it('当最小长度要求总和超过指定长度时应当抛出错误', () => {
			const length = 10
			const options = {
				minUpper: 4,
				minLower: 4,
				minNumber: 4,
				minSpecial: 4,
			}
			expect(() => randomUtils.randomChartWithMinLength(length, options)).toThrow()
		})

		it('应当生成不同的随机字符串', () => {
			const length = 32
			const options = { minUpper: 1, minLower: 1, minNumber: 1, minSpecial: 0 }
			const result1 = randomUtils.randomChartWithMinLength(length, options)
			const result2 = randomUtils.randomChartWithMinLength(length, options)
			expect(result1).not.toBe(result2)
		})
	})
})
