import { src, dest, TaskFunction } from 'gulp';
import gulpReplace from 'gulp-replace';
import { ReplaceConfig, TaskResult } from '../types.js';
import chalk from 'chalk';
import through2 from 'through2';
import { Transform } from 'stream';

/**
 * 创建文件内容替换任务
 * @param config 替换配置
 * @returns Gulp 任务函数
 */
export function createReplaceTask(config: ReplaceConfig): TaskFunction {
  return function replaceContent(cb) {
    let fileCount = 0;
    let replaceCount = 0;

    console.log(chalk.blue('🔄 开始替换文件内容...'));
    console.log(chalk.gray(`源路径: ${Array.isArray(config.src) ? config.src.join(', ') : config.src}`));
    console.log(chalk.gray(`目标路径: ${config.dest}`));
    console.log(chalk.gray(`替换规则数量: ${config.replacements.length}`));

    let stream: any = src(config.src, { allowEmpty: true })
      .pipe(through2.obj(function(file, enc, callback) {
        fileCount++;
        console.log(chalk.yellow(`处理文件: ${file.relative}`));
        this.push(file);
        callback();
      }));

    // 应用所有替换规则
    for (const replacement of config.replacements) {
      const { search, replace } = replacement;
      
      stream = (stream as any).pipe(gulpReplace(search, (match, ...args) => {
        replaceCount++;
        console.log(chalk.cyan(`替换内容: ${match.substring(0, 50)}${match.length > 50 ? '...' : ''}`));
        
        if (typeof replace === 'function') {
          return replace(match, ...args);
        }
        return replace;
      }));
    }

    stream = (stream as any).pipe(dest(config.dest));

    stream.on('end', () => {
      console.log(chalk.green(`✅ 内容替换完成，共处理 ${fileCount} 个文件，执行 ${replaceCount} 次替换`));
      cb();
    });

    stream.on('error', (error) => {
      console.error(chalk.red('❌ 内容替换失败:'), error);
      cb(error);
    });

    return stream;
  };
}

/**
 * 批量替换文件内容
 * @param configs 替换配置数组
 * @returns Promise<TaskResult[]>
 */
export async function batchReplace(configs: ReplaceConfig[]): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const config of configs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createReplaceTask(config);
        task((error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      results.push({
        success: true,
        message: `内容替换成功: ${config.dest}`
      });
    } catch (error) {
      results.push({
        success: false,
        error: error as Error,
        message: `内容替换失败: ${config.dest}`
      });
    }
  }
  
  return results;
}

/**
 * 常用替换模式
 */
export const replacePatterns = {
  /**
   * 替换版本号
   * @param newVersion 新版本号
   */
  version: (newVersion: string) => ({
    search: /"version"\s*:\s*"[^"]+"/g,
    replace: `"version": "${newVersion}"`
  }),

  /**
   * 替换 API 基础 URL
   * @param newBaseUrl 新的基础 URL
   */
  apiBaseUrl: (newBaseUrl: string) => ({
    search: /const\s+API_BASE_URL\s*=\s*['"][^'"]+['"]/g,
    replace: `const API_BASE_URL = '${newBaseUrl}'`
  }),

  /**
   * 替换环境变量
   * @param envVar 环境变量名
   * @param value 新值
   */
  envVariable: (envVar: string, value: string) => ({
    search: new RegExp(`${envVar}\\s*=\\s*[^\\n\\r]+`, 'g'),
    replace: `${envVar}=${value}`
  }),

  /**
   * 替换 HTML 中的标题
   * @param newTitle 新标题
   */
  htmlTitle: (newTitle: string) => ({
    search: /<title>[^<]*<\/title>/gi,
    replace: `<title>${newTitle}</title>`
  }),

  /**
   * 替换注释中的版权信息
   * @param newCopyright 新版权信息
   */
  copyright: (newCopyright: string) => ({
    search: /\/\*\*[\s\S]*?Copyright[\s\S]*?\*\//g,
    replace: `/**\n * ${newCopyright}\n */`
  }),

  /**
   * 替换时间戳
   */
  timestamp: () => ({
    search: /\{\{TIMESTAMP\}\}/g,
    replace: new Date().toISOString()
  }),

  /**
   * 替换构建号
   * @param buildNumber 构建号
   */
  buildNumber: (buildNumber: string) => ({
    search: /BUILD_NUMBER\s*=\s*['"][^'"]*['"]/g,
    replace: `BUILD_NUMBER = '${buildNumber}'`
  }),

  /**
   * 替换 CSS 中的颜色值
   * @param oldColor 旧颜色值
   * @param newColor 新颜色值
   */
  cssColor: (oldColor: string, newColor: string) => ({
    search: new RegExp(oldColor.replace('#', '\\#'), 'gi'),
    replace: newColor
  }),

  /**
   * 替换 JavaScript 中的配置对象
   * @param configKey 配置键名
   * @param newValue 新值
   */
  jsConfig: (configKey: string, newValue: any) => ({
    search: new RegExp(`${configKey}\\s*:\\s*[^,}]+`, 'g'),
    replace: `${configKey}: ${JSON.stringify(newValue)}`
  })
};