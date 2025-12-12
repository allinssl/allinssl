import { jest } from '@jest/globals'
import axios from 'axios'
import { ZhipuAITranslator } from '../src/translation/ai/zhipuAI.js'

jest.mock('axios')

describe('ZhipuAITranslator', () => {
	const apiKey = 'test-key'
	let translator

	beforeEach(() => {
		translator = new ZhipuAITranslator(apiKey)
		jest.clearAllMocks()
	})

	describe('generatePrompt', () => {
		it('应该生成正确的提示词', () => {
			const text = '你好'
			const languages = ['enUS', 'jaJP']

			const prompt = translator.generatePrompt(text, languages)
			expect(prompt).toContain('请将以下文本翻译成')
			expect(prompt).toContain('en-US, ja-JP')
			expect(prompt).toContain(text)
		})
	})

	describe('translate', () => {
		const text = '你好'
		const languages = ['enUS', 'jaJP']

		it('应该成功调用API并返回翻译结果', async () => {
			const mockResponse = {
				data: {
					choices: [
						{
							message: {
								content: JSON.stringify({
									'en-US': 'Hello',
									'ja-JP': 'こんにちは',
								}),
							},
						},
					],
				},
			}

			axios.post.mockResolvedValueOnce(mockResponse)

			const result = await translator.translate(text, languages)

			expect(axios.post).toHaveBeenCalledWith(
				expect.stringContaining('/chatglm_turbo'),
				expect.any(Object),
				expect.objectContaining({
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				}),
			)

			expect(result).toEqual({
				text: '你好',
				translations: {
					enUS: 'Hello',
					jaJP: 'こんにちは',
				},
			})
		})

		it('处理API调用失败的情况', async () => {
			axios.post.mockRejectedValueOnce(new Error('API调用失败'))

			await expect(translator.translate(text, languages)).rejects.toThrow('智谱AI翻译失败')
		})

		it('处理无效的API响应', async () => {
			const mockResponse = {
				data: {},
			}

			axios.post.mockResolvedValueOnce(mockResponse)

			await expect(translator.translate(text, languages)).rejects.toThrow('无效的API响应')
		})
	})

	describe('validateApiKey', () => {
		it('应该成功验证有效的API密钥', async () => {
			axios.get.mockResolvedValueOnce({})

			const isValid = await translator.validateApiKey()
			expect(isValid).toBe(true)
			expect(axios.get).toHaveBeenCalledWith(
				expect.stringContaining('/validate'),
				expect.objectContaining({
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				}),
			)
		})

		it('处理无效的API密钥', async () => {
			axios.get.mockRejectedValueOnce(new Error('无效的密钥'))

			const isValid = await translator.validateApiKey()
			expect(isValid).toBe(false)
		})
	})
})
