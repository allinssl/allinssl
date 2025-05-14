#!/usr/bin/env node

import { vitePluginI18nAiTranslate } from '../index.js'
import { FileOperation } from '../fileOperation/index.js'
import path from 'path'
import minimist from 'minimist'

/**
 * CLI工具：清理未使用的翻译
 *
 * 使用方法：
 * node cleanup.js --config=<配置文件路径>
 */
async function cleanup() {
	try {
		// 解析命令行参数
		const argv = minimist(process.argv.slice(2))

		// 显示帮助信息
		if (argv.help || argv.h) {
			console.log(`
未使用翻译清理工具

选项:
  --config, -c    指定配置文件路径 (默认: ./i18n.config.js)
  --verbose, -v   显示详细日志
  --help, -h      显示帮助信息
      `)
			process.exit(0)
		}

		// 获取配置文件路径
		const configPath = argv.config || argv.c || './i18n.config.js'
		const verbose = argv.verbose || argv.v || false

		console.log(`[i18n清理工具] 正在加载配置文件: ${configPath}`)

		// 动态导入配置文件
		let config
		try {
			const configModule = await import(path.resolve(process.cwd(), configPath))
			config = configModule.default
		} catch (error) {
			console.error(`[i18n清理工具] 加载配置文件失败: ${error.message}`)
			console.log('[i18n清理工具] 使用默认配置...')
			// 使用默认配置
			config = {}
		}

		console.log('[i18n清理工具] 初始化插件...')
		const plugin = vitePluginI18nAiTranslate(config)

		// 确保初始化缓存
		await plugin.configResolved()

		// 获取要扫描的文件
		const fileOperation = new FileOperation()
		const globFiles = config.fileExtensions?.map((ext) => `**/*${ext}`) || [
			'**/*.js',
			'**/*.jsx',
			'**/*.ts',
			'**/*.tsx',
			'**/*.vue',
		]

		console.log(`[i18n清理工具] 扫描文件中...`)
		const files = await fileOperation.scanFiles(globFiles, config.projectPath || process.cwd())

		if (verbose) {
			console.log(`[i18n清理工具] 找到 ${files.length} 个文件需要扫描`)
		}

		console.log('[i18n清理工具] 开始检查和清理未使用的翻译...')
		const result = await plugin.cleanupUnusedTranslations(files)

		console.log(`[i18n清理工具] 完成! 已移除 ${result.removedCount} 个未使用的翻译`)
	} catch (error) {
		console.error(`[i18n清理工具] 发生错误:`, error)
		process.exit(1)
	}
}

// 执行清理
cleanup()
