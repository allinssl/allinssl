import { src, dest, TaskFunction } from 'gulp';
import gulpZip from 'gulp-zip';
import { CompressConfig, TaskResult } from '../types.js';
import chalk from 'chalk';
import through2 from 'through2';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

/**
 * 创建 ZIP 压缩任务
 * @param config 压缩配置
 * @returns Gulp 任务函数
 */
export function createZipTask(config: CompressConfig): TaskFunction {
  return function zipFiles(cb) {
    let fileCount = 0;

    console.log(chalk.blue('📦 开始创建 ZIP 压缩包...'));
    console.log(chalk.gray(`源路径: ${Array.isArray(config.src) ? config.src.join(', ') : config.src}`));
    console.log(chalk.gray(`压缩包: ${config.filename}`));
    console.log(chalk.gray(`输出目录: ${config.dest}`));

    const stream = src(config.src, { allowEmpty: true })
      .pipe(through2.obj(function(file, enc, callback) {
        fileCount++;
        console.log(chalk.yellow(`添加文件: ${file.relative}`));
        this.push(file);
        callback();
      }))
      .pipe(gulpZip(config.filename))
      .pipe(dest(config.dest));

    stream.on('end', () => {
      const zipPath = path.join(config.dest, config.filename);
      const stats = fs.statSync(zipPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(chalk.green(`✅ ZIP 压缩完成`));
      console.log(chalk.gray(`  - 文件数量: ${fileCount}`));
      console.log(chalk.gray(`  - 压缩包大小: ${fileSizeMB} MB`));
      console.log(chalk.gray(`  - 保存路径: ${zipPath}`));
      cb();
    });

    stream.on('error', (error) => {
      console.error(chalk.red('❌ ZIP 压缩失败:'), error);
      cb(error);
    });

    return stream;
  };
}

/**
 * 创建自定义压缩任务（支持 tar, gzip 等）
 * @param config 压缩配置
 * @returns Gulp 任务函数
 */
export function createCustomCompressTask(config: CompressConfig): TaskFunction {
  return function compressFiles(cb) {
    let fileCount = 0;

    console.log(chalk.blue(`📦 开始创建 ${config.type?.toUpperCase()} 压缩包...`));
    console.log(chalk.gray(`源路径: ${Array.isArray(config.src) ? config.src.join(', ') : config.src}`));
    console.log(chalk.gray(`压缩包: ${config.filename}`));
    console.log(chalk.gray(`输出目录: ${config.dest}`));

    const outputPath = path.join(config.dest, config.filename);
    const output = fs.createWriteStream(outputPath);
    
    let archive: archiver.Archiver;
    
    switch (config.type) {
      case 'tar':
        archive = archiver('tar', {
          gzip: false
        });
        break;
      case 'gzip':
        archive = archiver('tar', {
          gzip: true,
          gzipOptions: {
            level: config.level || 6
          }
        });
        break;
      default:
        archive = archiver('zip', {
          zlib: { level: config.level || 6 }
        });
    }

    // 监听错误事件
    archive.on('error', (err) => {
      console.error(chalk.red('❌ 压缩过程中出错:'), err);
      cb(err);
    });

    // 监听警告事件
    archive.on('warning', (err) => {
      console.warn(chalk.yellow('⚠️ 压缩警告:'), err);
    });

    // 监听完成事件
    output.on('close', () => {
      const stats = fs.statSync(outputPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(chalk.green(`✅ ${config.type?.toUpperCase()} 压缩完成`));
      console.log(chalk.gray(`  - 文件数量: ${fileCount}`));
      console.log(chalk.gray(`  - 压缩包大小: ${fileSizeMB} MB`));
      console.log(chalk.gray(`  - 保存路径: ${outputPath}`));
      cb();
    });

    // 将压缩包管道到输出流
    archive.pipe(output);

    // 创建 Gulp 流处理文件
    const stream = src(config.src, { allowEmpty: true })
      .pipe(through2.obj(function(file, enc, callback) {
        if (!file.isBuffer()) {
          callback();
          return;
        }

        fileCount++;
        console.log(chalk.yellow(`添加文件: ${file.relative}`));

        // 将文件添加到压缩包
        archive.append(file.contents, { name: file.relative });
        
        callback();
      }));

    stream.on('end', () => {
      // 完成压缩
      archive.finalize();
    });

    stream.on('error', (error) => {
      console.error(chalk.red('❌ 文件处理失败:'), error);
      cb(error);
    });

    return stream;
  };
}

/**
 * 创建压缩任务（根据配置自动选择压缩方式）
 * @param config 压缩配置
 * @returns Gulp 任务函数
 */
export function createCompressTask(config: CompressConfig): TaskFunction {
  if (!config.type || config.type === 'zip') {
    return createZipTask(config);
  } else {
    return createCustomCompressTask(config);
  }
}

/**
 * 批量压缩文件
 * @param configs 压缩配置数组
 * @returns Promise<TaskResult[]>
 */
export async function batchCompress(configs: CompressConfig[]): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const config of configs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createCompressTask(config);
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
        message: `文件压缩成功: ${path.join(config.dest, config.filename)}`,
        fileCount: 1
      });
    } catch (error) {
      results.push({
        success: false,
        error: error as Error,
        message: `文件压缩失败: ${path.join(config.dest, config.filename)}`
      });
    }
  }
  
  return results;
}

/**
 * 并行压缩文件
 * @param configs 压缩配置数组
 * @returns Promise<TaskResult[]>
 */
export async function parallelCompress(configs: CompressConfig[]): Promise<TaskResult[]> {
  console.log(chalk.blue(`📦 开始并行压缩 ${configs.length} 个文件包...`));
  
  const promises = configs.map(async (config, index) => {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createCompressTask(config);
        task((error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      return {
        success: true,
        message: `压缩成功 [${index + 1}]: ${path.join(config.dest, config.filename)}`,
        fileCount: 1
      } as TaskResult;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: `压缩失败 [${index + 1}]: ${path.join(config.dest, config.filename)}`
      } as TaskResult;
    }
  });
  
  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(chalk.green(`✅ 并行压缩完成: ${successCount} 成功, ${failureCount} 失败`));
  
  return results;
}

/**
 * 创建多压缩任务
 * @param configs 压缩配置数组
 * @param parallel 是否并行执行
 * @returns Gulp 任务函数
 */
export function createMultiCompressTask(configs: CompressConfig[], parallel: boolean = false): TaskFunction {
  return async function multiCompress(cb) {
    try {
      console.log(chalk.blue(`📦 开始${parallel ? '并行' : '串行'}压缩 ${configs.length} 个文件包...`));
      
      // 验证所有配置
      for (const config of configs) {
        const errors = compressHelpers.validateConfig(config);
        if (errors.length > 0) {
          throw new Error(`压缩配置错误 (${config.filename}): ${errors.join(', ')}`);
        }
      }
      
      let results: TaskResult[];
      
      if (parallel) {
        results = await parallelCompress(configs);
      } else {
        results = await batchCompress(configs);
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      // 计算总文件大小
      let totalSize = 0;
      for (const config of configs) {
        try {
          const filePath = path.join(config.dest, config.filename);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        } catch (error) {
          // 忽略获取文件大小失败的错误
        }
      }
      
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      if (failureCount > 0) {
        console.log(chalk.yellow(`⚠️ 部分压缩失败:`));
        results.filter(r => !r.success).forEach(result => {
          console.log(chalk.red(`  - ${result.message}`));
        });
      }
      
      console.log(chalk.green(`✅ 多压缩任务完成: ${successCount} 成功, ${failureCount} 失败`));
      console.log(chalk.gray(`  - 总压缩包大小: ${totalSizeMB} MB`));
      
      if (failureCount > 0 && successCount === 0) {
        cb(new Error('所有压缩任务都失败了'));
      } else {
        cb();
      }
    } catch (error) {
      console.error(chalk.red('❌ 多压缩任务执行失败:'), error);
      cb(error);
    }
  };
}

/**
 * 压缩工具函数
 */
export const compressHelpers = {
  /**
   * 创建压缩配置
   * @param src 源文件路径
   * @param filename 压缩包文件名
   * @param dest 输出目录
   * @param options 其他选项
   */
  createConfig: (
    src: string | string[], 
    filename: string, 
    dest: string, 
    options: Partial<CompressConfig> = {}
  ): CompressConfig => {
    return {
      src,
      filename,
      dest,
      type: 'zip',
      level: 6,
      ...options
    };
  },

  /**
   * 根据文件扩展名推断压缩类型
   * @param filename 文件名
   */
  inferType: (filename: string): CompressConfig['type'] => {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.zip':
        return 'zip';
      case '.tar':
        return 'tar';
      case '.gz':
      case '.tgz':
        return 'gzip';
      default:
        return 'zip';
    }
  },

  /**
   * 生成带时间戳的文件名
   * @param basename 基础文件名
   * @param extension 扩展名
   */
  timestampedFilename: (basename: string, extension: string = 'zip'): string => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `${basename}-${timestamp}.${extension}`;
  },

  /**
   * 获取推荐的压缩级别
   * @param priority 优先级 ('speed' | 'size' | 'balanced')
   */
  getCompressionLevel: (priority: 'speed' | 'size' | 'balanced' = 'balanced'): number => {
    switch (priority) {
      case 'speed':
        return 1;
      case 'size':
        return 9;
      case 'balanced':
      default:
        return 6;
    }
  },

  /**
   * 验证压缩配置
   * @param config 压缩配置
   */
  validateConfig: (config: CompressConfig): string[] => {
    const errors: string[] = [];

    if (!config.src) errors.push('缺少源文件路径');
    if (!config.filename) errors.push('缺少压缩包文件名');
    if (!config.dest) errors.push('缺少输出目录');
    if (config.level && (config.level < 0 || config.level > 9)) {
      errors.push('压缩级别必须在 0-9 之间');
    }

    return errors;
  }
};