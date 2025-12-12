import { promises as fs } from 'fs'
import path from 'path'
import { Utils } from '../utils/index.js'

export class LogManager {
	constructor(options = {}) {
		const { logPath = './logs', errorLogFile = 'error.log', infoLogFile = 'info.log' } = options

		this.logPath = logPath
		this.errorLogFile = path.join(logPath, errorLogFile)
		this.infoLogFile = path.join(logPath, infoLogFile)
	}

	/**
	 * 初始化日志目录
	 */
	async init() {
		try {
			await fs.mkdir(this.logPath, { recursive: true })
		} catch (error) {
			console.error('初始化日志目录失败:', error)
		}
	}

	/**
	 * 记录错误日志
	 * @param {Error} error - 错误对象
	 */
	async logError(error) {
		try {
			const formattedError = Utils.formatError(error)
			const logEntry = `[${formattedError.timestamp}] ERROR: ${formattedError.message}\n${formattedError.stack}\n\n`
			await fs.appendFile(this.errorLogFile, logEntry)
		} catch (err) {
			console.error('写入错误日志失败:', err)
		}
	}

	/**
	 * 记录信息日志
	 * @param {string} message - 日志信息
	 */
	async logInfo(message) {
		try {
			const timestamp = new Date().toISOString()
			const logEntry = `[${timestamp}] INFO: ${message}\n`
			await fs.appendFile(this.infoLogFile, logEntry)
		} catch (error) {
			console.error('写入信息日志失败:', error)
		}
	}

	/**
	 * 清理过期日志
	 * @param {number} days - 保留天数
	 */
	async cleanLogs(days) {
		try {
			const now = Date.now()
			const files = await fs.readdir(this.logPath)

			for (const file of files) {
				const filePath = path.join(this.logPath, file)
				const stats = await fs.stat(filePath)
				const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24)

				if (age > days) {
					await fs.unlink(filePath)
					await this.logInfo(`已删除过期日志文件: ${file}`)
				}
			}
		} catch (error) {
			console.error('清理日志失败:', error)
		}
	}

	/**
	 * 获取日志内容
	 * @param {string} logType - 日志类型 ('error' | 'info')
	 * @param {number} lines - 返回的行数
	 * @returns {Promise<string[]>}
	 */
	async getLogs(logType, lines) {
		try {
			const logFile = logType === 'error' ? this.errorLogFile : this.infoLogFile
			const content = await fs.readFile(logFile, 'utf8')
			return content.split('\n').slice(-lines)
		} catch (error) {
			console.error('读取日志失败:', error)
			return []
		}
	}
}

export default LogManager
