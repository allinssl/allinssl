// plugin/vite-plugin-turborepo-deploy/src/core/utils.ts

import path from "path";
import fs from "fs-extra";

/**
 * 检测并获取 Turborepo 工作区根目录
 * 通过查找 turbo.json 或 package.json 中的 workspaces 配置来确定
 * 
 * @param startDir 开始搜索的目录（通常是 Vite 项目根目录）
 * @returns 工作区根目录的绝对路径，如果未找到则返回 startDir
 */
export function findWorkspaceRoot(startDir: string): string {
  let currentDir = startDir;
  
  // 限制向上查找的层级，避免无限循环
  const maxLevels = 10;
  let level = 0;
  
  while (level < maxLevels) {
    // 检查 turbo.json 是否存在（Turborepo 项目标志）
    if (fs.existsSync(path.join(currentDir, "turbo.json"))) {
      return currentDir;
    }
    
    // 检查 package.json 中的 workspaces 配置（pnpm/yarn/npm workspace）
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = fs.readJSONSync(packageJsonPath);
        if (packageJson.workspaces || packageJson.pnpm?.workspaces) {
          return currentDir;
        }
      } catch (error) {
        // 如果读取出错，继续向上查找
      }
    }
    
    // 检查 pnpm-workspace.yaml（pnpm workspace）
    if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }
    
    // 向上一级目录继续搜索
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // 已经到达根目录，停止搜索
      break;
    }
    
    currentDir = parentDir;
    level++;
  }
  
  // 未找到工作区根目录，返回原始目录
  return startDir;
}

/**
 * 解析相对于工作区根目录的路径
 * @param viteRoot Vite项目的根目录
 * @param relativePath 要解析的相对路径
 * @returns 绝对路径
 */
export function resolvePath(viteRoot: string, relativePath: string): string {
  const workspaceRoot = findWorkspaceRoot(viteRoot);
  return path.resolve(workspaceRoot, relativePath);
}

/**
 * 创建带有时间戳的错误对象，可以标记为关键错误
 * @param message 错误消息
 * @param isCritical 是否为关键错误（会中断整个流程）
 * @returns 带有附加属性的Error对象
 */
export function createError(
  message: string,
  isCritical = false,
): Error & { isCritical: boolean; timestamp: Date } {
  const error = new Error(message) as Error & {
    isCritical: boolean;
    timestamp: Date;
  };
  error.isCritical = isCritical;
  error.timestamp = new Date();
  return error;
}

/**
 * 确保目录存在，如果不存在则创建
 * @param dirPath 目录路径
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param date 日期对象
 * @returns 格式化的日期字符串
 */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * 检查路径是否为绝对路径
 * @param filePath 文件路径
 * @returns 是否为绝对路径
 */
export function isAbsolutePath(filePath: string): boolean {
  return path.isAbsolute(filePath);
}

/**
 * 安全地删除文件，如果文件不存在则忽略错误
 * @param filePath 文件路径
 */
export async function safeRemoveFile(filePath: string): Promise<void> {
  try {
    await fs.remove(filePath);
  } catch (error) {
    // 如果文件不存在，忽略错误
    if (error instanceof Error && error.message === "ENOENT") {
      // 将未知类型的 error 转换为正确的类型或处理可能不存在的 code 属性
      return;
    }
    throw error;
  }
}

/**
 * 正規化多個路徑，解決跨平台兼容性問題
 * @param paths 需要正規化的路徑數組
 * @returns 正規化後的路徑數組
 */
export function normalizePaths(...paths: string[]): string[] {
  return paths.map((p) => path.normalize(p));
}

/**
 * 檢查目標路徑是否是源路徑的子目錄或相同目錄
 * 使用路徑正規化處理，確保跨平台兼容性
 * @param targetPath 目標路徑
 * @param sourcePath 源路徑
 * @returns 如果目標路徑是源路徑的子目錄或相同目錄則返回 true
 */
export function isSubdirectoryOf(
  targetPath: string,
  sourcePath: string,
): boolean {
  // 正規化路徑以確保跨平台兼容性
  const normalizedTarget = path.normalize(targetPath);
  const normalizedSource = path.normalize(sourcePath);

  // 檢查是否為子目錄或相同目錄
  return (
    normalizedTarget.startsWith(normalizedSource + path.sep) ||
    normalizedTarget === normalizedSource
  );
}

/**
 * 檢查路徑關係的詳細信息，便於調試
 * @param targetPath 目標路徑
 * @param sourcePath 源路徑
 * @returns 包含檢查詳情的對象
 */
export function analyzePathRelationship(
  targetPath: string,
  sourcePath: string,
): {
  isSubdirectory: boolean;
  normalizedTarget: string;
  normalizedSource: string;
  startsWithCheck: boolean;
  equalityCheck: boolean;
  separator: string;
} {
  const normalizedTarget = path.normalize(targetPath);
  const normalizedSource = path.normalize(sourcePath);
  const startsWithCheck = normalizedTarget.startsWith(
    normalizedSource + path.sep,
  );
  const equalityCheck = normalizedTarget === normalizedSource;

  return {
    isSubdirectory: startsWithCheck || equalityCheck,
    normalizedTarget,
    normalizedSource,
    startsWithCheck,
    equalityCheck,
    separator: path.sep,
  };
} 