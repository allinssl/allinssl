import { TaskFunction, series, parallel } from 'gulp';
import { 
  BuildTools, 
  BuildToolsConfig, 
  RenameConfig, 
  ReplaceConfig, 
  UploadConfig, 
  CompressConfig, 
  GitConfig, 
  SSHConfig,
  TaskResult 
} from './types.js';

// 导入各个功能模块
import { createRenameTask, batchRename, renameHelpers } from './modules/rename.js';
import { createReplaceTask, batchReplace, replacePatterns } from './modules/replace.js';
import { createUploadTask, batchUpload, parallelUpload, createMultiUploadTask, uploadHelpers } from './modules/upload.js';
import { createCompressTask, batchCompress, parallelCompress, createMultiCompressTask, compressHelpers } from './modules/compress.js';
import { createGitTask, batchGitOperation, parallelGitOperation, createMultiGitTask, gitHelpers } from './modules/git.js';
import { createSSHTask, batchSSHExecution, parallelSSHExecution, createMultiSSHTask, sshHelpers } from './modules/ssh.js';

import chalk from 'chalk';

/**
 * 构建工具主类
 */
export class GulpBuildTools implements BuildTools {
  private config: BuildToolsConfig;

  constructor(config: BuildToolsConfig = {}) {
    this.config = {
      cwd: process.cwd(),
      verbose: false,
      tempDir: './temp',
      ...config
    };

    if (this.config.verbose) {
      console.log(chalk.blue('🚀 初始化 Gulp 构建工具'));
      console.log(chalk.gray(`工作目录: ${this.config.cwd}`));
      console.log(chalk.gray(`临时目录: ${this.config.tempDir}`));
    }
  }

  /**
   * 重命名文件/文件夹
   */
  renameFiles(config: RenameConfig): TaskFunction {
    return createRenameTask(config);
  }

  /**
   * 替换文件内容
   */
  replaceContent(config: ReplaceConfig): TaskFunction {
    return createReplaceTask(config);
  }

  /**
   * 上传文件
   */
  uploadFiles(config: UploadConfig): TaskFunction {
    return createUploadTask(config);
  }

  /**
   * 压缩文件
   */
  compressFiles(config: CompressConfig): TaskFunction {
    return createCompressTask(config);
  }

  /**
   * Git 操作
   */
  gitOperation(config: GitConfig): TaskFunction {
    return createGitTask(config);
  }

  /**
   * SSH 命令执行
   */
  sshExecution(config: SSHConfig): TaskFunction {
    return createSSHTask(config);
  }

  /**
   * 多 Git 操作 (支持并行和串行)
   */
  multiGitOperation(configs: GitConfig[], parallel: boolean = false): TaskFunction {
    return createMultiGitTask(configs, parallel);
  }

  /**
   * 多目标上传 (支持并行和串行)
   */
  multiUpload(configs: UploadConfig[], parallel: boolean = false): TaskFunction {
    return createMultiUploadTask(configs, parallel);
  }

  /**
   * 多 SSH 任务 (支持并行和串行)
   */
  multiSSHExecution(configs: SSHConfig[], parallel: boolean = false): TaskFunction {
    return createMultiSSHTask(configs, parallel);
  }

  /**
   * 多压缩任务 (支持并行和串行)
   */
  multiCompress(configs: CompressConfig[], parallel: boolean = false): TaskFunction {
    return createMultiCompressTask(configs, parallel);
  }

  /**
   * 创建组合任务 - 构建和部署流水线
   */
  createBuildPipeline(configs: {
    replace?: ReplaceConfig[];
    rename?: RenameConfig[];
    compress?: CompressConfig;
    git?: GitConfig;
    upload?: UploadConfig;
    ssh?: SSHConfig;
  }): TaskFunction {
    const tasks: TaskFunction[] = [];

    // 添加替换任务
    if (configs.replace) {
      configs.replace.forEach((config, index) => {
        const task = this.replaceContent(config);
        Object.defineProperty(task, 'displayName', { value: `replace-${index + 1}` });
        tasks.push(task);
      });
    }

    // 添加重命名任务
    if (configs.rename) {
      configs.rename.forEach((config, index) => {
        const task = this.renameFiles(config);
        Object.defineProperty(task, 'displayName', { value: `rename-${index + 1}` });
        tasks.push(task);
      });
    }

    // 添加压缩任务
    if (configs.compress) {
      const task = this.compressFiles(configs.compress);
      Object.defineProperty(task, 'displayName', { value: 'compress' });
      tasks.push(task);
    }

    // 添加 Git 操作
    if (configs.git) {
      const task = this.gitOperation(configs.git);
      Object.defineProperty(task, 'displayName', { value: 'git' });
      tasks.push(task);
    }

    // 添加上传任务
    if (configs.upload) {
      const task = this.uploadFiles(configs.upload);
      Object.defineProperty(task, 'displayName', { value: 'upload' });
      tasks.push(task);
    }

    // 添加 SSH 命令执行
    if (configs.ssh) {
      const task = this.sshExecution(configs.ssh);
      Object.defineProperty(task, 'displayName', { value: 'ssh' });
      tasks.push(task);
    }

    const pipeline = series(...tasks);
    Object.defineProperty(pipeline, 'displayName', { value: 'build-pipeline' });
    
    return pipeline;
  }

  /**
   * 创建并行任务
   */
  createParallelTasks(tasks: { [key: string]: TaskFunction }): TaskFunction {
    const taskArray = Object.values(tasks);
    const parallelTask = parallel(...taskArray);
    Object.defineProperty(parallelTask, 'displayName', { value: 'parallel-tasks' });
    return parallelTask;
  }

  /**
   * 创建串行任务
   */
  createSeriesTasks(tasks: { [key: string]: TaskFunction }): TaskFunction {
    const taskArray = Object.values(tasks);
    const seriesTask = series(...taskArray);
    Object.defineProperty(seriesTask, 'displayName', { value: 'series-tasks' });
    return seriesTask;
  }
}

/**
 * 创建构建工具实例
 */
export function createBuildTools(config?: BuildToolsConfig): GulpBuildTools {
  return new GulpBuildTools(config);
}

/**
 * 批量操作工具
 */
export const batchOperations = {
  rename: batchRename,
  replace: batchReplace,
  upload: batchUpload,
  compress: batchCompress,
  git: batchGitOperation,
  ssh: batchSSHExecution
};

/**
 * 并行操作工具
 */
export const parallelOperations = {
  upload: parallelUpload,
  git: parallelGitOperation,
  ssh: parallelSSHExecution,
  compress: parallelCompress
};

/**
 * 多任务操作工具
 */
export const multiTaskOperations = {
  git: createMultiGitTask,
  upload: createMultiUploadTask,
  ssh: createMultiSSHTask,
  compress: createMultiCompressTask
};

/**
 * 工具函数
 */
export const helpers = {
  rename: renameHelpers,
  replace: replacePatterns,
  upload: uploadHelpers,
  compress: compressHelpers,
  git: gitHelpers,
  ssh: sshHelpers
};

/**
 * 预设配置模板
 */
export const presets = {
  /**
   * 前端项目构建预设
   */
  frontend: {
    /**
     * Vue/React 项目部署
     */
    vueDeploy: (config: {
      buildDir: string;
      serverConfig: UploadConfig;
      sshConfig?: SSHConfig;
    }) => ({
      replace: [{
        src: [`${config.buildDir}/**/*.html`],
        replacements: [
          replacePatterns.timestamp()
        ],
        dest: config.buildDir
      }],
      compress: {
        src: [`${config.buildDir}/**/*`],
        filename: `dist-${new Date().toISOString().slice(0, 10)}.zip`,
        dest: './releases'
      },
      upload: config.serverConfig,
      ssh: config.sshConfig
    }),

    /**
     * 静态资源优化
     */
    optimize: (buildDir: string) => ({
      replace: [{
        src: [`${buildDir}/**/*.html`],
        replacements: [
          { search: /\s+/g, replace: ' ' }, // 压缩空白
          { search: /<!--[\s\S]*?-->/g, replace: '' } // 移除注释
        ],
        dest: buildDir
      }]
    })
  },

  /**
   * 后端项目部署预设
   */
  backend: {
    /**
     * Node.js 项目部署
     */
    nodeDeploy: (config: {
      appPath: string;
      serverConfig: UploadConfig;
      sshConfig: SSHConfig;
    }) => ({
      git: {
        action: 'commit' as const,
        message: `部署 - ${new Date().toLocaleString()}`,
        files: '.'
      },
      upload: config.serverConfig,
      ssh: {
        ...config.sshConfig,
        commands: [
          `cd ${config.appPath}`,
          'git pull origin main',
          'npm install --production',
          'pm2 restart all'
        ]
      }
    })
  },

  /**
   * 通用部署预设
   */
  general: {
    /**
     * 备份和部署
     */
    backupAndDeploy: (config: {
      srcDir: string;
      backupDir: string;
      deployConfig: UploadConfig;
    }) => ({
      compress: {
        src: [`${config.srcDir}/**/*`],
        filename: compressHelpers.timestampedFilename('backup'),
        dest: config.backupDir
      },
      upload: config.deployConfig
    })
  }
};

// 导出所有类型
export type {
  BuildTools,
  BuildToolsConfig,
  RenameConfig,
  ReplaceConfig,
  UploadConfig,
  CompressConfig,
  GitConfig,
  SSHConfig,
  TaskResult
};

// 默认导出
export default GulpBuildTools;