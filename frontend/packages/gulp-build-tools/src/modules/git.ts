import { TaskFunction } from 'gulp';
import { GitConfig, TaskResult } from '../types.js';
import chalk from 'chalk';
import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';

/**
 * 创建 Git 操作任务
 * @param config Git 配置
 * @returns Gulp 任务函数
 */
export function createGitTask(config: GitConfig): TaskFunction {
  return async function gitOperation(cb) {
    try {
      const git: SimpleGit = simpleGit({
        baseDir: config.repoPath || process.cwd(),
        binary: 'git',
        maxConcurrentProcesses: 6,
      });

      console.log(chalk.blue(`🔧 执行 Git 操作: ${config.action}`));
      console.log(chalk.gray(`仓库路径: ${config.repoPath || process.cwd()}`));

      switch (config.action) {
        case 'commit':
          await handleCommit(git, config);
          break;
        case 'pull':
          await handlePull(git, config);
          break;
        case 'push':
          await handlePush(git, config);
          break;
        case 'checkout':
          await handleCheckout(git, config);
          break;
        case 'branch':
          await handleBranch(git, config);
          break;
        case 'merge':
          await handleMerge(git, config);
          break;
        default:
          throw new Error(`不支持的 Git 操作: ${config.action}`);
      }

      console.log(chalk.green(`✅ Git 操作完成: ${config.action}`));
      cb();
    } catch (error) {
      console.error(chalk.red(`❌ Git 操作失败: ${config.action}`), error);
      cb(error);
    }
  };
}

/**
 * 处理提交操作
 */
async function handleCommit(git: SimpleGit, config: GitConfig) {
  console.log(chalk.yellow('📝 准备提交代码...'));

  // 检查是否有未提交的更改
  const status = await git.status();
  if (status.files.length === 0) {
    console.log(chalk.yellow('⚠️ 没有文件需要提交'));
    return;
  }

  // 添加文件
  if (config.files) {
    if (Array.isArray(config.files)) {
      for (const file of config.files) {
        await git.add(file);
        console.log(chalk.cyan(`添加文件: ${file}`));
      }
    } else {
      await git.add(config.files);
      console.log(chalk.cyan(`添加文件: ${config.files}`));
    }
  } else {
    await git.add('.');
    console.log(chalk.cyan('添加所有更改的文件'));
  }

  // 提交
  const message = config.message || `自动提交 - ${new Date().toLocaleString()}`;
  await git.commit(message);
  console.log(chalk.green(`✅ 提交完成: ${message}`));

  // 显示提交信息
  const log = await git.log({ maxCount: 1 });
  if (log.latest) {
    console.log(chalk.gray(`提交哈希: ${log.latest.hash}`));
    console.log(chalk.gray(`提交时间: ${log.latest.date}`));
  }
}

/**
 * 处理拉取操作
 */
async function handlePull(git: SimpleGit, config: GitConfig) {
  console.log(chalk.yellow('⬇️ 拉取远程代码...'));

  const remote = config.remote || 'origin';
  const branch = config.branch;

  if (branch) {
    await git.pull(remote, branch);
    console.log(chalk.green(`✅ 拉取完成: ${remote}/${branch}`));
  } else {
    await git.pull();
    console.log(chalk.green(`✅ 拉取完成`));
  }

  // 显示最新提交信息
  const log = await git.log({ maxCount: 1 });
  if (log.latest) {
    console.log(chalk.gray(`最新提交: ${log.latest.message}`));
    console.log(chalk.gray(`提交作者: ${log.latest.author_name}`));
  }
}

/**
 * 处理推送操作
 */
async function handlePush(git: SimpleGit, config: GitConfig) {
  console.log(chalk.yellow('⬆️ 推送代码到远程...'));

  const remote = config.remote || 'origin';
  const branch = config.branch;

  if (branch) {
    await git.push(remote, branch);
    console.log(chalk.green(`✅ 推送完成: ${remote}/${branch}`));
  } else {
    await git.push();
    console.log(chalk.green(`✅ 推送完成`));
  }
}

/**
 * 处理分支切换操作
 */
async function handleCheckout(git: SimpleGit, config: GitConfig) {
  if (!config.branch) {
    throw new Error('切换分支需要指定分支名称');
  }

  console.log(chalk.yellow(`🔄 切换到分支: ${config.branch}`));

  // 检查分支是否存在
  const branches = await git.branch();
  const branchExists = branches.all.includes(config.branch);

  if (branchExists) {
    await git.checkout(config.branch);
    console.log(chalk.green(`✅ 切换到分支: ${config.branch}`));
  } else {
    // 创建并切换到新分支
    await git.checkoutLocalBranch(config.branch);
    console.log(chalk.green(`✅ 创建并切换到新分支: ${config.branch}`));
  }

  // 显示当前分支信息
  const currentBranch = await git.branch();
  console.log(chalk.gray(`当前分支: ${currentBranch.current}`));
}

/**
 * 处理分支操作
 */
async function handleBranch(git: SimpleGit, config: GitConfig) {
  if (!config.branch) {
    // 列出所有分支
    console.log(chalk.yellow('📋 列出所有分支...'));
    const branches = await git.branch();
    
    console.log(chalk.green('本地分支:'));
    Object.entries(branches.branches).forEach(([name, branch]) => {
      const marker = name === branches.current ? ' * ' : '   ';
      console.log(chalk.gray(`${marker}${name}`));
    });

    if (Object.keys(branches.branches).some(name => name.startsWith('remotes/'))) {
      console.log(chalk.green('\n远程分支:'));
      Object.keys(branches.branches)
        .filter(name => name.startsWith('remotes/'))
        .forEach(name => {
          console.log(chalk.gray(`   ${name}`));
        });
    }
  } else {
    // 创建新分支
    console.log(chalk.yellow(`🌿 创建新分支: ${config.branch}`));
    await git.checkoutLocalBranch(config.branch);
    console.log(chalk.green(`✅ 分支创建完成: ${config.branch}`));
  }
}

/**
 * 处理合并操作
 */
async function handleMerge(git: SimpleGit, config: GitConfig) {
  if (!config.branch) {
    throw new Error('合并操作需要指定要合并的分支');
  }

  console.log(chalk.yellow(`🔀 合并分支: ${config.branch}`));

  try {
    await git.merge([config.branch]);
    console.log(chalk.green(`✅ 分支合并完成: ${config.branch}`));
  } catch (error: any) {
    if (error.message.includes('CONFLICTS')) {
      console.log(chalk.red('❌ 合并冲突，需要手动解决'));
      
      // 显示冲突文件
      const status = await git.status();
      if (status.conflicted.length > 0) {
        console.log(chalk.yellow('冲突文件:'));
        status.conflicted.forEach(file => {
          console.log(chalk.red(`  - ${file}`));
        });
      }
      throw error;
    } else {
      throw error;
    }
  }
}

/**
 * 批量执行 Git 操作
 * @param configs Git 配置数组
 * @returns Promise<TaskResult[]>
 */
export async function batchGitOperation(configs: GitConfig[]): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  
  for (const config of configs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createGitTask(config);
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
        message: `Git 操作成功: ${config.action}`,
        fileCount: 1
      });
    } catch (error) {
      results.push({
        success: false,
        error: error as Error,
        message: `Git 操作失败: ${config.action}`
      });
    }
  }
  
  return results;
}

/**
 * 并行执行 Git 操作
 * @param configs Git 配置数组
 * @returns Promise<TaskResult[]>
 */
export async function parallelGitOperation(configs: GitConfig[]): Promise<TaskResult[]> {
  console.log(chalk.blue(`🔧 开始并行执行 ${configs.length} 个 Git 操作...`));
  
  const promises = configs.map(async (config, index) => {
    try {
      await new Promise<void>((resolve, reject) => {
        const task = createGitTask(config);
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
        message: `Git 操作成功 [${index + 1}]: ${config.action}`,
        fileCount: 1
      } as TaskResult;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: `Git 操作失败 [${index + 1}]: ${config.action}`
      } as TaskResult;
    }
  });
  
  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(chalk.green(`✅ 并行 Git 操作完成: ${successCount} 成功, ${failureCount} 失败`));
  
  return results;
}

/**
 * 创建多 Git 操作任务
 * @param configs Git 配置数组
 * @param parallel 是否并行执行
 * @returns Gulp 任务函数
 */
export function createMultiGitTask(configs: GitConfig[], parallel: boolean = false): TaskFunction {
  return async function multiGitOperation(cb) {
    try {
      console.log(chalk.blue(`🔧 开始${parallel ? '并行' : '串行'}执行 ${configs.length} 个 Git 操作...`));
      
      let results: TaskResult[];
      
      if (parallel) {
        results = await parallelGitOperation(configs);
      } else {
        results = await batchGitOperation(configs);
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      if (failureCount > 0) {
        console.log(chalk.yellow(`⚠️ 部分操作失败:`));
        results.filter(r => !r.success).forEach(result => {
          console.log(chalk.red(`  - ${result.message}`));
        });
      }
      
      console.log(chalk.green(`✅ 多 Git 操作完成: ${successCount} 成功, ${failureCount} 失败`));
      
      if (failureCount > 0 && successCount === 0) {
        cb(new Error('所有 Git 操作都失败了'));
      } else {
        cb();
      }
    } catch (error) {
      console.error(chalk.red('❌ 多 Git 操作执行失败:'), error);
      cb(error);
    }
  };
}

/**
 * Git 工具函数
 */
export const gitHelpers = {
  /**
   * 检查 Git 仓库状态
   * @param repoPath 仓库路径
   */
  checkStatus: async (repoPath?: string) => {
    const git = simpleGit(repoPath || process.cwd());
    const status = await git.status();
    
    return {
      clean: status.files.length === 0,
      ahead: status.ahead,
      behind: status.behind,
      modified: status.modified,
      staged: status.staged,
      deleted: status.deleted,
      created: status.created,
      conflicted: status.conflicted
    };
  },

  /**
   * 获取当前分支名
   * @param repoPath 仓库路径
   */
  getCurrentBranch: async (repoPath?: string): Promise<string> => {
    const git = simpleGit(repoPath || process.cwd());
    const branch = await git.branch();
    return branch.current;
  },

  /**
   * 检查是否有未提交的更改
   * @param repoPath 仓库路径
   */
  hasUncommittedChanges: async (repoPath?: string): Promise<boolean> => {
    const git = simpleGit(repoPath || process.cwd());
    const status = await git.status();
    return status.files.length > 0;
  },

  /**
   * 获取最新提交信息
   * @param repoPath 仓库路径
   */
  getLatestCommit: async (repoPath?: string) => {
    const git = simpleGit(repoPath || process.cwd());
    const log = await git.log({ maxCount: 1 });
    return log.latest;
  },

  /**
   * 验证 Git 配置
   * @param config Git 配置
   */
  validateConfig: (config: GitConfig): string[] => {
    const errors: string[] = [];

    if (!config.action) {
      errors.push('缺少 Git 操作类型');
    }

    if (config.action === 'commit' && !config.message && !config.files) {
      errors.push('提交操作需要指定提交信息或文件');
    }

    if (['checkout', 'merge'].includes(config.action) && !config.branch) {
      errors.push(`${config.action} 操作需要指定分支名称`);
    }

    return errors;
  }
};