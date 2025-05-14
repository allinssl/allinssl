import type { LocalSyncConfig } from '../types';
import type { Logger } from "./logger";
import fs from 'fs-extra';
import path from 'path';
import picomatch from 'picomatch'; // For glob matching if not using regex directly
import os from "os";
import { exec as execCallback } from "child_process";

// 使用Promise包装exec函数，不依赖util.promisify
const exec = (command: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    execCallback(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// 缓存已创建的临时压缩文件
interface CompressionCache {
  [sourcePathKey: string]: {
    zipFile: string; // 压缩文件路径
    excludeOptions: string; // 排除选项字符串
    expiry: number; // 过期时间戳
  };
}

// 全局压缩缓存对象
const compressionCache: CompressionCache = {};

// 缓存过期时间（毫秒）
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

/**
 * 处理源路径，将'/'特殊字符解释为工作区根目录
 * @param sourcePath 原始配置的源路径
 * @param workspaceRoot 工作区根目录
 * @returns 处理后的实际源路径
 */
function resolveSourcePath(sourcePath: string, workspaceRoot: string): string {
  // 如果源路径是'/'，则将其解释为工作区根目录
  if (sourcePath === "/") {
    return workspaceRoot;
  }
  // 否则正常解析路径
  return path.resolve(workspaceRoot, sourcePath);
}

/**
 * 创建临时目录用于压缩操作
 * @returns 临时目录路径
 */
async function createTempDir(): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `turborepo-deploy-${Date.now()}`);
  await fs.ensureDir(tempDir);
  return tempDir;
}

/**
 * 生成排除选项字符串
 * @param config 同步配置
 * @param sourcePath 源路径
 * @param targetPath 目标路径
 * @param tempDir 临时目录
 * @returns 排除选项字符串
 */
function generateExcludeOptions(
  config: LocalSyncConfig,
  sourcePath: string,
  targetPath: string,
  tempDir: string,
): string {
  let excludeOptions = "";

  // 处理排除目录
  if (config.excludeDirs && config.excludeDirs.length > 0) {
    const excludeDirsFormatted = config.excludeDirs
      .map((dir) => {
        // 移除通配符，获取基本目录名
        const baseDirName = dir.replace(/^\*\*\//, "");
        return `-x "*${baseDirName}*"`;
      })
      .join(" ");
    excludeOptions += ` ${excludeDirsFormatted}`;
  }

  // 处理排除文件
  if (config.excludeFiles && config.excludeFiles.length > 0) {
    const excludeFilesFormatted = config.excludeFiles
      .map((file) => {
        return `-x "*${file.replace(/^\*\*\//, "")}*"`;
      })
      .join(" ");
    excludeOptions += ` ${excludeFilesFormatted}`;
  }

  // 处理正则排除
  if (config.exclude && config.exclude.length > 0) {
    const excludeRegexFormatted = config.exclude
      .map((pattern) => {
        return `-x "*${pattern}*"`;
      })
      .join(" ");
    excludeOptions += ` ${excludeRegexFormatted}`;
  }

  // 始终排除目标路径，避免递归
  const relativeTargetPath = path.relative(sourcePath, targetPath);
  if (relativeTargetPath) {
    excludeOptions += ` -x "*${relativeTargetPath}*"`;
  }

  // 排除所有.sync-git目录
  excludeOptions += ` -x "*.sync-git*"`;

  // 排除临时目录
  excludeOptions += ` -x "*${path.basename(tempDir)}*"`;

  return excludeOptions;
}

/**
 * 获取缓存键
 * @param sourcePath 源路径
 * @param config 同步配置
 * @returns 缓存键
 */
function getCacheKey(sourcePath: string, config: LocalSyncConfig): string {
  // 使用源路径和排除规则作为缓存键
  return `${sourcePath}_${JSON.stringify({
    excludeDirs: config.excludeDirs || [],
    excludeFiles: config.excludeFiles || [],
    exclude: config.exclude || [],
  })}`;
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const key in compressionCache) {
    if (compressionCache[key].expiry < now) {
      // 尝试删除过期的缓存文件
      try {
        if (fs.existsSync(compressionCache[key].zipFile)) {
          fs.unlinkSync(compressionCache[key].zipFile);
        }
      } catch (e) {
        // 忽略删除错误
      }
      delete compressionCache[key];
    }
  }
}

/**
 * 使用压缩方式处理源目录到子目录的复制，支持缓存
 * @param sourcePath 源路径
 * @param targetPath 目标路径
 * @param config 同步配置
 * @param logger 日志记录器
 */
async function syncViaCompression(
  sourcePath: string,
  targetPath: string,
  config: LocalSyncConfig,
  logger: Logger,
): Promise<void> {
  logger.info(`目标路径是源路径的子目录或相同路径，使用压缩方案同步...`);

  // 清理过期缓存
  cleanExpiredCache();

  // 获取缓存键
  const cacheKey = getCacheKey(sourcePath, config);

  // 创建临时目录(可能不需要，取决于是否有缓存)
  let tempDir: string | null = null;
  let tempZipFile: string;
  let needToCreateZip = true;

  // 检查缓存
  if (compressionCache[cacheKey]) {
    // 使用缓存的压缩文件
    logger.info(`找到源路径 ${sourcePath} 的缓存压缩文件，跳过压缩步骤`);
    tempZipFile = compressionCache[cacheKey].zipFile;
    needToCreateZip = false;
  } else {
    // 创建新的临时目录和压缩文件
    tempDir = await createTempDir();
    tempZipFile = path.join(tempDir, "source.zip");
  }

  try {
    if (needToCreateZip) {
      // 需要创建新的压缩文件
      const excludeOptions = generateExcludeOptions(
        config,
        sourcePath,
        targetPath,
        tempDir!,
      );

      // 压缩源目录内容到临时文件
      logger.info(`压缩源目录 ${sourcePath} 到临时文件 ${tempZipFile}...`);
      const zipCmd = `cd "${sourcePath}" && zip -r "${tempZipFile}" .${excludeOptions}`;
      logger.verbose(`执行命令: ${zipCmd}`);
      await exec(zipCmd);

      // 将新创建的压缩文件加入缓存
      compressionCache[cacheKey] = {
        zipFile: tempZipFile,
        excludeOptions: excludeOptions,
        expiry: Date.now() + CACHE_TTL,
      };
      logger.verbose(
        `已将压缩文件添加到缓存，缓存键: ${cacheKey.substring(0, 30)}...`,
      );
    }

    // 清空目标目录（如果配置了clearTarget）
    if (config.clearTarget) {
      logger.info(`清空目标目录 ${targetPath}...`);
      await fs.emptyDir(targetPath);
    }
    await fs.ensureDir(targetPath);

    // 解压缩到目标目录
    logger.info(`解压临时文件到目标目录 ${targetPath}...`);
    const unzipCmd = `unzip -o "${tempZipFile}" -d "${targetPath}"`;
    logger.verbose(`执行命令: ${unzipCmd}`);
    await exec(unzipCmd);

    logger.info(`成功通过压缩方案同步 ${sourcePath} 到 ${targetPath}`);
  } catch (error: any) {
    logger.error(`压缩同步过程出错: ${error.message}`, error);

    // 发生错误时，从缓存中移除该条目
    if (compressionCache[cacheKey]) {
      delete compressionCache[cacheKey];
    }

    throw error;
  } finally {
    // 只清理我们在这次调用中创建的临时目录
    // 缓存的临时文件会在过期后或进程结束时清理
    if (tempDir && needToCreateZip) {
      try {
        // 只移除临时目录，不移除压缩文件(已添加到缓存)
        const tempDirFiles = await fs.readdir(tempDir);
        for (const file of tempDirFiles) {
          if (file !== path.basename(tempZipFile)) {
            await fs.remove(path.join(tempDir, file));
          }
        }
      } catch (cleanupError) {
        logger.warn(`清理临时文件失败: ${cleanupError}`);
      }
    }
  }
}

export async function performLocalSync(
  configs: LocalSyncConfig[],
  workspaceRoot: string,
  logger: Logger,
): Promise<void> {
  logger.info("开始本地文件同步...");

  for (const config of configs) {
    // 使用新的源路径解析函数
    const sourcePath = resolveSourcePath(config.source, workspaceRoot);

    // 输出实际的源路径，方便调试
    if (config.source === "/") {
      logger.info(`源路径 '/' 被解析为工作区根目录: ${sourcePath}`);
    }

    // 检查源路径是否存在
    if (!(await fs.pathExists(sourcePath))) {
      logger.warn(`源路径 ${sourcePath} 不存在。跳过此同步任务。`);
      continue;
    }

    // 将所有目标统一处理为数组
    const targets = Array.isArray(config.target)
      ? config.target
      : [config.target];

    logger.info(`为源路径 ${sourcePath} 处理 ${targets.length} 个目标`);

    // 对每个目标路径执行同步
    for (const target of targets) {
      const targetPath = path.resolve(workspaceRoot, target);

      // 检查目标路径是否是源路径的子目录或相同目录
      const isSubdirectory =
        targetPath.startsWith(sourcePath + path.sep) ||
        targetPath === sourcePath;

      logger.info(
        `正在同步 ${sourcePath} 到 ${targetPath} (模式: ${config.mode || "incremental"})`,
      );

      try {
        // 如果目标是源的子目录，使用压缩方案
        if (isSubdirectory) {
          logger.info(
            `目标路径 ${targetPath} 是源路径 ${sourcePath} 的子目录或相同目录，使用压缩同步方案。`,
          );
          await syncViaCompression(sourcePath, targetPath, config, logger);
          logger.info(`成功同步 ${config.source} 到 ${target}`);
          continue;
        }

        // 以下是原来的同步逻辑，处理非子目录的情况
        if (config.clearTarget) {
          logger.info(`正在清空目标目录 ${targetPath}...`);
          await fs.emptyDir(targetPath);
        }

        await fs.ensureDir(path.dirname(targetPath)); // 确保目标父目录存在

        const options: fs.CopyOptions = {
          overwrite: config.mode !== "copy" && !config.addOnly, // 镜像和增量模式时覆盖
          errorOnExist: false, // 避免在copy模式时出错
          filter: (src, dest) => {
            if (config.addOnly && fs.existsSync(dest)) {
              logger.verbose(`跳过 ${src} 因为它已存在于目标中 (仅添加模式)`);
              return false;
            }

            // 获取相对于源路径的相对路径
            const relativeSrc = path.relative(sourcePath, src);

            // 如果是根目录的情况，需要特殊处理以匹配排除规则
            if (config.source === "/" && relativeSrc) {
              // 检查是否匹配任何排除目录
              const firstSegment = relativeSrc.split(path.sep)[0];

              // 检查顶级目录是否在排除列表中
              if (
                config.excludeDirs?.some((dir) => {
                  // 去掉可能的通配符前缀，获取基本目录名
                  const baseDirName = dir.replace(/^\*\*\//, "");
                  return (
                    firstSegment === baseDirName ||
                    picomatch.isMatch(relativeSrc, dir)
                  );
                })
              ) {
                logger.verbose(
                  `排除目录 ${relativeSrc} 因为匹配 'excludeDirs' glob/正则`,
                );
                return false;
              }
            }

            // 正则排除（文件和目录）
            if (
              config.exclude?.some((pattern) =>
                new RegExp(pattern).test(relativeSrc),
              )
            ) {
              logger.verbose(`排除 ${relativeSrc} 因为匹配 'exclude' 正则`);
              return false;
            }

            const stats = fs.statSync(src);
            if (stats.isDirectory()) {
              if (
                config.excludeDirs?.some((pattern) =>
                  picomatch.isMatch(relativeSrc, pattern),
                )
              ) {
                logger.verbose(
                  `排除目录 ${relativeSrc} 因为匹配 'excludeDirs' glob/正则`,
                );
                return false;
              }
            } else {
              if (
                config.excludeFiles?.some((pattern) =>
                  picomatch.isMatch(relativeSrc, pattern),
                )
              ) {
                logger.verbose(
                  `排除文件 ${relativeSrc} 因为匹配 'excludeFiles' glob/正则`,
                );
                return false;
              }
            }
            return true;
          },
        };

        if (config.mode === "mirror") {
          // 对于镜像模式，fs-extra的copySync/copy不会删除多余的文件
          logger.info(
            `正在镜像同步 ${sourcePath} 到 ${targetPath}。注意：真正的镜像可能需要目标为空或由'clearTarget'处理`,
          );

          // 实现真正的镜像模式
          if (!config.clearTarget) {
            // 如果未使用clearTarget，我们需要自己实现镜像逻辑
            // 1. 获取目标中的所有文件
            const targetFiles = await getAllFiles(targetPath);

            // 2. 复制源到目标
            await fs.copy(sourcePath, targetPath, options);

            // 3. 重新获取所有源文件（现在已复制到目标）
            const sourceFiles = await getAllFiles(sourcePath);
            const sourceRelativePaths = sourceFiles.map((file) =>
              path.relative(sourcePath, file),
            );

            // 4. 删除目标中不在源中的文件
            for (const targetFile of targetFiles) {
              const relativePath = path.relative(targetPath, targetFile);
              if (
                !sourceRelativePaths.includes(relativePath) &&
                fs.statSync(targetFile).isFile()
              ) {
                logger.verbose(`删除目标中多余的文件: ${targetFile}`);
                await fs.remove(targetFile);
              }
            }
          } else {
            // 如果使用了clearTarget，直接复制即可
            await fs.copy(sourcePath, targetPath, options);
          }
        } else {
          // 复制或增量模式
          await fs.copy(sourcePath, targetPath, options);
        }

        logger.info(`成功同步 ${config.source} 到 ${target}`);
      } catch (error: any) {
        logger.error(
          `从 ${sourcePath} 同步到 ${targetPath} 时出错: ${error.message}`,
          error,
        );
        // 软错误：继续执行其他任务
      }
    }
  }
  logger.info("本地文件同步完成");
}

/**
 * 递归获取目录中的所有文件路径
 * @param dir 要扫描的目录
 * @returns 文件路径数组
 */
async function getAllFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const subFiles = await getAllFiles(filePath);
      results = results.concat(subFiles);
    } else {
      results.push(filePath);
    }
  }
  return results;
} 