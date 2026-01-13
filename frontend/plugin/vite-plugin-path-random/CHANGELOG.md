# Changelog

本文档记录了 @baota/vite-plugin-random-cache 的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2024-01-20

### 新增
- 🎯 **核心功能**: 为 JS/CSS 文件路径自动添加随机数参数
- 🔍 **智能扫描**: 支持扫描指定目录下的 `.js` 和 `.html` 文件
- 📝 **多种引用模式支持**:
  - HTML 中的 `<link>` 和 `<script>` 标签
  - CSS 中的 `@import` 语句和 `url()` 函数
  - JavaScript 中的 `import` 和 `require` 语句
- 🎲 **随机数生成**: 使用时间戳+随机字符串组合确保唯一性
- 📁 **批量处理**: 支持批量处理和单文件处理两种模式
- 🛠️ **高度可配置**:
  - 自定义文件匹配模式
  - 自定义忽略规则
  - 自定义随机数生成器
  - 可选的外部链接处理
- 📊 **日志记录**: 提供详细的处理过程日志
- 🎨 **格式保持**: 处理后文件保持原有格式和功能不变
- ⚡ **Vite 集成**: 作为 Vite 插件无缝集成到构建流程
- 🧪 **完整测试**: 包含全面的单元测试和集成测试
- 📖 **详细文档**: 提供完整的使用文档和示例

### 配置选项
- `includeExternal`: 是否处理外部链接（默认: false）
- `patterns`: 文件匹配模式（默认: ['**/*.html', '**/*.js']）
- `ignore`: 忽略的文件/目录（默认: ['node_modules/**', 'dist/**', 'build/**']）
- `enableLog`: 是否启用日志（默认: true）
- `mode`: 处理模式 - 'build' | 'serve' | 'both'（默认: 'build'）
- `customGenerator`: 自定义随机数生成器函数

### 支持的引用模式
- HTML: `<link href="...">`, `<script src="...">`
- CSS: `@import "...";`, `url(...)`
- JavaScript: `import "...";`, `require(...)`

### 工具函数
- `generateRandomParam()`: 生成随机数参数
- `processFileContent()`: 处理文件内容
- `processSingleFile()`: 处理单个文件
- `processBatchFiles()`: 批量处理文件

### 示例和测试
- 完整的使用示例（HTML + CSS + JS）
- 全面的单元测试覆盖
- Vitest 测试配置
- 集成测试用例

### 技术特性
- 🚀 零依赖（除了 Vite 作为 peer dependency）
- 📦 ES Module 支持
- 🔧 TypeScript 友好
- 🎯 高性能正则表达式匹配
- 🛡️ 错误处理和恢复
- 📊 详细的处理统计

### 兼容性
- Node.js >= 16.0.0
- Vite ^4.0.0 || ^5.0.0
- 支持所有主流浏览器

---

## 未来计划

### [1.1.0] - 计划中
- 🎨 支持更多文件类型（Vue、React、Svelte 等）
- 🔧 配置文件支持
- 📊 更详细的处理报告
- 🚀 性能优化

### [1.2.0] - 计划中
- 🌐 国际化支持
- 🎯 更精确的文件匹配
- 🔄 增量处理支持
- 📱 移动端优化

---

## 贡献指南

我们欢迎所有形式的贡献！请查看我们的贡献指南了解更多信息。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。