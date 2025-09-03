#!/usr/bin/env node

/**
 * 批量替换示例脚本
 * 演示如何使用 vite-plugin-random-cache 的批量替换功能
 */

import { batchReplaceWithRandomCache, processBatchFiles } from '../src/index.js?v=175568710602885';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 示例1: 基本批量替换功能
console.log('🚀 示例1: 基本批量替换功能');
console.log('=' .repeat(50));

const exampleDir = path.join(__dirname);

// 预览模式 - 查看哪些文件会被处理
const previewResult = batchReplaceWithRandomCache(exampleDir, {
  dryRun: true,
  patterns: ['*.html', '*.js', '*.css'],
  ignore: ['batch-replace-demo.js'], // 忽略当前脚本
  enableLog: true
});

console.log('\n📊 预览结果:', previewResult);

// 示例2: 实际执行替换（带备份）
console.log('\n\n🔧 示例2: 实际执行替换（带备份）');
console.log('=' .repeat(50));

const replaceResult = batchReplaceWithRandomCache(exampleDir, {
  patterns: ['*.html', '*.js', '*.css'],
  ignore: ['batch-replace-demo.js'],
  createBackup: true,
  enableLog: true,
  includeExternal: false,
  customGenerator: (timestamp, randomStr) => {
    // 自定义随机数生成器
    return `v${timestamp.toString().slice(-6)}_${randomStr}`;
  }
});

console.log('\n📊 替换结果:', replaceResult);

// 示例3: 处理特定文件列表
console.log('\n\n📝 示例3: 处理特定文件列表');
console.log('=' .repeat(50));

const specificFiles = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'js/app.js'),
  path.join(__dirname, 'styles/main.css')
];

const fileListResult = batchReplaceWithRandomCache(specificFiles, {
  createBackup: true,
  enableLog: true,
  includeExternal: true // 包含外部链接
});

console.log('\n📊 文件列表处理结果:', fileListResult);

// 示例4: 使用增强的 processBatchFiles 函数
console.log('\n\n⚡ 示例4: 使用增强的批量处理函数');
console.log('=' .repeat(50));

const enhancedResult = processBatchFiles(exampleDir, {
  patterns: ['*.html'],
  createBackup: true,
  enableIntegrityCheck: true,
  continueOnError: true,
  maxRetries: 3,
  enableLog: true
});

console.log('\n📊 增强处理结果:', enhancedResult);

// 示例5: 错误处理和恢复演示
console.log('\n\n🛡️  示例5: 错误处理演示');
console.log('=' .repeat(50));

// 尝试处理不存在的目录
const errorResult = batchReplaceWithRandomCache('/path/that/does/not/exist', {
  enableLog: true
});

console.log('\n📊 错误处理结果:', errorResult);

// 输出使用说明
console.log('\n\n📖 使用说明');
console.log('=' .repeat(50));
console.log(`
主要功能:
1. batchReplaceWithRandomCache() - 新的批量替换功能
   - 支持目录或文件列表
   - 自动备份和恢复
   - 完整性检查
   - 详细的统计信息

2. processBatchFiles() - 增强的批量处理功能
   - 向后兼容
   - 增加了重试机制
   - 更好的错误处理
   - 详细的处理统计

配置选项:
- patterns: 文件匹配模式
- ignore: 忽略的文件/目录
- createBackup: 是否创建备份
- enableLog: 是否启用日志
- includeExternal: 是否处理外部链接
- customGenerator: 自定义随机数生成器
- dryRun: 预览模式
- maxRetries: 最大重试次数
- continueOnError: 遇到错误时是否继续
`);

console.log('\n✨ 演示完成！');