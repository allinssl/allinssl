import { TaskFunction } from 'gulp';
import { SSHConfig, TaskResult } from '../types.js';
import chalk from 'chalk';
import { Client } from 'ssh2';
import fs from 'fs';

/**
 * 创建 SSH 命令执行任务
 * @param config SSH 配置
 * @returns Gulp 任务函数
 */
export function createSSHTask(config: SSHConfig): TaskFunction {
  return function sshExecution(cb) {
    const conn = new Client();
    let commandCount = 0;
    const commands = Array.isArray(config.commands) ? config.commands : [config.commands];

    console.log(chalk.blue('🔗 开始 SSH 连接...'));
    console.log(chalk.gray(`服务器: ${config.host}:${config.port || 22}`));
    console.log(chalk.gray(`用户: ${config.username}`));
    console.log(chalk.gray(`命令数量: ${commands.length}`));

    conn.on('ready', async () => {
      console.log(chalk.green('✅ SSH 连接成功'));

      try {
        for (const command of commands) {
          await executeCommand(conn, command, config.verbose || false);
          commandCount++;
        }

        console.log(chalk.green(`✅ SSH 命令执行完成，共执行 ${commandCount} 个命令`));
        conn.end();
        cb();
      } catch (error) {
        console.error(chalk.red('❌ SSH 命令执行失败:'), error);
        conn.end();
        cb(error);
      }
    });

    conn.on('error', (error) => {
      console.error(chalk.red('❌ SSH 连接失败:'), error);
      cb(error);
    });

    conn.on('end', () => {
      console.log(chalk.blue('🔌 SSH 连接已断开'));
    });

    // 准备连接配置
    const connectConfig: any = {
      host: config.host,
      port: config.port || 22,
      username: config.username,
    };

    if (config.password) {
      connectConfig.password = config.password;
    } else if (config.privateKey) {
      try {
        connectConfig.privateKey = fs.readFileSync(config.privateKey);
      } catch (error) {
        console.error(chalk.red('❌ 读取私钥文件失败:'), error);
        cb(error);
        return;
      }
    } else {
      console.error(chalk.red('❌ 缺少密码或私钥'));
      cb(new Error('缺少密码或私钥'));
      return;
    }

    // 建立连接
    conn.connect(connectConfig);
  };
}

/**
 * 执行单个命令
 * @param conn SSH 连接
 * @param command 要执行的命令
 * @param verbose 是否显示详细输出
 */
function executeCommand(conn: Client, command: string, verbose: boolean): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    console.log(chalk.yellow(`📝 执行命令: ${command}`));

    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let stdout = '';
      let stderr = '';
      let code = 0;

      stream.on('close', (exitCode: number, signal: string) => {
        code = exitCode;
        
        if (exitCode === 0) {
          console.log(chalk.green(`✅ 命令执行成功 (退出码: ${exitCode})`));
        } else {
          console.log(chalk.red(`❌ 命令执行失败 (退出码: ${exitCode})`));
        }

        if (signal) {
          console.log(chalk.yellow(`收到信号: ${signal}`));
        }

        resolve({ stdout, stderr, code });
      });

      stream.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        
        if (verbose) {
          console.log(chalk.gray('[输出]'), output.trim());
        }
      });

      stream.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        
        if (verbose) {
          console.log(chalk.red('[错误]'), output.trim());
        }
      });

      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  });
}

/**
 * 批量执行 SSH 命令
 * @param configs SSH 配置数组
 * @returns Promise<TaskResult[]>
 */
export async function batchSSHExecution(configs: SSHConfig[]): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const config of configs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createSSHTask(config);
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
        message: `SSH 命令执行成功: ${config.host}`,
        fileCount: Array.isArray(config.commands) ? config.commands.length : 1
      });
    } catch (error) {
      results.push({
        success: false,
        error: error as Error,
        message: `SSH 命令执行失败: ${config.host}`
      });
    }
  }
  
  return results;
}

/**
 * 并行执行 SSH 命令
 * @param configs SSH 配置数组
 * @returns Promise<TaskResult[]>
 */
export async function parallelSSHExecution(configs: SSHConfig[]): Promise<TaskResult[]> {
  console.log(chalk.blue(`🔗 开始并行连接 ${configs.length} 个服务器...`));
  
  const promises = configs.map(async (config, index) => {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createSSHTask(config);
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
        message: `SSH 执行成功 [${index + 1}]: ${config.host}`,
        fileCount: Array.isArray(config.commands) ? config.commands.length : 1
      } as TaskResult;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: `SSH 执行失败 [${index + 1}]: ${config.host}`
      } as TaskResult;
    }
  });
  
  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(chalk.green(`✅ 并行 SSH 执行完成: ${successCount} 成功, ${failureCount} 失败`));
  
  return results;
}

/**
 * 创建多 SSH 任务
 * @param configs SSH 配置数组
 * @param parallel 是否并行执行
 * @returns Gulp 任务函数
 */
export function createMultiSSHTask(configs: SSHConfig[], parallel: boolean = false): TaskFunction {
  return async function multiSSHExecution(cb) {
    try {
      console.log(chalk.blue(`🔗 开始${parallel ? '并行' : '串行'}执行 ${configs.length} 个 SSH 任务...`));
      
      // 验证所有配置
      for (const config of configs) {
        const errors = sshHelpers.validateConfig(config);
        if (errors.length > 0) {
          throw new Error(`SSH 配置错误 (${config.host}): ${errors.join(', ')}`);
        }
      }
      
      let results: TaskResult[];
      
      if (parallel) {
        results = await parallelSSHExecution(configs);
      } else {
        results = await batchSSHExecution(configs);
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const totalCommands = results.reduce((sum, r) => sum + (r.fileCount || 0), 0);
      
      if (failureCount > 0) {
        console.log(chalk.yellow(`⚠️ 部分 SSH 执行失败:`));
        results.filter(r => !r.success).forEach(result => {
          console.log(chalk.red(`  - ${result.message}`));
        });
      }
      
      console.log(chalk.green(`✅ 多 SSH 任务完成: ${successCount} 服务器成功, ${failureCount} 失败, 共执行 ${totalCommands} 个命令`));
      
      if (failureCount > 0 && successCount === 0) {
        cb(new Error('所有 SSH 任务都失败了'));
      } else {
        cb();
      }
    } catch (error) {
      console.error(chalk.red('❌ 多 SSH 任务执行失败:'), error);
      cb(error);
    }
  };
}

/**
 * SSH 工具函数
 */
export const sshHelpers = {
  /**
   * 测试 SSH 连接
   * @param config SSH 配置（不包含命令）
   */
  testConnection: (config: Omit<SSHConfig, 'commands'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const conn = new Client();

      conn.on('ready', () => {
        console.log(chalk.green('✅ SSH 连接测试成功'));
        conn.end();
        resolve(true);
      });

      conn.on('error', (error) => {
        console.error(chalk.red('❌ SSH 连接测试失败:'), error);
        resolve(false);
      });

      const connectConfig: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
      };

      if (config.password) {
        connectConfig.password = config.password;
      } else if (config.privateKey) {
        try {
          connectConfig.privateKey = fs.readFileSync(config.privateKey);
        } catch (error) {
          console.error(chalk.red('❌ 读取私钥文件失败:'), error);
          resolve(false);
          return;
        }
      }

      conn.connect(connectConfig);
    });
  },

  /**
   * 执行单个命令并返回结果
   * @param config SSH 配置
   * @param command 单个命令
   */
  executeCommand: async (config: Omit<SSHConfig, 'commands'>, command: string): Promise<{ stdout: string; stderr: string; code: number }> => {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        executeCommand(conn, command, config.verbose || false)
          .then(result => {
            conn.end();
            resolve(result);
          })
          .catch(error => {
            conn.end();
            reject(error);
          });
      });

      conn.on('error', (error) => {
        reject(error);
      });

      const connectConfig: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
      };

      if (config.password) {
        connectConfig.password = config.password;
      } else if (config.privateKey) {
        try {
          connectConfig.privateKey = fs.readFileSync(config.privateKey);
        } catch (error) {
          reject(error);
          return;
        }
      }

      conn.connect(connectConfig);
    });
  },

  /**
   * 创建常用的命令模板
   */
  commands: {
    /**
     * 重启服务
     * @param serviceName 服务名称
     */
    restartService: (serviceName: string) => `sudo systemctl restart ${serviceName}`,

    /**
     * 检查服务状态
     * @param serviceName 服务名称
     */
    checkService: (serviceName: string) => `sudo systemctl status ${serviceName}`,

    /**
     * 部署应用
     * @param appPath 应用路径
     */
    deployApp: (appPath: string) => [
      `cd ${appPath}`,
      'git pull origin main',
      'npm install',
      'npm run build',
      'pm2 restart all'
    ],

    /**
     * 清理日志
     * @param logPath 日志路径
     * @param days 保留天数
     */
    cleanLogs: (logPath: string, days: number = 7) => 
      `find ${logPath} -name "*.log" -mtime +${days} -delete`,

    /**
     * 备份数据库
     * @param dbName 数据库名
     * @param backupPath 备份路径
     */
    backupDatabase: (dbName: string, backupPath: string) => 
      `mysqldump -u root -p ${dbName} > ${backupPath}/${dbName}_$(date +%Y%m%d_%H%M%S).sql`,

    /**
     * 检查磁盘空间
     */
    checkDiskSpace: () => 'df -h',

    /**
     * 检查内存使用
     */
    checkMemory: () => 'free -h',

    /**
     * 检查 CPU 使用
     */
    checkCPU: () => 'top -bn1 | grep "Cpu(s)"',

    /**
     * 检查进程
     * @param processName 进程名称
     */
    checkProcess: (processName: string) => `ps aux | grep ${processName}`
  },

  /**
   * 验证 SSH 配置
   * @param config SSH 配置
   */
  validateConfig: (config: SSHConfig): string[] => {
    const errors: string[] = [];

    if (!config.host) errors.push('缺少服务器主机地址');
    if (!config.username) errors.push('缺少用户名');
    if (!config.password && !config.privateKey) errors.push('缺少密码或私钥');
    if (!config.commands || (Array.isArray(config.commands) && config.commands.length === 0)) {
      errors.push('缺少要执行的命令');
    }

    return errors;
  }
};