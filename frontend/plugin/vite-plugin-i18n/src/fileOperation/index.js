import { promises as fs } from 'fs'
import path from 'path'
import fastGlob from 'fast-glob'
import config from '../config/config.js'

export class FileOperation {
	/**
	 * 创建文件
	 * @param {string} filePath - 文件路径
	 * @param {string} content - 文件内容
	 */
	async createFile(filePath, content) {
		try {
			const dir = path.dirname(filePath)
			await fs.mkdir(dir, { recursive: true })
			await fs.writeFile(filePath, content)
		} catch (error) {
			throw new Error(`创建文件失败: ${error.message}`)
		}
	}

	/**
	 * 修改文件
	 * @param {string} filePath - 文件路径
	 * @param {string} newContent - 新的文件内容
	 */
	async modifyFile(filePath, newContent) {
		try {
			await fs.writeFile(filePath, newContent)
		} catch (error) {
			throw new Error(`修改文件失败: ${error.message}`)
		}
	}

	/**
	 * 复制文件
	 * @param {string} sourcePath - 源文件路径
	 * @param {string} destinationPath - 目标文件路径
	 */
	async copyFile(sourcePath, destinationPath) {
		try {
			const dir = path.dirname(destinationPath)
			await fs.mkdir(dir, { recursive: true })
			await fs.copyFile(sourcePath, destinationPath)
		} catch (error) {
			throw new Error(`复制文件失败: ${error.message}`)
		}
	}

	/**
	 * 读取文件
	 * @param {string} filePath - 文件路径
	 * @returns {Promise<string>} - 文件内容
	 */
	async readFile(filePath) {
		try {
			return await fs.readFile(filePath, 'utf8')
		} catch (error) {
			throw new Error(`读取文件失败: ${error.message}`)
		}
	}

	/**
	 * 创建目录
	 * @param {string} dirPath - 目录路径
	 */
	async createDirectory(dirPath) {
		try {
			await fs.mkdir(dirPath, { recursive: true })
		} catch (error) {
			throw new Error(`创建目录失败: ${error.message}`)
		}
	}

	/**
	 * 生成翻译文件
	 * @param {string} outputPath - 输出路径
	 * @param {Object} translations - 翻译结果
	 * @param {string} language - 目标语言
	 */
	async generateTranslationFile(outputPath, translations, language) {
		try {
			const filePath = path.join(outputPath, `${language}${config.createFileExt}`)
			const dir = path.dirname(filePath)
			await fs.mkdir(dir, { recursive: true }) // 确保目录存在
			let content = {}
			Object.assign(content, translations)
			content = `${JSON.stringify(content, null, 2)}`
			await fs.writeFile(filePath, content)
		} catch (error) {
			throw new Error(`生成翻译文件失败: ${error.message}`)
		}
	}

	/**
	 * 使用 glob 模式扫描文件内容
	 * @param {string} pattern - glob 匹配模式
	 * @param {string} basePath - 基础路径
	 * @returns {Promise<Array<{path: string, content: string}>>} - 匹配文件的路径和内容
	 */
	async scanFiles(pattern, basePath = process.cwd()) {
		try {
			const files = await fastGlob(pattern, { cwd: basePath })
			const results = files.map((file) => {
				return path.join(basePath, file)
			})
			return results
		} catch (error) {
			throw new Error(`扫描文件失败: ${error.message}`)
		}
	}

	/**
	 * 检查文件是否存在
	 * @param {string} filePath - 文件路径
	 * @returns {Promise<boolean>}
	 */
	async fileExists(filePath) {
		try {
			await fs.access(filePath)
			return true
		} catch {
			return false
		}
	}
}

export default FileOperation
