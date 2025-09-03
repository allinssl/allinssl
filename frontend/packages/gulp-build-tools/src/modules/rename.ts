import { src, dest, TaskFunction } from 'gulp';
import gulpRename from 'gulp-rename';
import { RenameConfig, TaskResult } from '../types.js';
import chalk from 'chalk';
import through2 from 'through2';

/**
 * 创建文件重命名任务
 * @param config 重命名配置
 * @returns Gulp 任务函数
 */
export function createRenameTask(config: RenameConfig): TaskFunction {
  return function renameFiles(cb) {
    let fileCount = 0;

    console.log(chalk.blue('🔄 开始重命名文件...'));
    console.log(chalk.gray(`源路径: ${Array.isArray(config.src) ? config.src.join(', ') : config.src}`));
    console.log(chalk.gray(`目标路径: ${config.dest}`));

    const stream = src(config.src, { allowEmpty: true })
      .pipe(through2.obj(function(file, enc, callback) {
        fileCount++;
        console.log(chalk.yellow(`处理文件: ${file.relative}`));
        this.push(file);
        callback();
      }))
      .pipe(gulpRename(config.rename))
      .pipe(through2.obj(function(file, enc, callback) {
        console.log(chalk.green(`重命名为: ${file.relative}`));
        this.push(file);
        callback();
      }))
      .pipe(dest(config.dest));

    stream.on('end', () => {
      console.log(chalk.green(`✅ 文件重命名完成，共处理 ${fileCount} 个文件`));
      cb();
    });

    stream.on('error', (error) => {
      console.error(chalk.red('❌ 文件重命名失败:'), error);
      cb(error);
    });

    return stream;
  };
}

/**
 * 批量重命名文件
 * @param configs 重命名配置数组
 * @returns Promise<TaskResult[]>
 */
export async function batchRename(configs: RenameConfig[]): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const config of configs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createRenameTask(config);
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
        message: `文件重命名成功: ${config.dest}`
      });
    } catch (error) {
      results.push({
        success: false,
        error: error as Error,
        message: `文件重命名失败: ${config.dest}`
      });
    }
  }
  
  return results;
}

/**
 * 创建常用的重命名函数
 */
export const renameHelpers = {
  /**
   * 添加前缀
   * @param prefix 前缀
   */
  addPrefix: (prefix: string) => (path: any) => {
    path.basename = prefix + path.basename;
  },

  /**
   * 添加后缀
   * @param suffix 后缀
   */
  addSuffix: (suffix: string) => (path: any) => {
    path.basename = path.basename + suffix;
  },

  /**
   * 更改扩展名
   * @param ext 新扩展名（包含点）
   */
  changeExtension: (ext: string) => (path: any) => {
    path.extname = ext;
  },

  /**
   * 添加时间戳
   */
  addTimestamp: () => (path: any) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    path.basename = `${path.basename}-${timestamp}`;
  },

  /**
   * 转换为小写
   */
  toLowerCase: () => (path: any) => {
    path.basename = path.basename.toLowerCase();
  },

  /**
   * 转换为大写
   */
  toUpperCase: () => (path: any) => {
    path.basename = path.basename.toUpperCase();
  },

  /**
   * 替换文件名中的字符
   * @param search 要替换的字符串或正则
   * @param replace 替换为的字符串
   */
  replaceInName: (search: string | RegExp, replace: string) => (path: any) => {
    path.basename = path.basename.replace(search, replace);
  }
};