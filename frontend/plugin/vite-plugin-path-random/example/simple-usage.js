/**
 * 简单使用示例
 * 展示 vite-plugin-random-cache 的基本用法
 */

import { batchReplaceWithRandomCache } from '../src/index.js?v=175568710602856';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基本用法：处理当前目录下的所有HTML、JS、CSS文件
const result = batchReplaceWithRandomCache(__dirname, {
  // 文件匹配模式
  patterns: ['*.html', '*.js', '*.css'],
  
  // 忽略的文件
  ignore: ['simple-usage.js', 'batch-replace-demo.js'],
  
  // 创建备份文件
  createBackup: true,
  
  // 启用日志输出
  enableLog: true,
  
  // 不处理外部链接
  includeExternal: false
});

console.log('\n处理结果:');
console.log(`- 总文件数: ${result.totalFiles}`);
console.log(`- 修改文件数: ${result.modifiedFiles}`);
console.log(`- 失败文件数: ${result.failedFiles}`);
console.log(`- 备份文件数: ${result.backupFiles.length}`);

if (result.errors.length > 0) {
  console.log('\n错误信息:');
  result.errors.forEach(error => {
    console.log(`- ${error.file}: ${error.error}`);
  });
}

console.log('\n✅ 处理完成！');