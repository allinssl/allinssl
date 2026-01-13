import { Utils } from '../src/utils/index.js'

describe('Utils Extended Features', () => {
	describe('chunkArray', () => {
		it('应该正确分块数组', () => {
			const array = [1, 2, 3, 4, 5, 6, 7]
			const size = 3
			const chunks = Utils.chunkArray(array, size)

			expect(chunks).toHaveLength(3)
			expect(chunks[0]).toEqual([1, 2, 3])
			expect(chunks[1]).toEqual([4, 5, 6])
			expect(chunks[2]).toEqual([7])
		})

		it('处理空数组', () => {
			const chunks = Utils.chunkArray([], 2)
			expect(chunks).toHaveLength(0)
		})
	})

	describe('delay', () => {
		it('应该延迟执行指定时间', async () => {
			const start = Date.now()
			await Utils.delay(100)
			const duration = Date.now() - start

			expect(duration).toBeGreaterThanOrEqual(100)
		})
	})

	describe('extractChineseTexts', () => {
		it('应该正确提取中文内容', () => {
			const content = `
        $t('你好世界')
        $t("测试文本")
        $t('Hello World')
      `
			const templateRegex = /\$t\(['"]([^'"]+)['"]\)/g

			const texts = Utils.extractChineseTexts(content, templateRegex)
			expect(texts.size).toBe(2)
			expect(texts.has('你好世界')).toBe(true)
			expect(texts.has('测试文本')).toBe(true)
			expect(texts.has('Hello World')).toBe(false)
		})
	})

	describe('mergeTranslations', () => {
		it('应该正确合并翻译结果', () => {
			const target = {
				key1: 'old value 1',
				key2: 'old value 2',
			}
			const source = {
				key1: 'new value 1',
				key3: 'new value 3',
			}

			const result = Utils.mergeTranslations(target, source)
			expect(result).toEqual({
				key1: 'new value 1',
				key2: 'old value 2',
				key3: 'new value 3',
			})
		})
	})

	describe('isValidLanguageCode', () => {
		it('应该验证语言代码格式', () => {
			expect(Utils.isValidLanguageCode('zhCN')).toBe(true)
			expect(Utils.isValidLanguageCode('enUS')).toBe(true)
			expect(Utils.isValidLanguageCode('zh-CN')).toBe(false)
			expect(Utils.isValidLanguageCode('123')).toBe(false)
		})
	})

	describe('formatError', () => {
		it('应该正确格式化错误信息', () => {
			const error = new Error('测试错误')
			const formatted = Utils.formatError(error)

			expect(formatted).toHaveProperty('message', '测试错误')
			expect(formatted).toHaveProperty('stack')
			expect(formatted).toHaveProperty('timestamp')
			expect(new Date(formatted.timestamp)).toBeInstanceOf(Date)
		})
	})

	describe('generateId', () => {
		it('应该生成唯一的标识符', () => {
			const id1 = Utils.generateId()
			const id2 = Utils.generateId()

			expect(id1).toMatch(/^translation_\d+$/)
			expect(id2).toMatch(/^translation_\d+$/)
			expect(id1).not.toBe(id2)
		})
	})
})
