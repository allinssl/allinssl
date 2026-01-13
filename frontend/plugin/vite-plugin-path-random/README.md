# @baota/vite-plugin-random-cache

一个 Vite 插件，用于在编译完成后为 JS/CSS 文件路径添加随机数参数，有效解决浏览器缓存问题。

## 功能特性

- 🚀 **编译后处理**: 在 Vite 编译流程完成后自动处理目标文件路径
- 🎯 **智能扫描**: 自动扫描编译输出目录下的各种文件类型
- 🔍 **全面匹配**: 识别各种引用模式（HTML标签、CSS @import、JS import/require等）
- 🎲 **随机参数**: 为每个引用的文件路径添加唯一随机数参数
- 📁 **批量处理**: 支持批量处理和单文件处理两种模式
- 🛠️ **高度可配置**: 支持自定义随机数生成规则和处理选项
- 📝 **日志记录**: 提供详细的处理过程日志
- 🎨 **保持格式**: 处理后的文件保持原有格式和功能不变
- 📂 **路径识别**: 正确识别并处理编译后的文件路径结构

## 安装

```bash
npm install @baota/vite-plugin-random-cache --save-dev
# 或
yarn add @baota/vite-plugin-random-cache --dev
# 或
pnpm add @baota/vite-plugin-random-cache --save-dev
```

## 基础使用

### 在 Vite 配置中使用

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import randomCachePlugin from '@baota/vite-plugin-random-cache';

export default defineConfig({
  plugins: [
    randomCachePlugin()
  ]
});
```

### 直接使用工具函数

```javascript
import { 
  processSingleFile, 
  processBatchFiles, 
  processFileContent 
} from '@baota/vite-plugin-random-cache';

// 处理单个文件
processSingleFile('./dist/index.html', {
  enableLog: true
});

// 批量处理文件
processBatchFiles('./dist', {
  patterns: ['**/*.html', '**/*.js'],
  enableLog: true
});

// 处理文件内容
const content = '<link rel="stylesheet" href="style.css">';
const processed = processFileContent(content);
console.log(processed); // <link rel="stylesheet" href="style.css?v=1703123456789_abc123">
```

## 配置选项

```javascript
randomCachePlugin({
  // 是否包含外部链接 (默认: false)
  includeExternal: false,
  
  // 文件匹配模式 (默认: ['**/*.html', '**/*.js', '**/*.css', '**/*.jsx', '**/*.ts', '**/*.tsx'])
  patterns: ['**/*.html', '**/*.js', '**/*.css', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  
  // 忽略的文件/目录 (默认: ['node_modules/**'])
  // 注意: 编译后处理时通常不需要忽略输出目录
  ignore: ['node_modules/**'],
  
  // 是否启用日志 (默认: true)
  enableLog: true,
  
  // 处理模式 (默认: 'build')
  // 'build': 仅在构建时处理
  // 'serve': 仅在开发服务器时处理
  // 'both': 构建和开发时都处理
  mode: 'build',
  
  // 自定义输出目录 (可选)
  // 如果不指定，将自动使用 Vite 的输出目录
  outputDir: './custom-dist',
  
  // 自定义随机数生成器 (可选)
  customGenerator: (timestamp, randomStr) => {
    return `custom_${timestamp}_${randomStr}`;
  }
})
```

## 支持的文件引用模式

插件能够识别和处理以下引用模式：

### HTML 文件
```html
<!-- CSS 引用 -->
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="./assets/main.css">

<!-- JS 引用 -->
<script src="script.js"></script>
<script src="./js/app.js"></script>
```

### CSS 文件
```css
/* @import 语句 */
@import "reset.css";
@import url("./fonts/font.css");

/* url() 函数 */
.bg { background: url("./images/bg.jpg"); }
.font { font-face: url("./fonts/font.woff2"); }
```

### JavaScript 文件
```javascript
// ES6 import
import './styles.css';
import { utils } from './utils.js';

// CommonJS require
const config = require('./config.js');
require('./init.css');
```

## 处理结果示例

### 处理前
```html
<link rel="stylesheet" href="styles.css">
<script src="app.js"></script>
```

### 处理后
```html
<link rel="stylesheet" href="styles.css?v=1703123456789_abc123">
<script src="app.js?v=1703123456789_def456"></script>
```

## 高级用法

### 自定义随机数生成

```javascript
randomCachePlugin({
  customGenerator: (timestamp, randomStr) => {
    // 使用版本号 + 时间戳
    const version = process.env.npm_package_version || '1.0.0';
    return `v${version}_${timestamp}`;
  }
})
```

### 条件处理

```javascript
randomCachePlugin({
  // 仅在生产环境处理
  mode: process.env.NODE_ENV === 'production' ? 'build' : 'serve'
})
```

### 处理特定文件类型

```javascript
randomCachePlugin({
  patterns: [
    '**/*.html',
    '**/*.js',
    '**/*.vue',  // Vue 单文件组件
    '**/*.jsx',  // React JSX 文件
    '**/*.tsx'   // TypeScript JSX 文件
  ]
})
```

## 注意事项

1. **外部链接**: 默认不处理外部链接（http/https），可通过 `includeExternal: true` 启用
2. **已有参数**: 如果文件路径已包含查询参数，会使用 `&` 连接新参数
3. **文件备份**: 建议在重要项目中先备份文件再使用
4. **性能考虑**: 大型项目建议合理配置 `ignore` 选项以提高处理速度

## 开发和测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 监听测试
npm run test:watch

# 代码检查
npm run lint

# 修复代码格式
npm run lint:fix
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 HTML、CSS、JS 文件的路径随机数添加
- 提供批量处理和单文件处理功能
- 支持自定义随机数生成规则