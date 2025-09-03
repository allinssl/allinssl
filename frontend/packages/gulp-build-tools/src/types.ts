import { TaskFunction } from 'gulp';

/**
 * 文件重命名配置
 */
export interface RenameConfig {
  /** 源路径模式 */
  src: string | string[];
  /** 重命名函数或新名称 */
  rename: string | ((path: any) => void);
  /** 目标目录 */
  dest: string;
}

/**
 * 文件内容替换配置
 */
export interface ReplaceConfig {
  /** 源文件路径模式 */
  src: string | string[];
  /** 替换规则数组 */
  replacements: Array<{
    /** 要替换的内容 (支持正则表达式) */
    search: string | RegExp;
    /** 替换为的内容 */
    replace: string | ((match: string, ...args: any[]) => string);
  }>;
  /** 目标目录 */
  dest: string;
}

/**
 * FTP/SFTP 上传配置
 */
export interface UploadConfig {
  /** 协议类型 */
  type: 'ftp' | 'sftp';
  /** 服务器主机 */
  host: string;
  /** 端口号 */
  port?: number;
  /** 用户名 */
  username: string;
  /** 密码 */
  password?: string;
  /** 私钥路径 (SFTP) */
  privateKey?: string;
  /** 远程目录 */
  remotePath: string;
  /** 本地文件路径模式 */
  src: string | string[];
  /** 是否并行上传 */
  parallel?: boolean;
  /** 上传前是否清空远程目录 */
  clean?: boolean;
}

/**
 * 压缩配置
 */
export interface CompressConfig {
  /** 源文件路径模式 */
  src: string | string[];
  /** 压缩文件名 */
  filename: string;
  /** 输出目录 */
  dest: string;
  /** 压缩类型 */
  type?: 'zip' | 'tar' | 'gzip';
  /** 压缩级别 (0-9) */
  level?: number;
}

/**
 * Git 操作配置
 */
export interface GitConfig {
  /** Git 仓库路径 */
  repoPath?: string;
  /** 操作类型 */
  action: 'commit' | 'pull' | 'push' | 'checkout' | 'branch' | 'merge';
  /** 提交信息 (commit 时使用) */
  message?: string;
  /** 分支名称 */
  branch?: string;
  /** 远程仓库名称 */
  remote?: string;
  /** 要添加的文件模式 */
  files?: string | string[];
}

/**
 * SSH 命令执行配置
 */
export interface SSHConfig {
  /** 服务器主机 */
  host: string;
  /** 端口号 */
  port?: number;
  /** 用户名 */
  username: string;
  /** 密码 */
  password?: string;
  /** 私钥路径 */
  privateKey?: string;
  /** 要执行的命令 */
  commands: string | string[];
  /** 是否显示命令输出 */
  verbose?: boolean;
}

/**
 * 构建工具配置
 */
export interface BuildToolsConfig {
  /** 项目根目录 */
  cwd?: string;
  /** 是否显示详细日志 */
  verbose?: boolean;
  /** 临时目录 */
  tempDir?: string;
}

/**
 * 任务结果
 */
export interface TaskResult {
  /** 是否成功 */
  success: boolean;
  /** 结果消息 */
  message?: string;
  /** 错误信息 */
  error?: Error;
  /** 处理的文件数量 */
  fileCount?: number;
}

/**
 * 构建工具实例接口
 */
export interface BuildTools {
  /** 重命名文件/文件夹 */
  renameFiles(config: RenameConfig): TaskFunction;
  
  /** 替换文件内容 */
  replaceContent(config: ReplaceConfig): TaskFunction;
  
  /** 上传文件 */
  uploadFiles(config: UploadConfig): TaskFunction;
  
  /** 压缩文件 */
  compressFiles(config: CompressConfig): TaskFunction;
  
  /** Git 操作 */
  gitOperation(config: GitConfig): TaskFunction;
  
  /** SSH 命令执行 */
  sshExecution(config: SSHConfig): TaskFunction;
  
  /** 多 Git 操作 (支持并行和串行) */
  multiGitOperation(configs: GitConfig[], parallel?: boolean): TaskFunction;
  
  /** 多目标上传 (支持并行和串行) */
  multiUpload(configs: UploadConfig[], parallel?: boolean): TaskFunction;
  
  /** 多 SSH 任务 (支持并行和串行) */
  multiSSHExecution(configs: SSHConfig[], parallel?: boolean): TaskFunction;
  
  /** 多压缩任务 (支持并行和串行) */
  multiCompress(configs: CompressConfig[], parallel?: boolean): TaskFunction;
}