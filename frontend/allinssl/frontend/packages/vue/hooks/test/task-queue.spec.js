import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick, reactive, computed } from 'vue'
import useTaskQueue from '../src/task-queue'
import { mount } from '@vue/test-utils'
describe('useTaskQueue', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.restoreAllMocks()
		vi.useRealTimers()
	})
	it('应该添加任务到队列', async () => {
		const { addTask, taskList } = useTaskQueue()
		const task1 = vi.fn().mockResolvedValue('任务1结果')
		const task2 = vi.fn().mockResolvedValue('任务2结果')
		addTask('task1', task1)
		addTask('task2', task2)
		// 验证任务列表
		expect(taskList.value.length).toBe(2)
		expect(taskList.value[0].name).toBe('task1')
		expect(taskList.value[1].name).toBe('task2')
	})
	it('应该按顺序处理任务队列', async () => {
		const { addTask, processQueue, isProcessing } = useTaskQueue()
		const order = []
		const task1 = vi.fn().mockImplementation(async () => {
			order.push('task1')
			return '任务1结果'
		})
		const task2 = vi.fn().mockImplementation(async () => {
			order.push('task2')
			return '任务2结果'
		})
		const task3 = vi.fn().mockImplementation(async () => {
			order.push('task3')
			return '任务3结果'
		})
		// 添加任务
		addTask('task1', task1)
		addTask('task2', task2)
		addTask('task3', task3)
		// 开始处理队列
		const processPromise = processQueue()
		// 验证正在处理状态
		expect(isProcessing.value).toBe(true)
		// 解析所有Promise
		await processPromise
		// 验证所有任务都已执行
		expect(task1).toHaveBeenCalledTimes(1)
		expect(task2).toHaveBeenCalledTimes(1)
		expect(task3).toHaveBeenCalledTimes(1)
		// 验证执行顺序
		expect(order).toEqual(['task1', 'task2', 'task3'])
		// 验证处理完成后状态更新
		expect(isProcessing.value).toBe(false)
	})
	it('应该能够获取任务状态', async () => {
		const { addTask, processQueue, getTaskStatus } = useTaskQueue()
		const task = vi.fn().mockResolvedValue('任务结果')
		// 添加任务
		addTask('testTask', task)
		// 检查初始状态
		const status = getTaskStatus('testTask')
		expect(status.value.status).toBe(false)
		expect(status.value.result).toBe(null)
		expect(status.value.error).toBe(null)
		// 处理队列
		await processQueue()
		// 验证状态更新
		expect(status.value.status).toBe(true)
		expect(status.value.result).toBe('任务结果')
		expect(status.value.error).toBe(null)
	})
	it('应该能够获取任务结果', async () => {
		const { addTask, processQueue, getTaskResult } = useTaskQueue()
		const task = vi.fn().mockResolvedValue('任务结果')
		// 添加任务
		addTask('testTask', task)
		// 处理队列
		await processQueue()
		// 获取结果
		const result = await getTaskResult('testTask')
		expect(result).toBe('任务结果')
	})
	it('当任务失败时应该记录错误', async () => {
		const { addTask, processQueue, getTaskStatus } = useTaskQueue()
		const error = new Error('任务失败')
		const task = vi.fn().mockRejectedValue(error)
		// 添加任务
		addTask('failingTask', task)
		// 处理队列
		await processQueue()
		// 验证错误被记录
		const status = getTaskStatus('failingTask')
		expect(status.value.status).toBe(false)
		expect(status.value.error).toBe(error)
	})
	it('应该能够清除所有任务', async () => {
		const { addTask, clearAllTasks, taskList } = useTaskQueue()
		// 添加任务
		addTask('task1', vi.fn())
		addTask('task2', vi.fn())
		expect(taskList.value.length).toBe(2)
		// 清除任务
		clearAllTasks()
		// 验证任务已清除
		expect(taskList.value.length).toBe(0)
	})
	it('应该渲染加载组件', async () => {
		const { addTask, TaskQueueLoader, processQueue } = useTaskQueue()
		// 添加一个长时间运行的任务
		const longTask = () => new Promise((resolve) => setTimeout(() => resolve('完成'), 1000))
		addTask('longTask', longTask)
		// 挂载加载组件
		const wrapper = mount(TaskQueueLoader, {
			slots: {
				default: '<div>加载中...</div>',
			},
		})
		// 初始时不显示内容（没有开始处理）
		expect(wrapper.html()).not.toContain('加载中...')
		// 开始处理队列
		const processPromise = processQueue()
		await nextTick()
		// 加载中时显示内容
		expect(wrapper.html()).toContain('加载中...')
		// 完成任务
		vi.advanceTimersByTime(1000)
		await processPromise
		await nextTick()
		// 验证加载组件消失
		expect(wrapper.html()).not.toContain('加载中...')
	})
	it('任务应该返回Promise', async () => {
		const { addTask, processQueue } = useTaskQueue()
		const taskFn = vi.fn().mockResolvedValue('任务结果')
		// 添加任务并获取Promise
		const taskPromise = addTask('promiseTask', taskFn)
		// 验证返回的是Promise
		expect(taskPromise).toBeInstanceOf(Promise)
		// 等待处理队列
		processQueue()
		// 解析Promise
		const result = await taskPromise
		expect(result).toBe('任务结果')
	})
	it('应该拒绝无效的任务', async () => {
		const { addTask } = useTaskQueue()
		// 没有任务名称
		await expect(addTask('', vi.fn())).rejects.toThrow('任务名称和函数不能为空')
		// 没有任务函数
		// @ts-ignore - 测试不合法的输入
		await expect(addTask('emptyTask', null)).rejects.toThrow('任务名称和函数不能为空')
	})
	it('应该处理任务依赖关系', async () => {
		const { addTask, processQueue } = useTaskQueue()
		const order = []
		const results = {}
		// 创建依赖任务
		const task1 = vi.fn().mockImplementation(async () => {
			order.push('task1')
			return 'task1结果'
		})
		// 依赖task1结果的任务
		const task2 = vi.fn().mockImplementation(async (task1Result) => {
			order.push('task2')
			return `${task1Result} -> task2结果`
		})
		// 依赖task2结果的任务
		const task3 = vi.fn().mockImplementation(async (task2Result) => {
			order.push('task3')
			return `${task2Result} -> task3结果`
		})
		// 添加任务并建立依赖关系
		const task1Promise = addTask('task1', task1)
		task1Promise.then((result) => {
			results.task1 = result
			addTask('task2', () => task2(result))
		})
		// 开始处理
		await processQueue()
		// 添加第三个任务，依赖第二个任务
		await addTask('task2', () => task2(results.task1))
		// 运行第二个任务
		await processQueue()
		// 等待task2结果
		const task2Result = await getTaskResult('task2')
		results.task2 = task2Result
		// 添加第三个任务
		await addTask('task3', () => task3(results.task2))
		// 运行第三个任务
		await processQueue()
		// 验证执行顺序
		expect(order).toEqual(['task1', 'task2', 'task3'])
		// 验证任务结果正确传递
		expect(results.task1).toBe('task1结果')
		expect(results.task2).toBe('task1结果 -> task2结果')
		expect(await getTaskResult('task3')).toBe('task1结果 -> task2结果 -> task3结果')
	})
	it('应该支持查询特定任务', async () => {
		const { addTask, processQueue, findTask } = useTaskQueue()
		addTask('task1', vi.fn().mockResolvedValue('任务1结果'))
		addTask('task2', vi.fn().mockResolvedValue('任务2结果'))
		const foundTask = findTask('task2')
		expect(foundTask).toBeTruthy()
		expect(foundTask?.name).toBe('task2')
		// 查询不存在的任务
		const nonExistingTask = findTask('non-existing')
		expect(nonExistingTask).toBeUndefined()
	})
	it('应该支持任务优先级', async () => {
		const { addTask, processQueue } = useTaskQueue()
		const executionOrder = []
		// 添加普通任务
		addTask('normalTask', async () => {
			executionOrder.push('normalTask')
			return 'normal'
		})
		// 添加高优先级任务
		addTask(
			'highPriorityTask',
			async () => {
				executionOrder.push('highPriorityTask')
				return 'high'
			},
			{ priority: 10 },
		)
		// 添加低优先级任务
		addTask(
			'lowPriorityTask',
			async () => {
				executionOrder.push('lowPriorityTask')
				return 'low'
			},
			{ priority: -5 },
		)
		// 处理队列
		await processQueue()
		// 验证执行顺序按优先级
		expect(executionOrder).toEqual(['highPriorityTask', 'normalTask', 'lowPriorityTask'])
	})
	it('应该支持外部管理的响应式任务列表', async () => {
		// 创建外部的响应式任务列表
		const externalTasks = reactive([
			{ name: 'externalTask1', fn: vi.fn().mockResolvedValue('外部任务1结果') },
			{ name: 'externalTask2', fn: vi.fn().mockResolvedValue('外部任务2结果') },
		])
		// 创建任务队列，使用外部的任务列表
		const { processQueue, getTaskResult } = useTaskQueue({
			tasks: computed(() => externalTasks),
		})
		// 处理队列
		await processQueue()
		// 验证任务执行
		expect(externalTasks[0].fn).toHaveBeenCalled()
		expect(externalTasks[1].fn).toHaveBeenCalled()
		// 验证结果
		const result1 = await getTaskResult('externalTask1')
		const result2 = await getTaskResult('externalTask2')
		expect(result1).toBe('外部任务1结果')
		expect(result2).toBe('外部任务2结果')
		// 添加新任务到外部列表
		externalTasks.push({
			name: 'externalTask3',
			fn: vi.fn().mockResolvedValue('外部任务3结果'),
		})
		// 再次处理队列
		await processQueue()
		// 验证新任务被执行
		expect(externalTasks[2].fn).toHaveBeenCalled()
		const result3 = await getTaskResult('externalTask3')
		expect(result3).toBe('外部任务3结果')
	})
})
//# sourceMappingURL=task-queue.spec.js.map
