import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTitle } from '../src/title'
import { nextTick } from 'vue'
describe('useTitle', () => {
	const originalTitle = document.title
	beforeEach(() => {
		// 每个测试前重置标题
		document.title = originalTitle
	})
	afterEach(() => {
		// 每个测试后恢复原始标题
		document.title = originalTitle
	})
	it('应该设置初始标题', async () => {
		useTitle('新标题')
		await nextTick()
		expect(document.title).toBe('新标题')
	})
	it('应该响应式更新标题', async () => {
		const title = useTitle('初始标题')
		await nextTick()
		expect(document.title).toBe('初始标题')
		title.value = '更新的标题'
		await nextTick()
		expect(document.title).toBe('更新的标题')
	})
	it('应该能处理空标题', async () => {
		useTitle('')
		await nextTick()
		expect(document.title).toBe('')
	})
	it('应该能处理特殊字符', async () => {
		const specialTitle = '特殊 & 字符 < > " \''
		useTitle(specialTitle)
		await nextTick()
		expect(document.title).toBe(specialTitle)
	})
	it('应该在不同组件之间共享标题', async () => {
		// 模拟第一个组件
		const title1 = useTitle('组件1标题')
		await nextTick()
		expect(document.title).toBe('组件1标题')
		// 模拟第二个组件
		const title2 = useTitle('组件2标题')
		await nextTick()
		expect(document.title).toBe('组件2标题')
		// 第一个组件更新标题
		title1.value = '组件1更新标题'
		await nextTick()
		expect(document.title).toBe('组件1更新标题')
		// 第二个组件更新标题
		title2.value = '组件2更新标题'
		await nextTick()
		expect(document.title).toBe('组件2更新标题')
	})
})
//# sourceMappingURL=title.spec.js.map
