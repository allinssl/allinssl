import { jest } from '@jest/globals'
import { promises as fs } from 'fs'
import path from 'path'
import { LogManager } from '../src/logManagement/index.js'

jest.mock('fs', () => ({
	promises: {
		mkdir: jest.fn(),
		appendFile: jest.fn(),
		readFile: jest.fn(),
		readdir: jest.fn(),
		stat: jest.fn(),
		unlink: jest.fn(),
	},
}))

describe('LogManager', () => {
	const options = {
		logPath: './test-logs',
		errorLogFile: 'error.log',
		infoLogFile: 'info.log',
	}
	let logManager

	beforeEach(() => {
		logManager = new LogManager(options)
		jest.clearAllMocks()
	})

	describe('init', () => {
		it('应该创建日志目录', async () => {
			await logManager.init()
			expect(fs.mkdir).toHaveBeenCalledWith(options.logPath, { recursive: true })
		})

		it('处理创建目录失败的情况', async () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation()
			fs.mkdir.mockRejectedValueOnce(new Error('创建目录失败'))

			await logManager.init()
			expect(consoleError).toHaveBeenCalled()
			consoleError.mockRestore()
		})
	})

	describe('logError', () => {
		it('应该写入错误日志', async () => {
			const error = new Error('测试错误')
			await logManager.logError(error)

			expect(fs.appendFile).toHaveBeenCalledWith(
				expect.stringContaining('error.log'),
				expect.stringContaining('测试错误'),
			)
		})

		it('处理写入错误日志失败的情况', async () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation()
			fs.appendFile.mockRejectedValueOnce(new Error('写入失败'))

			await logManager.logError(new Error('测试错误'))
			expect(consoleError).toHaveBeenCalled()
			consoleError.mockRestore()
		})
	})

	describe('logInfo', () => {
		it('应该写入信息日志', async () => {
			const message = '测试信息'
			await logManager.logInfo(message)

			expect(fs.appendFile).toHaveBeenCalledWith(expect.stringContaining('info.log'), expect.stringContaining(message))
		})

		it('处理写入信息日志失败的情况', async () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation()
			fs.appendFile.mockRejectedValueOnce(new Error('写入失败'))

			await logManager.logInfo('测试信息')
			expect(consoleError).toHaveBeenCalled()
			consoleError.mockRestore()
		})
	})

	describe('cleanLogs', () => {
		it('应该删除过期的日志文件', async () => {
			const now = Date.now()
			const oldDate = now - 7 * 24 * 60 * 60 * 1000 - 1000 // 7天+1秒前

			fs.readdir.mockResolvedValueOnce(['old.log', 'new.log'])
			fs.stat.mockImplementation((path) => {
				return Promise.resolve({
					mtimeMs: path.includes('old') ? oldDate : now,
				})
			})

			await logManager.cleanLogs(7)

			expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('old.log'))
			expect(fs.unlink).not.toHaveBeenCalledWith(expect.stringContaining('new.log'))
		})

		it('处理清理日志失败的情况', async () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation()
			fs.readdir.mockRejectedValueOnce(new Error('读取目录失败'))

			await logManager.cleanLogs(7)
			expect(consoleError).toHaveBeenCalled()
			consoleError.mockRestore()
		})
	})

	describe('getLogs', () => {
		it('应该返回指定数量的日志行', async () => {
			const logContent = '行1\n行2\n行3\n行4\n行5'
			fs.readFile.mockResolvedValueOnce(logContent)

			const lines = await logManager.getLogs('info', 3)
			expect(lines).toHaveLength(3)
			expect(lines[2]).toBe('行5')
		})

		it('处理读取日志失败的情况', async () => {
			const consoleError = jest.spyOn(console, 'error').mockImplementation()
			fs.readFile.mockRejectedValueOnce(new Error('读取文件失败'))

			const lines = await logManager.getLogs('error', 5)
			expect(lines).toHaveLength(0)
			expect(consoleError).toHaveBeenCalled()
			consoleError.mockRestore()
		})
	})
})
