import { jest } from '@jest/globals'
import { TranslationAdapter } from '../src/translation/adapter/index.js'
import { AIBatchAdapter } from '../src/translation/adapter/aiBatchAdapter.js'
import { TraditionalApiAdapter } from '../src/translation/adapter/traditionalApiAdapter.js'
import { ZhipuAITranslator } from '../src/translation/ai/zhipuAI.js'
import * as api1 from '../src/translation/traditional/api1.js'

describe('翻译适配器测试', () => {
	describe('TranslationAdapter基类', () => {
		it('不应该允许直接实例化抽象基类', () => {
			expect(() => new TranslationAdapter()).toThrow('翻译适配器：抽象类不能被直接实例化')
		})
	})

	describe('AI批量翻译适配器', () => {
		const adapter = new AIBatchAdapter()
		const text = '你好'
		const apiKey = 'test-key'
		const languages = ['enUS', 'jaJP']
		const maxRetries = 3

		it('应该实现translate方法', () => {
			expect(typeof adapter.translate).toBe('function')
		})

		it('应该正确处理翻译失败和重试机制', async () => {
			const mockTranslate = jest
				.spyOn(ZhipuAITranslator.prototype, 'translate')
				.mockRejectedValueOnce(new Error('API调用失败'))
				.mockResolvedValueOnce({
					text,
					translations: {
						enUS: 'Hello',
						jaJP: 'こんにちは',
					},
				})

			const result = await adapter.translate(text, apiKey, languages, maxRetries)
			expect(mockTranslate).toHaveBeenCalledTimes(2)
			expect(result.translations.enUS).toBe('Hello')
			expect(result.translations.jaJP).toBe('こんにちは')
		})
	})

	describe('传统API翻译适配器', () => {
		const adapter = new TraditionalApiAdapter(api1)

		it('应该验证API模块的有效性', () => {
			expect(() => new TraditionalApiAdapter()).toThrow('传统API适配器：无效的API模块')
		})

		it('应该能够获取支持的语言列表', () => {
			const supportedLanguages = adapter.getSupportedLanguages()
			expect(Array.isArray(supportedLanguages)).toBe(true)
			expect(supportedLanguages.length).toBeGreaterThan(0)
		})

		it('应该正确处理不支持的语言', async () => {
			const text = '你好'
			const apiKey = 'test-key'
			const languages = ['invalidLang']
			const maxRetries = 3

			await expect(adapter.translate(text, apiKey, languages, maxRetries)).rejects.toThrow(
				'传统API适配器：不支持的目标语言',
			)
		})
	})
})
