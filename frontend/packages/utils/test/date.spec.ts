import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as dateUtils from '../src/date'

describe('日期处理工具函数测试', () => {
	describe('formatDate', () => {
		it('应当正确格式化日期字符串', () => {
			const date = new Date('2024-02-27 14:30:45')
			expect(dateUtils.formatDate(date)).toBe('2024-02-27 14:30:45')
			expect(dateUtils.formatDate(date, 'YYYY-MM-DD')).toBe('2024-02-27')
			expect(dateUtils.formatDate(date, 'HH:mm:ss')).toBe('14:30:45')
		})

		it('应当正确处理单位数的月日时分秒', () => {
			const date = new Date('2024-01-05 09:05:08')
			expect(dateUtils.formatDate(date)).toBe('2024-01-05 09:05:08')
		})
	})

	describe('getDaysDiff', () => {
		it('应当正确计算两个日期之间的天数差', () => {
			const start = new Date('2024-02-27')
			const end = new Date('2024-03-01')
			expect(dateUtils.getDaysDiff(start, end)).toBe(3)
		})

		it('应当正确处理同一天的情况', () => {
			const date = new Date('2024-02-27')
			expect(dateUtils.getDaysDiff(date, date)).toBe(0)
		})
	})

	describe('isDateInRange', () => {
		it('应当正确判断日期是否在范围内', () => {
			const start = new Date('2024-02-01')
			const end = new Date('2024-02-29')
			const date = new Date('2024-02-15')
			expect(dateUtils.isDateInRange(date, start, end)).toBe(true)
		})

		it('应当正确处理边界情况', () => {
			const start = new Date('2024-02-01')
			const end = new Date('2024-02-29')
			expect(dateUtils.isDateInRange(start, start, end)).toBe(true)
			expect(dateUtils.isDateInRange(end, start, end)).toBe(true)
		})

		it('应当正确处理范围外的情况', () => {
			const start = new Date('2024-02-01')
			const end = new Date('2024-02-29')
			const before = new Date('2024-01-31')
			const after = new Date('2024-03-01')
			expect(dateUtils.isDateInRange(before, start, end)).toBe(false)
			expect(dateUtils.isDateInRange(after, start, end)).toBe(false)
		})
	})

	describe('getStartOfDay和getEndOfDay', () => {
		it('应当正确获取一天的开始时间', () => {
			const date = new Date('2024-02-27 14:30:45')
			const start = dateUtils.getStartOfDay(date)
			expect(start.getHours()).toBe(0)
			expect(start.getMinutes()).toBe(0)
			expect(start.getSeconds()).toBe(0)
		})

		it('应当正确获取一天的结束时间', () => {
			const date = new Date('2024-02-27 14:30:45')
			const end = dateUtils.getEndOfDay(date)
			expect(end.getHours()).toBe(23)
			expect(end.getMinutes()).toBe(59)
			expect(end.getSeconds()).toBe(59)
		})
	})

	describe('addDays', () => {
		it('应当正确添加天数', () => {
			const date = new Date('2024-02-27')
			expect(dateUtils.addDays(1, date).toDateString()).toBe(new Date('2024-02-28').toDateString())
			expect(dateUtils.addDays(-1, date).toDateString()).toBe(new Date('2024-02-26').toDateString())
		})
	})

	describe('formatRelativeTime', () => {
		beforeEach(() => {
			// 固定当前时间为2024-02-27 14:30:00
			vi.useFakeTimers()
			vi.setSystemTime(new Date('2024-02-27 14:30:00'))
		})

		afterEach(() => {
			vi.useRealTimers()
		})

		it('应当正确格式化相对时间', () => {
			expect(dateUtils.formatRelativeTime(new Date('2024-02-27 14:29:30'))).toBe('刚刚')
			expect(dateUtils.formatRelativeTime(new Date('2024-02-27 14:25:00'))).toBe('5分钟前')
			expect(dateUtils.formatRelativeTime(new Date('2024-02-27 13:30:00'))).toBe('1小时前')
			expect(dateUtils.formatRelativeTime(new Date('2024-02-26 14:30:00'))).toBe('1天前')
			expect(dateUtils.formatRelativeTime(new Date('2024-01-27 14:30:00'))).toBe('2024-01-27')
		})
	})

	describe('getDayOfWeek', () => {
		it('应当正确获取星期几', () => {
			expect(dateUtils.getDayOfWeek(new Date('2024-02-27'))).toBe('星期二')
			expect(dateUtils.getDayOfWeek(new Date('2024-02-25'))).toBe('星期日')
		})
	})

	describe('getDaysUntilExpiration', () => {
		it('应当正确计算到期天数', () => {
			const current = new Date('2024-02-27')
			const future = new Date('2024-03-01')
			expect(dateUtils.getDaysUntilExpiration(current, future)).toBe('3天')
		})

		it('应当正确处理已过期情况', () => {
			const current = new Date('2024-02-27')
			const past = new Date('2024-02-26')
			expect(dateUtils.getDaysUntilExpiration(current, past)).toBe('已过期')
		})
	})
})
