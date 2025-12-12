import { describe, it, expect } from 'vitest'
import * as stringUtils from '../src/string'

describe('字符串处理工具函数测试', () => {
	describe('urlToObject', () => {
		it('应当正确解析URL参数', () => {
			const url = 'https://example.com/path?name=test&age=25&type=user'
			const result = stringUtils.urlToObject(url)
			expect(result).toEqual({
				name: 'test',
				age: '25',
				type: 'user',
			})
		})

		it('应当正确处理空参数', () => {
			const url = 'https://example.com/path'
			const result = stringUtils.urlToObject(url)
			expect(result).toEqual({})
		})

		it('应当正确处理特殊字符', () => {
			const url = 'https://example.com/path?name=test%20name&email=test%40example.com'
			const result = stringUtils.urlToObject(url)
			expect(result).toEqual({
				name: 'test name',
				email: 'test@example.com',
			})
		})
	})

	describe('htmlEscape', () => {
		it('应当正确转义HTML字符', () => {
			const html = '<div class="test">Hello & World</div>'
			const escaped = stringUtils.htmlEscape(html)
			expect(escaped).toBe('&lt;div class=&quot;test&quot;&gt;Hello &amp; World&lt;/div&gt;')
		})

		it('应当正确反转义HTML字符', () => {
			const escaped = '&lt;div class=&quot;test&quot;&gt;Hello &amp; World&lt;/div&gt;'
			const unescaped = stringUtils.htmlEscape(escaped, true)
			expect(unescaped).toBe('<div class="test">Hello & World</div>')
		})
	})

	describe('驼峰和下划线转换', () => {
		describe('camelToUnderline', () => {
			it('应当正确将小驼峰转换为下划线', () => {
				expect(stringUtils.camelToUnderline('userName')).toBe('user_name')
				expect(stringUtils.camelToUnderline('userFirstName')).toBe('user_first_name')
			})
		})

		describe('underlineToCamel', () => {
			it('应当正确将下划线转换为小驼峰', () => {
				expect(stringUtils.underlineToCamel('user_name')).toBe('userName')
				expect(stringUtils.underlineToCamel('user_first_name')).toBe('userFirstName')
			})
		})

		describe('underlineToBigCamel', () => {
			it('应当正确将下划线转换为大驼峰', () => {
				expect(stringUtils.underlineToBigCamel('user_name')).toBe('userName')
				expect(stringUtils.underlineToBigCamel('user_first_name')).toBe('userFirstName')
			})
		})

		describe('bigCamelToUnderline', () => {
			it('应当正确将大驼峰转换为下划线', () => {
				expect(stringUtils.bigCamelToUnderline('UserName')).toBe('_user_name')
				expect(stringUtils.bigCamelToUnderline('UserFirstName')).toBe('_user_first_name')
			})
		})
	})
})
