# vite-plugin-i18n-ai-translate

一个基于Vite的i18n自动化翻译插件，支持智谱AI等多种翻译服务。

## 特性

- 支持智谱AI和传统API多种翻译服务
- 自动扫描并提取vue-i18n的$t模板变量中的中文内容
- 并发翻译处理，提高效率
- 智能缓存机制，避免重复翻译
- 完善的错误处理和重试机制
- 支持文件变更监听，实时翻译
- 可扩展的翻译适配器设计

## 安装

```bash
npm install vite-plugin-i18n-ai-translate
```

## 配置

在vite.config.js中配置插件：

```javascript
import i18nAiTranslate from 'vite-plugin-i18n-ai-translate'

export default {
	plugins: [
		i18nAiTranslate({
			apiKey: {
				zhipuAI: 'your-zhipu-api-key',
				api1: 'your-api1-key',
			},
			languages: ['zhCN', 'zhTW', 'enUS', 'jaJP', 'koKR'],
			translateMethod: 'zhipuAI',
			// 其他配置项...
		}),
	],
}
```

## 配置选项

| 配置项          | 类型     | 默认值                                   | 说明                |
| --------------- | -------- | ---------------------------------------- | ------------------- |
| projectPath     | string   | './src'                                  | 项目扫描路径        |
| outputPath      | string   | './locales'                              | 翻译文件输出路径    |
| cachePath       | string   | './cache/translation_cache.json'         | 缓存文件路径        |
| logPath         | string   | './logs'                                 | 日志文件路径        |
| apiKey          | object   | {}                                       | 各翻译服务的API密钥 |
| languages       | string[] | ['zhCN', 'zhTW', 'enUS', 'jaJP', 'koKR'] | 目标语言列表        |
| concurrency     | number   | 100                                      | 并发翻译数量        |
| templateRegex   | string   | '\$t\\(["\']([\u4e00-\u9fa5]+)["\']\\)'  | 模板变量正则表达式  |
| fileExtensions  | string[] | ['.vue', '.js', '.ts']                   | 扫描的文件类型      |
| interval        | number   | 5000                                     | 文件监听间隔(ms)    |
| requestInterval | number   | 100                                      | 请求间隔时间(ms)    |
| maxRetries      | number   | 3                                        | 最大重试次数        |
| translateMethod | string   | 'zhipuAI'                                | 使用的翻译服务      |
| cacheLifetime   | number   | 7                                        | 缓存保留天数        |
| logRetention    | number   | 30                                       | 日志保留天数        |

## 工作流程

1. 扫描项目文件，提取需要翻译的中文文本
2. 检查翻译缓存，跳过已翻译内容
3. 使用配置的翻译服务进行并发翻译
4. 更新翻译缓存
5. 生成翻译文件
6. 监听文件变更，触发实时翻译

## 支持的翻译服务

- 智谱AI翻译服务

  - 支持多语言批量翻译
  - 基于GLM大语言模型
  - 高质量翻译结果

- 传统API翻译服务
  - 可扩展的适配器设计
  - 支持添加自定义翻译服务

## API 参考

### 核心类

#### TranslationAdapter

翻译适配器基类，定义统一的翻译接口。

方法：

- translate(text, apiKey, languages, maxRetries)
- validateApiKey(apiKey)
- getSupportedLanguages()
- isLanguageSupported(language)

#### CacheManager

缓存管理类，处理翻译结果的缓存。

方法：

- initCache()
- getCachedTranslations(texts, languages)
- updateCache(texts, translations, languages)
- cleanCache(validTexts)

#### LogManager

日志管理类，处理系统日志。

方法：

- init()
- logError(error)
- logInfo(message)
- cleanLogs(days)
- getLogs(logType, lines)

## 错误处理

插件包含完善的错误处理机制：

- 翻译失败自动重试
- 详细的错误日志记录
- 可配置的最大重试次数
- 翻译服务异常处理
- API密钥验证

## 开发扩展

### 添加新的翻译服务

1. 在 src/translation/traditional 或 src/translation/ai 目录下创建新的翻译服务模块
2. 实现必要的翻译接口
3. 创建对应的适配器类
4. 在配置中添加新的翻译方法

### 自定义适配器示例

```javascript
const TranslationAdapter = require('./index')

class CustomAdapter extends TranslationAdapter {
	async translate(text, apiKey, languages, maxRetries) {
		// 实现翻译逻辑
	}

	async validateApiKey(apiKey) {
		// 实现密钥验证
	}

	getSupportedLanguages() {
		// 返回支持的语言列表
	}
}
```

## 常见问题

1. 翻译服务不可用

   - 检查API密钥是否正确
   - 确认网络连接正常
   - 查看错误日志获取详细信息

2. 翻译缓存问题

   - 检查缓存文件权限
   - 适当调整缓存保留时间
   - 可以手动清理缓存目录

3. 文件监听不生效
   - 确认配置的文件扩展名正确
   - 检查监听间隔设置
   - 验证文件路径配置

## License

MIT License
