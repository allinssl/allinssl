/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import { ref, reactive, watch, type Ref, defineComponent } from 'vue'

// 定义任务状态类型
interface TaskStatus<T = any> {
	result: T | null
	status: boolean
	error?: Error | null
}

// 定义任务接口
interface Task<T = any> {
	fn: () => Promise<T>
	name: string
	status: boolean
}

// 定义任务队列接口
export interface TaskQueuePromise<T> {
	addTask: <T>(taskName: string, taskFn: () => Promise<T>) => Promise<T>
	getTaskStatus: <T>(taskName: string) => Ref<TaskStatus<T>>
	getTaskResult: <T>(taskName: string) => Promise<T>
	processQueue: () => Promise<void>
	clearAllTasks: () => void
	isProcessing: Ref<boolean>
	TaskQueueLoader: ReturnType<typeof defineComponent>
}

// 使用 hooks 改写任务队列
export default function useTaskQueue<T>(): TaskQueuePromise<T> {
	const taskList = ref<Task[]>([])
	const taskResults = reactive<Record<string, TaskStatus>>({})
	const isProcessing = ref(false)

	/**
	 * 添加任务到队列
	 */
	const addTask = <T,>(taskName: string, taskFn: () => Promise<T>): Promise<T> => {
		if (!taskName || !taskFn) {
			return Promise.reject(new Error('任务名称和函数不能为空'))
		}
		return new Promise((resolve, reject) => {
			// 初始化任务状态
			taskResults[taskName] = { result: null, status: false, error: null }
			taskList.value.push({
				name: taskName,
				fn: async () => {
					try {
						const result = await taskFn()
						taskResults[taskName] = { result, status: true, error: null }
						resolve(result)
						return result
					} catch (error) {
						const taskError = error instanceof Error ? error : new Error(String(error))
						taskResults[taskName] = { result: null, status: true, error: taskError }
						reject(taskError)
						throw taskError
					}
				},
				status: false,
			})
			startProcessing()
		})
	}

	/**
	 * 获取任务状态
	 */
	const getTaskStatus = <T,>(taskName: string): Ref<TaskStatus<T>> => {
		if (!taskResults[taskName]) {
			throw new Error(`任务 "${taskName}" 不存在`)
		}
		return ref(taskResults[taskName]) as Ref<TaskStatus<T>>
	}

	/**
	 * 获取任务结果
	 */
	const getTaskResult = <T,>(taskName: string): Promise<T> => {
		return new Promise((resolve, reject) => {
			const status = getTaskStatus<T>(taskName)
			if (status.value.status) {
				status.value.error ? reject(status.value.error) : resolve(status.value.result as T)
				return
			}
			watch(
				() => status.value,
				(newStatus) => {
					if (newStatus.status) {
						newStatus.error ? reject(newStatus.error) : resolve(newStatus.result as T)
					}
				},
				{ deep: true },
			)
		})
	}

	/**
	 * 处理任务队列中的任务
	 */
	const processQueue = async (): Promise<void> => {
		if (taskList.value.length === 0) {
			isProcessing.value = false
			return
		}
		const taskIndex = taskList.value.findIndex((task) => !task.status)
		if (taskIndex === -1) return
		const task = taskList.value[taskIndex] || { status: false, name: '', fn: () => {} } // 获取未处理的任务
		try {
			task.status = true
			await task.fn()
			taskList.value.splice(taskIndex, 1)
		} catch (error) {
			console.error(`任务 "${task.name}" 执行失败:`, error)
			task.status = false
		}
		await processQueue()
	}

	/**
	 * 清除所有任务和任务状态
	 */
	const clearAllTasks = (): void => {
		taskList.value = []
		for (const key in taskResults) delete taskResults[key]
		isProcessing.value = false
	}

	/**
	 * 内部方法：启动任务处理
	 */
	const startProcessing = (): void => {
		if (!isProcessing.value) {
			isProcessing.value = true
			processQueue()
		}
	}

	// 合并加载组件：根据任务队列处理状态展示加载提示
	const TaskQueueLoader = defineComponent({
		name: 'TaskQueueLoader',
		setup(_, { slots }) {
			const { isProcessing } = useTaskQueue()
			return () => (
				<div>
					{isProcessing.value && <div class="loading-indicator">加载中...</div>}
					<div>{slots.default ? slots.default() : null}</div>
				</div>
			)
		},
	})

	return { addTask, getTaskStatus, getTaskResult, processQueue, clearAllTasks, isProcessing, TaskQueueLoader }
}
