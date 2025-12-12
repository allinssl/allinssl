/**
 * 本地文件同步模塊 - 跨平台實現
 *
 * 使用 Node.js 原生庫實現跨平台文件壓縮和解壓功能：
 * - archiver: 跨平台壓縮庫，替代 Unix zip 命令
 * - yauzl: 跨平台解壓庫，替代 Unix unzip 命令
 * - fs-extra: 增強的文件系統操作
 *
 * 支持 Windows、Linux、macOS 等所有 Node.js 支持的平台
 */

import type { LocalSyncConfig } from "../types";
import type { Logger } from "./logger";
import fs from "fs-extra";
import path from "path";
import picomatch from "picomatch"; // For glob matching if not using regex directly
import os from "os";
import archiver from "archiver";
import yauzl from "yauzl";
import { isSubdirectoryOf, analyzePathRelationship } from "./utils";

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
 * 生成排除模式數組，適配 archiver 庫的 ignore 選項
 * @param config 同步配置
 * @param sourcePath 源路径
 * @param targetPath 目标路径
 * @param tempDir 临时目录
 * @returns 排除模式數組
 */
function generateExcludePatterns(
  config: LocalSyncConfig,
  sourcePath: string,
  targetPath: string,
  tempDir: string,
): string[] {
  const excludePatterns: string[] = [];

  // 處理排除目錄
  if (config.excludeDirs && config.excludeDirs.length > 0) {
    config.excludeDirs.forEach((dir) => {
      // 移除通配符前綴，轉換為 glob 模式
      const baseDirName = dir.replace(/^\*\*\//, "");
      excludePatterns.push(`**/${baseDirName}/**`);
      excludePatterns.push(`${baseDirName}/**`);
    });
  }

  // 處理排除文件
  if (config.excludeFiles && config.excludeFiles.length > 0) {
    config.excludeFiles.forEach((file) => {
      const baseFileName = file.replace(/^\*\*\//, "");
      excludePatterns.push(`**/${baseFileName}`);
      excludePatterns.push(`${baseFileName}`);
    });
  }

  // 處理正則排除
  if (config.exclude && config.exclude.length > 0) {
    config.exclude.forEach((pattern) => {
      // 將正則模式轉換為 glob 模式
      excludePatterns.push(`**/*${pattern}*`);
      excludePatterns.push(`*${pattern}*`);
    });
  }

  // 始終排除目標路徑，避免遞歸
  const relativeTargetPath = path.relative(sourcePath, targetPath);
  if (relativeTargetPath && relativeTargetPath !== ".") {
    excludePatterns.push(`${relativeTargetPath}/**`);
    excludePatterns.push(`**/${relativeTargetPath}/**`);
  }

  // 排除所有 .sync-git 目錄
  excludePatterns.push("**/.sync-git/**");
  excludePatterns.push(".sync-git/**");

  // 排除臨時目錄
  const tempDirName = path.basename(tempDir);
  excludePatterns.push(`**/${tempDirName}/**`);
  excludePatterns.push(`${tempDirName}/**`);

  return excludePatterns;
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
 * 處理同步錯誤，提供具體的診斷信息和解決建議
 * @param error 捕獲的錯誤
 * @param sourcePath 源路徑
 * @param targetPath 目標路徑
 * @param config 同步配置
 * @param logger 日誌記錄器
 */
function handleSyncError(
  error: Error,
  sourcePath: string,
  targetPath: string,
  config: LocalSyncConfig,
  logger: Logger,
): void {
  logger.error(`❌ 同步失敗: ${sourcePath} -> ${targetPath}`);

  // 根據錯誤類型提供具體的診斷和建議
  const errorMessage = error.message.toLowerCase();

  if (
    errorMessage.includes("cannot copy") &&
    errorMessage.includes("subdirectory")
  ) {
    logger.error(`🚨 檢測到自引用複製錯誤 - 這正是我們修復的問題！`);
    logger.error(`   錯誤詳情: ${error.message}`);
    logger.error(`   這表示路徑檢測邏輯可能仍有問題，請檢查:`);
    logger.error(`     1. 源路徑: ${sourcePath}`);
    logger.error(`     2. 目標路徑: ${targetPath}`);
    logger.error(`     3. 路徑關係檢測是否正確工作`);
    logger.error(`   💡 解決方案:`);
    logger.error(`     - 確保目標路徑不是源路徑的子目錄`);
    logger.error(`     - 或者使用相對路徑配置`);
    logger.error(`     - 檢查 excludeDirs 配置是否包含目標目錄`);
  } else if (
    errorMessage.includes("enoent") ||
    errorMessage.includes("no such file")
  ) {
    logger.error(`📁 文件或目錄不存在錯誤`);
    logger.error(`   錯誤詳情: ${error.message}`);
    logger.error(`   💡 解決方案:`);
    logger.error(`     - 檢查源路徑是否存在: ${sourcePath}`);
    logger.error(`     - 確保父目錄有寫入權限`);
    logger.error(`     - 檢查路徑中是否包含特殊字符`);
  } else if (
    errorMessage.includes("eacces") ||
    errorMessage.includes("permission denied")
  ) {
    logger.error(`🔒 權限錯誤`);
    logger.error(`   錯誤詳情: ${error.message}`);
    logger.error(`   💡 解決方案:`);
    logger.error(`     - 檢查目標目錄的寫入權限`);
    logger.error(`     - 確保沒有文件被其他程序占用`);
    logger.error(`     - 在 Windows 上可能需要以管理員身份運行`);
  } else if (
    errorMessage.includes("enospc") ||
    errorMessage.includes("no space")
  ) {
    logger.error(`💾 磁盤空間不足錯誤`);
    logger.error(`   錯誤詳情: ${error.message}`);
    logger.error(`   💡 解決方案:`);
    logger.error(`     - 清理磁盤空間`);
    logger.error(`     - 檢查目標磁盤的可用空間`);
  } else if (
    errorMessage.includes("emfile") ||
    errorMessage.includes("too many open files")
  ) {
    logger.error(`📂 文件句柄過多錯誤`);
    logger.error(`   錯誤詳情: ${error.message}`);
    logger.error(`   💡 解決方案:`);
    logger.error(`     - 增加系統文件句柄限制`);
    logger.error(`     - 檢查是否有文件泄漏`);
    logger.error(`     - 考慮使用 excludeDirs 減少處理的文件數量`);
  } else {
    logger.error(`❓ 未知錯誤`);
    logger.error(`   錯誤詳情: ${error.message}`);
    logger.error(`   💡 通用解決方案:`);
    logger.error(`     - 檢查網絡連接（如果涉及遠程路徑）`);
    logger.error(`     - 確保所有路徑都是有效的`);
    logger.error(`     - 嘗試減少同步的文件數量`);
  }

  // 提供配置建議
  logger.error(`⚙️  當前配置信息:`);
  logger.error(`     模式: ${config.mode || "incremental"}`);
  logger.error(`     清空目標: ${config.clearTarget || false}`);
  logger.error(`     僅添加: ${config.addOnly || false}`);
  logger.error(`     排除目錄數量: ${config.excludeDirs?.length || 0}`);
  logger.error(`     排除文件數量: ${config.excludeFiles?.length || 0}`);

  // 記錄完整的錯誤棧以便調試
  logger.verbose(`完整錯誤棧: ${error.stack}`);
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
      const excludePatterns = generateExcludePatterns(
        config,
        sourcePath,
        targetPath,
        tempDir!,
      );

      // 使用跨平台壓縮函數
      logger.info(`压缩源目录 ${sourcePath} 到临时文件 ${tempZipFile}...`);
      await createZipWithArchiver(
        sourcePath,
        tempZipFile,
        excludePatterns,
        logger,
      );

      // 将新创建的压缩文件加入缓存
      compressionCache[cacheKey] = {
        zipFile: tempZipFile,
        excludeOptions: excludePatterns.join(","),
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

    // 使用跨平台解壓函數
    logger.info(`解压临时文件到目标目录 ${targetPath}...`);
    await extractZipWithYauzl(tempZipFile, targetPath, logger);

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

/**
 * 使用 archiver 庫創建跨平台壓縮文件
 * @param sourcePath 源路徑
 * @param targetZipFile 目標zip文件路徑
 * @param excludePatterns 排除模式數組
 * @param logger 日誌記錄器
 * @returns Promise<void>
 */
async function createZipWithArchiver(
  sourcePath: string,
  targetZipFile: string,
  excludePatterns: string[],
  logger: Logger,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 確保目標目錄存在
    fs.ensureDirSync(path.dirname(targetZipFile));

    // 創建輸出流
    const output = fs.createWriteStream(targetZipFile);

    // 創建歸檔器實例，使用最高壓縮級別
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    // 監聽輸出流事件
    output.on("close", () => {
      logger.info(`壓縮完成，總共 ${archive.pointer()} 字節`);
      resolve();
    });

    output.on("error", (err) => {
      logger.error(`輸出流錯誤: ${err.message}`);
      reject(err);
    });

    // 監聽歸檔器錯誤事件
    archive.on("error", (err) => {
      logger.error(`壓縮過程錯誤: ${err.message}`);
      reject(err);
    });

    // 監聽進度事件
    archive.on("progress", (progress) => {
      logger.verbose(
        `壓縮進度: 已處理 ${progress.entries.processed}/${progress.entries.total} 個條目`,
      );
    });

    // 將歸檔器輸出管道連接到文件
    archive.pipe(output);

    try {
      // 添加目錄及其內容，使用排除規則
      archive.glob("**/*", {
        cwd: sourcePath,
        ignore: excludePatterns,
        dot: true, // 包含隱藏文件
      });

      logger.info(`開始壓縮 ${sourcePath} 到 ${targetZipFile}...`);
      logger.verbose(`排除模式: ${excludePatterns.join(", ")}`);

      // 完成歸檔器
      archive.finalize();
    } catch (error: any) {
      logger.error(`壓縮設置錯誤: ${error.message}`);
      reject(error);
    }
  });
}

/**
 * 使用 yauzl 庫創建跨平台解壓文件
 * @param zipFile 壓縮文件路徑
 * @param targetPath 目標解壓路徑
 * @param logger 日誌記錄器
 * @returns Promise<void>
 */
async function extractZipWithYauzl(
  zipFile: string,
  targetPath: string,
  logger: Logger,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 確保目標目錄存在
    fs.ensureDirSync(targetPath);

    let extractedCount = 0;
    let totalEntries = 0;

    // 打開 zip 文件
    yauzl.open(zipFile, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        logger.error(`無法打開壓縮文件 ${zipFile}: ${err.message}`);
        reject(err);
        return;
      }

      if (!zipfile) {
        const error = new Error("zipfile is undefined");
        logger.error(`壓縮文件對象為空: ${zipFile}`);
        reject(error);
        return;
      }

      totalEntries = zipfile.entryCount;
      logger.info(
        `開始解壓 ${zipFile} 到 ${targetPath}，共 ${totalEntries} 個條目`,
      );

      // 監聽條目事件
      zipfile.on("entry", (entry) => {
        const entryPath = entry.fileName;
        const fullPath = path.join(targetPath, entryPath);

        // 路徑安全檢查，防止目錄遍歷攻擊
        const normalizedPath = path.normalize(fullPath);
        if (!normalizedPath.startsWith(path.normalize(targetPath))) {
          logger.error(`檢測到不安全的路徑: ${entryPath}`);
          zipfile.readEntry();
          return;
        }

        // 檢查是否為目錄
        if (entryPath.endsWith("/")) {
          // 創建目錄
          fs.ensureDirSync(fullPath);
          logger.verbose(`創建目錄: ${entryPath}`);
          extractedCount++;

          // 繼續讀取下一個條目
          zipfile.readEntry();
        } else {
          // 提取文件
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              logger.error(`無法讀取文件 ${entryPath}: ${err.message}`);
              reject(err);
              return;
            }

            if (!readStream) {
              logger.error(`讀取流為空: ${entryPath}`);
              reject(new Error(`無法創建讀取流: ${entryPath}`));
              return;
            }

            // 確保父目錄存在
            fs.ensureDirSync(path.dirname(fullPath));

            // 創建寫入流
            const writeStream = fs.createWriteStream(fullPath);

            // 處理流錯誤
            readStream.on("error", (err) => {
              logger.error(`讀取流錯誤 ${entryPath}: ${err.message}`);
              reject(err);
            });

            writeStream.on("error", (err) => {
              logger.error(`寫入流錯誤 ${entryPath}: ${err.message}`);
              reject(err);
            });

            // 文件寫入完成
            writeStream.on("close", () => {
              extractedCount++;
              logger.verbose(
                `提取文件: ${entryPath} (${extractedCount}/${totalEntries})`,
              );

              // 繼續讀取下一個條目
              zipfile.readEntry();
            });

            // 將讀取流管道連接到寫入流
            readStream.pipe(writeStream);
          });
        }
      });

      // 監聽結束事件
      zipfile.on("end", () => {
        logger.info(`解壓完成，共提取 ${extractedCount} 個條目`);
        resolve();
      });

      // 監聽錯誤事件
      zipfile.on("error", (err) => {
        logger.error(`解壓過程錯誤: ${err.message}`);
        reject(err);
      });

      // 開始讀取第一個條目
      zipfile.readEntry();
    });
  });
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
      // 使用工具函數進行路徑比較，確保跨平台兼容性
      const pathAnalysis = analyzePathRelationship(targetPath, sourcePath);
      const isSubdirectory = isSubdirectoryOf(targetPath, sourcePath);

      // 添加详细的路径调试日誌輸出
      logger.verbose(`路径正规化处理:`);
      logger.verbose(
        `  源路径: ${sourcePath} -> ${pathAnalysis.normalizedSource}`,
      );
      logger.verbose(
        `  目标路径: ${targetPath} -> ${pathAnalysis.normalizedTarget}`,
      );

      logger.verbose(`子目录检测结果: ${isSubdirectory}`);
      if (isSubdirectory) {
        logger.verbose(`子目录检测详情:`);
        logger.verbose(`  startsWith 检查: ${pathAnalysis.startsWithCheck}`);
        logger.verbose(`  相等检查: ${pathAnalysis.equalityCheck}`);
        logger.verbose(`  路径分隔符: '${pathAnalysis.separator}'`);
      }

      // 配置驗證和用戶友好的錯誤處理
      await validateAndWarnPathConfiguration(
        config,
        sourcePath,
        targetPath,
        isSubdirectory,
        pathAnalysis,
        logger,
      );

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
        // 增強的錯誤處理，提供具體的診斷信息
        handleSyncError(error, sourcePath, targetPath, config, logger);
        // 软错误：继续执行其他任务
      }
    }
  }
  logger.info("本地文件同步完成");
}

/**
 * 驗證路徑配置並提供用戶友好的警告和建議
 * @param config 同步配置
 * @param sourcePath 源路徑
 * @param targetPath 目標路徑
 * @param isSubdirectory 是否為子目錄
 * @param pathAnalysis 路徑分析結果
 * @param logger 日誌記錄器
 */
async function validateAndWarnPathConfiguration(
  config: LocalSyncConfig,
  sourcePath: string,
  targetPath: string,
  isSubdirectory: boolean,
  pathAnalysis: ReturnType<typeof analyzePathRelationship>,
  logger: Logger,
): Promise<void> {
  // 檢查相同路徑的情況
  if (pathAnalysis.equalityCheck) {
    logger.warn(`⚠️  源路徑和目標路徑相同: ${sourcePath}`);
    logger.warn(`   這可能表示配置錯誤，請檢查您的 localSync 配置`);
    logger.warn(`   建議：修改 target 路徑以避免自我複製`);
    return;
  }

  // 檢查子目錄情況的配置建議
  if (isSubdirectory) {
    logger.info(`🔍 檢測到目標路徑是源路徑的子目錄，將使用壓縮方案`);

    // 針對不同模式提供建議
    if (config.mode === "mirror") {
      logger.warn(`⚠️  鏡像模式 + 子目錄配置可能導致不必要的複雜性`);
      logger.warn(`   建議：考慮使用 'copy' 或 'incremental' 模式`);
    }

    // 檢查是否缺少必要的排除配置
    if (!config.excludeDirs || config.excludeDirs.length === 0) {
      logger.warn(`⚠️  子目錄同步時建議配置 excludeDirs 以避免無限遞歸`);
      logger.warn(
        `   建議：添加 excludeDirs: ['.sync-git', 'node_modules', '.git']`,
      );
    }

    // 特別警告常見的錯誤模式
    const relativePath = path.relative(sourcePath, targetPath);
    if (relativePath.includes(".sync-git")) {
      logger.info(`✅ 檢測到目標在 .sync-git 目錄中，這是推薦的配置`);
    } else {
      logger.warn(`⚠️  目標路徑不在 .sync-git 目錄中: ${relativePath}`);
      logger.warn(`   建議：將目標設置為 '.sync-git/your-target' 以保持組織性`);
    }
  }

  // 檢查路徑格式問題
  if (sourcePath.includes("\\") && targetPath.includes("/")) {
    logger.warn(`⚠️  檢測到混合路徑分隔符，已自動正規化處理`);
    logger.info(`   原始: 源='${sourcePath}' 目標='${targetPath}'`);
    logger.info(
      `   正規化: 源='${pathAnalysis.normalizedSource}' 目標='${pathAnalysis.normalizedTarget}'`,
    );
  }

  // 檢查潛在的性能問題
  if (config.source === "/" && !config.excludeDirs?.includes("node_modules")) {
    logger.warn(`⚠️  從根目錄 '/' 同步時強烈建議排除 node_modules`);
    logger.warn(
      `   建議：添加 excludeDirs: ['node_modules', '.git', 'dist', 'build']`,
    );
  }
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
