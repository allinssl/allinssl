import { Utils } from '../src/utils/index.js'

describe('Utils', () => {
	describe('isChineseText', () => {
		it('应该正确识别中文文本', () => {
			expect(Utils.isChineseText('你好')).toBe(true)
			expect(Utils.isChineseText('Hello')).toBe(false)
			expect(Utils.isChineseText('Hello 你好')).toBe(true)
		})
	})

	describe('validateConfig', () => {
		it('应该验证配置对象', () => {
			const validConfig = {
				apiKey: { zhipuAI: 'test-key' },
				languages: ['zhCN', 'enUS'],
				concurrency: 10,
				interval: 1000,
			}

			const errors = Utils.validateConfig(validConfig)
			expect(errors).toHaveLength(0)
		})

		it('应该检测无效的配置', () => {
			const invalidConfig = {
				apiKey: 'invalid',
				languages: ['invalid'],
				concurrency: -1,
				interval: 'invalid',
			}

			const errors = Utils.validateConfig(invalidConfig)
			expect(errors.length).toBeGreaterThan(0)
		})
	})

	describe('parseLanguageCode', () => {
		it('应该正确解析语言代码', () => {
			const result = Utils.parseLanguageCode('zhCN')
			expect(result).toEqual({
				language: 'zh',
				region: 'CN',
			})
		})
	})

	describe('formatTranslations', () => {
		it('应该正确格式化翻译结果', () => {
			const translations = {
				hello: ' Hello World ',
				welcome: ' 欢迎 ',
			}

			const formatted = Utils.formatTranslations(translations)
			expect(formatted).toEqual({
				hello: 'Hello World',
				welcome: '欢迎',
			})
		})
	})
})
