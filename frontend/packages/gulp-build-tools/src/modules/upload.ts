import { src, TaskFunction } from 'gulp';
import { UploadConfig, TaskResult } from '../types.js';
import chalk from 'chalk';
import through2 from 'through2';
import path from 'path';
import fs from 'fs';

// 动态导入以避免 CommonJS 模块问题
let SftpClient: any;
let ftp: any;

async function loadDependencies() {
  if (!SftpClient) {
    SftpClient = (await import('ssh2-sftp-client')).default;
  }
  if (!ftp) {
    ftp = await import('basic-ftp');
  }
}

/**
 * 创建 SFTP 上传任务
 * @param config 上传配置
 * @returns Gulp 任务函数
 */
export function createSftpUploadTask(config: UploadConfig): TaskFunction {
  return async function sftpUpload(cb) {
    try {
      await loadDependencies();
      
      const sftp = new SftpClient();
      let fileCount = 0;

      console.log(chalk.blue('🚀 开始 SFTP 上传...'));
      console.log(chalk.gray(`服务器: ${config.host}:${config.port || 22}`));
      console.log(chalk.gray(`用户: ${config.username}`));
      console.log(chalk.gray(`远程路径: ${config.remotePath}`));

      // 连接 SFTP
      const connectConfig: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username
      };

      if (config.password) {
        connectConfig.password = config.password;
      } else if (config.privateKey) {
        connectConfig.privateKey = fs.readFileSync(config.privateKey);
      }

      await sftp.connect(connectConfig);
      console.log(chalk.green('✅ SFTP 连接成功'));

      // 确保远程目录存在
      await sftp.mkdir(config.remotePath, true);

      if (config.clean) {
        console.log(chalk.yellow('🧹 清空远程目录...'));
        await sftp.rmdir(config.remotePath, true);
        await sftp.mkdir(config.remotePath, true);
      }

      // 上传文件
      const uploadPromises: Promise<void>[] = [];

      const stream = src(config.src, { allowEmpty: true })
        .pipe(through2.obj(function(file, enc, callback) {
          if (!file.isBuffer()) {
            callback();
            return;
          }

          fileCount++;
          const relativePath = file.relative;
          const remotePath = path.posix.join(config.remotePath, relativePath).replace(/\\/g, '/');

          console.log(chalk.yellow(`上传文件: ${relativePath} -> ${remotePath}`));

          const uploadPromise = (async () => {
            try {
              // 确保远程目录存在
              const remoteDir = path.posix.dirname(remotePath);
              await sftp.mkdir(remoteDir, true);
              
              // 上传文件
              await sftp.put(file.contents, remotePath);
              console.log(chalk.green(`✅ 上传成功: ${relativePath}`));
            } catch (error) {
              console.error(chalk.red(`❌ 上传失败: ${relativePath}`), error);
              throw error;
            }
          })();

          if (config.parallel) {
            uploadPromises.push(uploadPromise);
          } else {
            uploadPromise.then(() => callback()).catch(callback);
            return;
          }

          callback();
        }));

      stream.on('end', async () => {
        try {
          if (config.parallel && uploadPromises.length > 0) {
            await Promise.all(uploadPromises);
          }

          await sftp.end();
          console.log(chalk.green(`✅ SFTP 上传完成，共上传 ${fileCount} 个文件`));
          cb();
        } catch (error) {
          console.error(chalk.red('❌ SFTP 上传失败:'), error);
          await sftp.end();
          cb(error);
        }
      });

      stream.on('error', async (error) => {
        console.error(chalk.red('❌ SFTP 上传流错误:'), error);
        await sftp.end();
        cb(error);
      });

      return stream;
    } catch (error) {
      console.error(chalk.red('❌ SFTP 连接失败:'), error);
      cb(error);
    }
  };
}

/**
 * 创建 FTP 上传任务
 * @param config 上传配置
 * @returns Gulp 任务函数
 */
export function createFtpUploadTask(config: UploadConfig): TaskFunction {
  return async function ftpUpload(cb) {
    try {
      await loadDependencies();
      
      let fileCount = 0;

      console.log(chalk.blue('🚀 开始 FTP 上传...'));
      console.log(chalk.gray(`服务器: ${config.host}:${config.port || 21}`));
      console.log(chalk.gray(`用户: ${config.username}`));
      console.log(chalk.gray(`远程路径: ${config.remotePath}`));

      const client = new ftp.Client();
      
      try {
        await client.access({
          host: config.host,
          port: config.port || 21,
          user: config.username,
          password: config.password
        });
        
        console.log(chalk.green('✅ FTP 连接成功'));
        
        if (config.clean) {
          console.log(chalk.yellow('🧹 清空远程目录...'));
          try {
            await client.removeDir(config.remotePath);
          } catch (error) {
            // 忽略删除失败的错误
          }
        }
        
        // 确保远程目录存在
        await client.ensureDir(config.remotePath);
        
        const stream = src(config.src, { allowEmpty: true })
          .pipe(through2.obj(async function(file, enc, callback) {
            if (!file.isBuffer()) {
              callback();
              return;
            }

            fileCount++;
            const relativePath = file.relative;
            const remotePath = path.posix.join(config.remotePath, relativePath).replace(/\\/g, '/');

            console.log(chalk.yellow(`上传文件: ${relativePath} -> ${remotePath}`));

            try {
              // 确保远程目录存在
              const remoteDir = path.posix.dirname(remotePath);
              await client.ensureDir(remoteDir);
              
              // 上传文件
              await client.uploadFrom(file.contents, remotePath);
              console.log(chalk.green(`✅ 上传成功: ${relativePath}`));
            } catch (error) {
              console.error(chalk.red(`❌ 上传失败: ${relativePath}`), error);
              callback(error);
              return;
            }

            callback();
          }));

        stream.on('end', async () => {
          try {
            client.close();
            console.log(chalk.green(`✅ FTP 上传完成，共上传 ${fileCount} 个文件`));
            cb();
          } catch (error) {
            console.error(chalk.red('❌ FTP 上传失败:'), error);
            cb(error);
          }
        });

        stream.on('error', (error) => {
          console.error(chalk.red('❌ FTP 上传流错误:'), error);
          client.close();
          cb(error);
        });

        return stream;
        
      } catch (error) {
        console.error(chalk.red('❌ FTP 连接失败:'), error);
        cb(error);
      }
    } catch (error) {
      console.error(chalk.red('❌ FTP 初始化失败:'), error);
      cb(error);
    }
  };
}

/**
 * 创建上传任务（根据配置自动选择 FTP 或 SFTP）
 * @param config 上传配置
 * @returns Gulp 任务函数
 */
export function createUploadTask(config: UploadConfig): TaskFunction {
  if (config.type === 'sftp') {
    return createSftpUploadTask(config);
  } else {
    return createFtpUploadTask(config);
  }
}

/**
 * 批量上传文件
 * @param configs 上传配置数组
 * @returns Promise<TaskResult[]>
 */
export async function batchUpload(configs: UploadConfig[]): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const config of configs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createUploadTask(config);
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
        message: `文件上传成功: ${config.host}:${config.remotePath}`,
        fileCount: 1
      });
    } catch (error) {
      results.push({
        success: false,
        error: error as Error,
        message: `文件上传失败: ${config.host}:${config.remotePath}`
      });
    }
  }
  
  return results;
}

/**
 * 并行上传文件
 * @param configs 上传配置数组
 * @returns Promise<TaskResult[]>
 */
export async function parallelUpload(configs: UploadConfig[]): Promise<TaskResult[]> {
  console.log(chalk.blue(`🚀 开始并行上传到 ${configs.length} 个服务器...`));
  
  const promises = configs.map(async (config, index) => {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createUploadTask(config);
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
        message: `上传成功 [${index + 1}]: ${config.host}:${config.remotePath}`,
        fileCount: 1
      } as TaskResult;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: `上传失败 [${index + 1}]: ${config.host}:${config.remotePath}`
      } as TaskResult;
    }
  });
  
  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(chalk.green(`✅ 并行上传完成: ${successCount} 成功, ${failureCount} 失败`));
  
  return results;
}

/**
 * 创建多上传任务
 * @param configs 上传配置数组
 * @param parallel 是否并行执行
 * @returns Gulp 任务函数
 */
export function createMultiUploadTask(configs: UploadConfig[], parallel: boolean = false): TaskFunction {
  return async function multiUpload(cb) {
    try {
      console.log(chalk.blue(`🚀 开始${parallel ? '并行' : '串行'}上传到 ${configs.length} 个目标...`));
      
      // 验证所有配置
      for (const config of configs) {
        const errors = uploadHelpers.validateConfig(config);
        if (errors.length > 0) {
          throw new Error(`上传配置错误 (${config.host}): ${errors.join(', ')}`);
        }
      }
      
      let results: TaskResult[];
      
      if (parallel) {
        results = await parallelUpload(configs);
      } else {
        results = await batchUpload(configs);
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (failureCount > 0) {
        console.log(chalk.yellow(`⚠️ 部分上传失败:`));
        results.filter(r => !r.success).forEach(result => {
          console.log(chalk.red(`  - ${result.message}`));
        });
      }
      
      console.log(chalk.green(`✅ 多目标上传完成: ${successCount} 成功, ${failureCount} 失败`));
      
      if (failureCount > 0 && successCount === 0) {
        cb(new Error('所有上传任务都失败了'));
      } else {
        cb();
      }
    } catch (error) {
      console.error(chalk.red('❌ 多目标上传失败:'), error);
      cb(error);
    }
  };
}

/**
 * 上传工具函数
 */
export const uploadHelpers = {
  /**
   * 创建上传配置
   * @param baseConfig 基础配置
   * @param overrides 覆盖配置
   */
  createConfig: (baseConfig: Partial<UploadConfig>, overrides: Partial<UploadConfig> = {}): UploadConfig => {
    return {
      type: 'sftp',
      port: baseConfig.type === 'ftp' ? 21 : 22,
      parallel: true,
      clean: false,
      ...baseConfig,
      ...overrides
    } as UploadConfig;
  },

  /**
   * 验证上传配置
   * @param config 上传配置
   */
  validateConfig: (config: UploadConfig): string[] => {
    const errors: string[] = [];

    if (!config.host) errors.push('缺少服务器主机地址');
    if (!config.username) errors.push('缺少用户名');
    if (!config.password && !config.privateKey) errors.push('缺少密码或私钥');
    if (!config.remotePath) errors.push('缺少远程路径');
    if (!config.src) errors.push('缺少源文件路径');

    return errors;
  }
};