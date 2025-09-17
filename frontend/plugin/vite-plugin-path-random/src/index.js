import fs from "fs";
import path from "path";
import { glob } from "glob";
import os from "os";

// 全局随机参数变量，在插件初始化时设置
let randomParam = null;

// Windows兼容性常量
const WINDOWS_RESERVED_NAMES = [
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
];
const WINDOWS_INVALID_CHARS = /[<>:"|?*\x00-\x1f]/g;
const MAX_PATH_LENGTH = 260; // Windows MAX_PATH限制
const MAX_FILENAME_LENGTH = 255; // 大多数文件系统的文件名长度限制

/**
 * Windows兼容性工具函数
 */

/**
 * 检查是否为Windows系统
 * @returns {boolean} 是否为Windows
 */
function isWindows() {
  return os.platform() === "win32";
}

/**
 * 规范化Windows文件名
 * @param {string} filename - 原始文件名
 * @returns {string} 规范化后的文件名
 */
function normalizeWindowsFilename(filename) {
  if (!isWindows()) {
    return filename;
  }

  // 移除无效字符
  let normalized = filename.replace(WINDOWS_INVALID_CHARS, "_");

  // 移除尾部的点和空格
  normalized = normalized.replace(/[. ]+$/, "");

  // 检查保留名称
  const baseName = normalized.split(".")[0].toUpperCase();
  if (WINDOWS_RESERVED_NAMES.includes(baseName)) {
    normalized = `_${normalized}`;
  }

  // 限制文件名长度
  if (normalized.length > MAX_FILENAME_LENGTH) {
    const ext = path.extname(normalized);
    const nameWithoutExt = path.basename(normalized, ext);
    const maxNameLength = MAX_FILENAME_LENGTH - ext.length;
    normalized = nameWithoutExt.substring(0, maxNameLength) + ext;
  }

  return normalized;
}

/**
 * 检查路径长度是否超出Windows限制
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否超出限制
 */
function isPathTooLong(filePath) {
  return isWindows() && filePath.length > MAX_PATH_LENGTH;
}

/**
 * 生成Windows兼容的安全时间戳
 * @returns {string} 安全的时间戳字符串
 */
function generateSafeTimestamp() {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .substring(0, 19); // 移除毫秒部分

  return normalizeWindowsFilename(timestamp);
}

/**
 * 规范化glob模式以确保Windows兼容性
 * @param {string} pattern - glob模式
 * @returns {string} 规范化后的glob模式
 */
function normalizeGlobPattern(pattern) {
  if (!pattern) return pattern;

  // 在Windows系统中，确保glob模式使用正斜杠
  // glob库在Windows中也期望使用正斜杠作为路径分隔符
  if (isWindows()) {
    return pattern.replace(/\\/g, "/");
  }

  return pattern;
}

/**
 * 创建Windows兼容的glob选项
 * @param {Object} baseOptions - 基础选项
 * @returns {Object} 兼容的glob选项
 */
function createWindowsCompatibleGlobOptions(baseOptions = {}) {
  const options = { ...baseOptions };

  if (isWindows()) {
    // Windows特定的glob选项
    options.windowsPathsNoEscape = true;
    options.nonull = false; // 避免返回无匹配的模式
    options.dot = options.dot !== false; // 默认包含点文件
  }

  return options;
}

/**
 * 规范化目录路径用于glob搜索
 * @param {string} dirPath - 目录路径
 * @returns {string} 规范化后的目录路径
 */
function normalizeGlobDirectory(dirPath) {
  if (!dirPath) return dirPath;

  // 规范化路径
  let normalized = path.normalize(dirPath);

  // 在Windows中，将反斜杠转换为正斜杠用于glob
  if (isWindows()) {
    normalized = normalized.replace(/\\/g, "/");
  }

  return normalized;
}

/**
 * 规范化文件路径，确保Windows兼容性
 * @param {string} filePath - 原始文件路径
 * @returns {string} 规范化后的路径
 */
function normalizeFilePath(filePath) {
  if (!filePath) return filePath;

  // 使用path.normalize处理路径分隔符
  let normalized = path.normalize(filePath);

  if (isWindows()) {
    // 处理文件名部分
    const dir = path.dirname(normalized);
    const filename = path.basename(normalized);
    const normalizedFilename = normalizeWindowsFilename(filename);
    normalized = path.join(dir, normalizedFilename);
  }

  return normalized;
}

/**
 * 验证文件路径的Windows兼容性
 * @param {string} filePath - 文件路径
 * @param {Object} options - 配置选项
 * @returns {Object} 验证结果 {valid: boolean, error?: string, normalized?: string}
 */
function validateFilePath(filePath, options = {}) {
  const result = { valid: true };

  try {
    // 规范化路径
    const normalized = normalizeFilePath(filePath);
    result.normalized = normalized;

    // 检查路径长度
    if (isPathTooLong(normalized)) {
      result.valid = false;
      result.error = `路径长度超出限制 (${normalized.length} > ${MAX_PATH_LENGTH})`;
      return result;
    }

    // 检查文件名
    const filename = path.basename(normalized);
    if (isWindows() && WINDOWS_INVALID_CHARS.test(filename)) {
      result.valid = false;
      result.error = `文件名包含Windows不支持的字符: ${filename}`;
      return result;
    }

    // 检查保留名称
    const baseName = path
      .basename(filename, path.extname(filename))
      .toUpperCase();
    if (isWindows() && WINDOWS_RESERVED_NAMES.includes(baseName)) {
      result.valid = false;
      result.error = `文件名使用了Windows保留名称: ${baseName}`;
      return result;
    }
  } catch (error) {
    result.valid = false;
    result.error = `路径验证失败: ${error.message}`;
  }

  return result;
}

/**
 * 生成随机数参数
 * @param {Object} options - 配置选项
 * @returns {string} 随机数字符串
 */
function generateRandomParam(options = {}, isFirstSet = false) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  if (
    options.customGenerator &&
    typeof options.customGenerator === "function"
  ) {
    return options.customGenerator(timestamp, randomStr);
  }
  return `${timestamp}${isFirstSet ? `_${randomStr}` : ""}`;
}

/**
 * 匹配文件中的CSS和JS引用
 * @param {string} content - 文件内容
 * @param {Object} options - 配置选项
 * @returns {string} 处理后的内容
 */
function processFileContent(content, options = {}) {
  let processedContent = content;

  // 处理HTML中的link标签 (CSS)
  processedContent = processedContent.replace(
    /(<link[^>]*href=["'])([^"']*\.css)([^"']*?)(["'][^>]*>)/gi,
    (match, prefix, filePath, queryParams, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${queryParams}${
              queryParams.includes("?") || filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }
      return `${prefix}${filePath}${queryParams}${
        queryParams.includes("?") || filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  // 处理HTML中的script标签 (JS)
  processedContent = processedContent.replace(
    /(<script[^>]*src=["'])([^"']*\.js)([^"']*?)(["'][^>]*>)/gi,
    (match, prefix, filePath, queryParams, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${queryParams}${
              queryParams.includes("?") || filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }
      return `${prefix}${filePath}${queryParams}${
        queryParams.includes("?") || filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  // 处理CSS中的@import
  processedContent = processedContent.replace(
    /(@import\s+["'])([^"']*\.css)(["'])/gi,
    (match, prefix, filePath, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${
              filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }
      return `${prefix}${filePath}${
        filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  // 处理CSS中的url()
  processedContent = processedContent.replace(
    /(url\(["']?)([^"')]*\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot))(["']?\))/gi,
    (match, prefix, filePath, fileExt, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${
              filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }

      return `${prefix}${filePath}${
        filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  // 处理JS中的import语句
  processedContent = processedContent.replace(
    /(import\s*(?:[^"']*?\s*from\s*)?["'])([^"']*\.(?:js|css|jsx|ts|tsx))(["'])/gi,
    (match, prefix, filePath, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${
              filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }
      return `${prefix}${filePath}${
        filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  // 处理JS中的require语句
  processedContent = processedContent.replace(
    /(require\(["'])([^"']*\.(js|css|jsx|ts|tsx))(["']\))/gi,
    (match, prefix, filePath, fileExt, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${
              filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }
      return `${prefix}${filePath}${
        filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  // 处理JS中的动态import()语句
  processedContent = processedContent.replace(
    /(import\(["'])([^"']*\.(js|css|jsx|ts|tsx))(["']\))/gi,
    (match, prefix, filePath, fileExt, suffix) => {
      if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://") ||
        filePath.startsWith("//")
      ) {
        return options.includeExternal
          ? `${prefix}${filePath}${
              filePath.includes("?") ? "&" : "?"
            }v=${randomParam}${suffix}`
          : match;
      }
      return `${prefix}${filePath}${
        filePath.includes("?") ? "&" : "?"
      }v=${randomParam}${suffix}`;
    }
  );

  return processedContent;
}

/**
 * 处理单个文件
 * @param {string} filePath - 文件路径
 * @param {Object} options - 配置选项
 */
function processSingleFile(filePath, options = {}) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const processedContent = processFileContent(content, options);

    if (content !== processedContent) {
      fs.writeFileSync(filePath, processedContent, "utf8");
      // if (options.logger) {
      //   options.logger(`✅ 已处理: ${filePath}`);
      // }
      return true;
    } else {
      if (options.logger) {
        options.logger(`⏭️  跳过: ${filePath} (无需处理)`);
      }
      return false;
    }
  } catch (error) {
    if (options.logger) {
      options.logger(`❌ 处理失败: ${filePath} - ${error.message}`);
    }
    return false;
  }
}

/**
 * 批量处理文件（增强版，支持备份和完整性检查）
 * @param {string} directory - 目录路径
 * @param {Object} options - 配置选项
 * @returns {Object} 详细的处理结果
 */
function processBatchFiles(directory, options = {}) {
  const defaultOptions = {
    patterns: ["**/*.html", "**/*.js"],
    ignore: [],
    createBackup: false, // 默认不创建备份，保持向后兼容
    enableIntegrityCheck: true, // 启用完整性检查
    continueOnError: true, // 遇到错误时继续处理其他文件
    maxRetries: 2, // 最大重试次数
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const stats = {
    processedCount: 0,
    totalCount: 0,
    modifiedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    backupFiles: [],
    errors: [],
    warnings: [],
  };

  // 确保目录路径是绝对路径
  const absoluteDir = path.isAbsolute(directory)
    ? directory
    : path.resolve(directory);

  // 验证目录路径的Windows兼容性
  const pathValidation = validateFilePath(absoluteDir);
  if (!pathValidation.valid) {
    const error = `目录路径不兼容: ${pathValidation.error}`;
    if (mergedOptions.logger) {
      mergedOptions.logger(`❌ ${error}`);
    }
    stats.errors.push({ file: "DIRECTORY_VALIDATION", error });
    return stats;
  }

  // 使用规范化后的路径
  const normalizedDir = pathValidation.normalized || absoluteDir;

  // 检查目录是否存在
  if (!fs.existsSync(normalizedDir)) {
    const error = `目录不存在: ${normalizedDir}`;
    if (mergedOptions.logger) {
      mergedOptions.logger(`❌ ${error}`);
    }
    stats.errors.push({ file: "DIRECTORY_CHECK", error });
    return stats;
  }

  if (mergedOptions.logger) {
    mergedOptions.logger(`🔍 扫描目录: ${normalizedDir}`);
  }

  try {
    // 收集所有要处理的文件
    let allFiles = [];

    mergedOptions.patterns.forEach((pattern) => {
      // 规范化glob模式以确保Windows兼容性
      const normalizedPattern = normalizeGlobPattern(pattern);
      const globDir = normalizeGlobDirectory(normalizedDir);
      const searchPattern = path.posix.join(globDir, normalizedPattern);
      const ignorePatterns = mergedOptions.ignore.map((ig) => {
        const normalizedIgnore = normalizeGlobPattern(ig);
        return path.posix.join(globDir, normalizedIgnore);
      });

      try {
        const globOptions = createWindowsCompatibleGlobOptions({
          ignore: ignorePatterns,
          absolute: true,
          nodir: true, // 只返回文件，不包括目录
        });

        // Windows调试信息
        if (isWindows() && mergedOptions.logger) {
          mergedOptions.logger(`🔍 Windows模式 - 搜索模式: ${searchPattern}`);
          mergedOptions.logger(
            `🔍 Windows模式 - 忽略模式: ${ignorePatterns.join(", ")}`
          );
        }

        const files = glob.sync(searchPattern, globOptions);

        if (mergedOptions.logger) {
          if (files.length > 0) {
            mergedOptions.logger(
              `📄 找到 ${files.length} 个匹配文件 (${pattern})`
            );
          } else {
            mergedOptions.logger(
              `⚠️  模式 "${pattern}" 未找到匹配文件${
                isWindows() ? " (Windows系统)" : ""
              }`
            );
          }
        }

        allFiles.push(...files);
      } catch (globError) {
        const error = `模式匹配失败 (${pattern}): ${globError.message}${
          isWindows() ? " [Windows系统]" : ""
        }`;
        stats.errors.push({
          file: pattern,
          error,
          platform: isWindows() ? "Windows" : "Unix",
          searchPattern,
          ignorePatterns,
        });
        if (mergedOptions.logger) {
          mergedOptions.logger(`❌ ${error}`);
          if (isWindows()) {
            mergedOptions.logger(`🔍 调试信息 - 搜索路径: ${searchPattern}`);
            mergedOptions.logger(
              `🔍 调试信息 - 目录存在: ${fs.existsSync(normalizedDir)}`
            );
          }
        }
      }
    });

    // 去重
    allFiles = [...new Set(allFiles)];
    stats.totalCount = allFiles.length;
    if (stats.totalCount === 0) {
      if (mergedOptions.logger) {
        mergedOptions.logger("⚠️  未找到匹配的文件");
      }
      return stats;
    }

    if (mergedOptions.logger) {
      mergedOptions.logger(`📊 总共找到 ${stats.totalCount} 个文件待处理`);
    }

    // 处理每个文件
    allFiles.forEach((file, index) => {
      if (mergedOptions.logger) {
        mergedOptions.logger(
          `\n[${index + 1}/${stats.totalCount}] 处理: ${path.relative(
            normalizedDir,
            file
          )}`
        );
      }

      // 验证单个文件路径
      const fileValidation = validateFilePath(file);
      if (!fileValidation.valid) {
        stats.failedCount++;
        stats.errors.push({
          file: path.relative(normalizedDir, file),
          error: `文件路径验证失败: ${fileValidation.error}`,
        });
        if (mergedOptions.logger) {
          mergedOptions.logger(`❌ 跳过无效文件: ${fileValidation.error}`);
        }
        return; // 跳过此文件
      }

      const normalizedFile = fileValidation.normalized || file;
      let retries = 0;
      let success = false;

      while (retries <= mergedOptions.maxRetries && !success) {
        try {
          stats.processedCount++;

          if (mergedOptions.createBackup) {
            // 使用安全处理函数
            const result = processSingleFileSafe(normalizedFile, mergedOptions);

            if (result.success) {
              success = true;
              if (result.modified) {
                stats.modifiedCount++;
                if (result.backupPath) {
                  stats.backupFiles.push(result.backupPath);
                }
              } else {
                stats.skippedCount++;
              }
            } else {
              throw new Error(result.error || "未知错误");
            }
          } else {
            // 使用原有的处理函数
            const modified = processSingleFile(normalizedFile, mergedOptions);
            success = true;

            if (modified) {
              stats.modifiedCount++;
            } else {
              stats.skippedCount++;
            }
          }
        } catch (error) {
          retries++;

          if (retries > mergedOptions.maxRetries) {
            stats.failedCount++;
            stats.errors.push({
              file: path.relative(absoluteDir, file),
              error: error.message,
              retries: retries - 1,
            });

            if (mergedOptions.logger) {
              mergedOptions.logger(
                `❌ 处理失败 (重试${retries - 1}次): ${error.message}`
              );
            }

            if (!mergedOptions.continueOnError) {
              throw error;
            }
          } else {
            if (mergedOptions.logger) {
              mergedOptions.logger(
                `⚠️  重试 ${retries}/${mergedOptions.maxRetries}: ${error.message}`
              );
            }
            // 短暂延迟后重试
            setTimeout(() => {}, 100);
          }
        }
      }
    });
  } catch (error) {
    const globalError = `批量处理过程中发生错误: ${error.message}`;
    stats.errors.push({ file: "BATCH_PROCESS", error: globalError });
    if (mergedOptions.logger) {
      mergedOptions.logger(`❌ ${globalError}`);
    }
  }

  // 输出详细统计信息
  if (mergedOptions.logger) {
    mergedOptions.logger("\n📊 处理完成统计:");
    mergedOptions.logger(`  总文件数: ${stats.totalCount}`);
    mergedOptions.logger(`  已处理: ${stats.processedCount}`);
    mergedOptions.logger(`  已修改: ${stats.modifiedCount}`);
    mergedOptions.logger(`  已跳过: ${stats.skippedCount}`);
    mergedOptions.logger(`  失败: ${stats.failedCount}`);

    if (stats.backupFiles.length > 0) {
      mergedOptions.logger(`  备份文件: ${stats.backupFiles.length}`);
    }

    if (stats.errors.length > 0) {
      mergedOptions.logger("\n❌ 错误详情:");
      stats.errors.forEach((err) => {
        mergedOptions.logger(`  ${err.file}: ${err.error}`);
      });
    }

    // 计算成功率
    const successRate =
      stats.totalCount > 0
        ? (
            ((stats.modifiedCount + stats.skippedCount) / stats.totalCount) *
            100
          ).toFixed(1)
        : 0;
    mergedOptions.logger(`\n✨ 成功率: ${successRate}%`);
  }

  return stats;
}

/**
 * Vite插件主函数
 * @param {Object} userOptions - 用户配置选项
 * @returns {Object} Vite插件对象
 */
export default function randomCachePlugin(userOptions = {}) {
  const defaultOptions = {
    // 是否包含外部链接
    includeExternal: false,
    // 文件匹配模式 - 编译后处理更多文件类型
    patterns: [
      "**/*.html",
      "**/*.js",
      "**/*.css",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx",
    ],
    // 忽略的文件/目录 - 编译后处理时不忽略输出目录
    ignore: ["node_modules/**"],
    // 是否启用日志
    enableLog: true,
    // 自定义随机数生成器
    customGenerator: null,
    // 处理模式: 'build' | 'serve' | 'both'
    mode: "build",
    // 输出目录路径（可选，用于指定特定的编译输出目录）
    outputDir: null,
  };

  const options = { ...defaultOptions, ...userOptions };

  // 在插件初始化时生成一次随机参数，确保整个构建过程使用同一个时间戳
  if (randomParam === null) {
    randomParam = generateRandomParam(options);
  }

  // 创建日志函数
  const logger = options.enableLog ? console.log : () => {};
  options.logger = logger;

  return {
    name: "vite-plugin-random-cache",

    // 配置解析完成时
    configResolved(config) {
      // 根据模式决定是否启用插件
      if (options.mode === "serve" && config.command === "build") {
        return;
      }
      if (options.mode === "build" && config.command === "serve") {
        return;
      }
    },
    // 插件启动时
    buildStart() {
      if (options.enableLog) {
        logger("🚀 Random Cache Plugin 已启动");
      }
    },

    // 编译完成时
    writeBundle(outputOptions, bundle) {
      // 在编译完成后处理目标文件路径
      const outputDir =
        options.outputDir ||
        outputOptions.dir ||
        (outputOptions.file ? path.dirname(outputOptions.file) : "dist");

      // 确保输出目录存在
      if (!fs.existsSync(outputDir)) {
        if (options.enableLog) {
          logger(`⚠️  输出目录不存在: ${outputDir}`);
        }
        return;
      }

      if (options.enableLog) {
        logger(`📁 开始处理编译输出目录: ${outputDir}`);
      }

      // 处理编译后的文件
      const result = processBatchFiles(outputDir, {
        ...options,
        patterns: options.patterns,
        ignore: [], // 不忽略任何文件，因为这是编译输出目录
      });

      if (options.enableLog) {
        logger(
          `🎯 编译后处理完成: ${result.processedCount}/${result.totalCount} 个文件被修改`
        );
      }
    },

    // 编辑结束
    buildEnd() {
      if (options.enableLog) {
        logger("✨ Random Cache Plugin 处理完成");
      }
    },
  };
}

/**
 * 创建文件备份
 * @param {string} filePath - 文件路径
 * @param {Object} options - 配置选项
 * @returns {string|null} 备份文件路径或null
 */
function createBackup(filePath, options = {}) {
  try {
    const backupDir =
      options.backupDir || path.join(path.dirname(filePath), ".backup");
    const timestamp = generateSafeTimestamp();
    const fileName = path.basename(filePath);
    const backupFileName = normalizeWindowsFilename(
      `${fileName}.${timestamp}.backup`
    );
    const backupPath = path.join(backupDir, backupFileName);

    // 检查路径长度
    if (isPathTooLong(backupPath)) {
      throw new Error(
        `备份路径过长 (${backupPath.length} > ${MAX_PATH_LENGTH}): ${backupPath}`
      );
    }

    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 复制原文件到备份位置
    fs.copyFileSync(filePath, backupPath);

    if (options.logger) {
      options.logger(`📋 已创建备份: ${backupPath}`);
    }

    return backupPath;
  } catch (error) {
    if (options.logger) {
      options.logger(`❌ 备份失败: ${filePath} - ${error.message}`);
    }
    return null;
  }
}

/**
 * 从备份恢复文件
 * @param {string} backupPath - 备份文件路径
 * @param {string} originalPath - 原文件路径
 * @param {Object} options - 配置选项
 * @returns {boolean} 恢复是否成功
 */
function restoreFromBackup(backupPath, originalPath, options = {}) {
  try {
    if (!fs.existsSync(backupPath)) {
      if (options.logger) {
        options.logger(`❌ 备份文件不存在: ${backupPath}`);
      }
      return false;
    }

    fs.copyFileSync(backupPath, originalPath);

    if (options.logger) {
      options.logger(`🔄 已从备份恢复: ${originalPath}`);
    }

    return true;
  } catch (error) {
    if (options.logger) {
      options.logger(`❌ 恢复失败: ${originalPath} - ${error.message}`);
    }
    return false;
  }
}

/**
 * 安全处理单个文件（带备份）
 * @param {string} filePath - 文件路径
 * @param {Object} options - 配置选项
 * @returns {Object} 处理结果
 */
function processSingleFileSafe(filePath, options = {}) {
  const result = {
    success: false,
    modified: false,
    backupPath: null,
    error: null,
  };

  try {
    // 读取原文件内容
    const originalContent = fs.readFileSync(filePath, "utf8");
    const processedContent = processFileContent(originalContent, options);

    // 如果内容没有变化，直接返回
    if (originalContent === processedContent) {
      if (options.logger) {
        options.logger(`⏭️  跳过: ${filePath} (无需处理)`);
      }
      result.success = true;
      return result;
    }

    // 创建备份（如果启用）
    if (options.createBackup !== false) {
      result.backupPath = createBackup(filePath, options);
    }

    // 写入处理后的内容
    fs.writeFileSync(filePath, processedContent, "utf8");

    // 验证文件完整性
    const verifyContent = fs.readFileSync(filePath, "utf8");
    if (verifyContent !== processedContent) {
      throw new Error("文件写入后内容验证失败");
    }

    result.success = true;
    result.modified = true;

    if (options.logger) {
      options.logger(`✅ 已处理: ${filePath}`);
    }
  } catch (error) {
    result.error = error.message;

    // 如果有备份，尝试恢复
    if (result.backupPath && fs.existsSync(result.backupPath)) {
      if (options.logger) {
        options.logger(`⚠️  处理失败，尝试从备份恢复: ${filePath}`);
      }
      restoreFromBackup(result.backupPath, filePath, options);
    }

    if (options.logger) {
      options.logger(`❌ 处理失败: ${filePath} - ${error.message}`);
    }
  }

  return result;
}

/**
 * 批量替换文件内容中的静态资源引用
 * @param {string|Array} target - 目标目录路径或文件路径数组
 * @param {Object} options - 配置选项
 * @returns {Object} 处理结果统计
 */
function batchReplaceWithRandomCache(target, options = {}) {
  const defaultOptions = {
    patterns: [
      "**/*.html",
      "**/*.js",
      "**/*.css",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx",
    ],
    ignore: ["node_modules/**", ".git/**", ".backup/**"],
    createBackup: true,
    backupDir: null, // 默认在每个文件目录下创建.backup文件夹
    enableLog: true,
    includeExternal: false,
    customGenerator: null,
    dryRun: false, // 预览模式，不实际修改文件
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const logger = mergedOptions.enableLog ? console.log : () => {};
  mergedOptions.logger = logger;

  const stats = {
    totalFiles: 0,
    processedFiles: 0,
    modifiedFiles: 0,
    failedFiles: 0,
    backupFiles: [],
    errors: [],
  };

  logger("🚀 开始批量替换静态资源引用...");

  try {
    let filesToProcess = [];

    if (Array.isArray(target)) {
      // 处理文件路径数组
      filesToProcess = target.filter((file) => {
        const exists = fs.existsSync(file);
        if (!exists && mergedOptions.enableLog) {
          logger(`⚠️  文件不存在: ${file}`);
        }
        return exists;
      });
    } else {
      // 处理目录
      const absoluteDir = path.isAbsolute(target)
        ? target
        : path.resolve(target);

      // 验证目录路径的Windows兼容性
      const pathValidation = validateFilePath(absoluteDir);
      if (!pathValidation.valid) {
        throw new Error(`目标目录路径不兼容: ${pathValidation.error}`);
      }

      const normalizedDir = pathValidation.normalized || absoluteDir;

      if (!fs.existsSync(normalizedDir)) {
        throw new Error(`目标目录不存在: ${normalizedDir}`);
      }

      logger(`🔍 扫描目录: ${normalizedDir}`);

      mergedOptions.patterns.forEach((pattern) => {
        // 规范化glob模式以确保Windows兼容性
        const normalizedPattern = normalizeGlobPattern(pattern);
        const globDir = normalizeGlobDirectory(normalizedDir);
        const searchPattern = path.posix.join(globDir, normalizedPattern);
        const ignorePatterns = mergedOptions.ignore.map((ig) => {
          const normalizedIgnore = normalizeGlobPattern(ig);
          return path.posix.join(globDir, normalizedIgnore);
        });

        const globOptions = createWindowsCompatibleGlobOptions({
          ignore: ignorePatterns,
          absolute: true,
        });

        // Windows调试信息
        if (isWindows() && mergedOptions.enableLog) {
          logger(`🔍 Windows模式 - 搜索模式: ${searchPattern}`);
          logger(`🔍 Windows模式 - 忽略模式: ${ignorePatterns.join(", ")}`);
        }

        try {
          const files = glob.sync(searchPattern, globOptions);

          if (mergedOptions.enableLog) {
            if (files.length > 0) {
              logger(`📄 模式 "${pattern}" 找到 ${files.length} 个文件`);
            } else {
              logger(
                `⚠️  模式 "${pattern}" 未找到匹配文件${
                  isWindows() ? " (Windows系统)" : ""
                }`
              );
            }
          }

          filesToProcess.push(...files);
        } catch (globError) {
          const error = `模式匹配失败 (${pattern}): ${globError.message}${
            isWindows() ? " [Windows系统]" : ""
          }`;
          stats.errors.push({
            file: pattern,
            error,
            platform: isWindows() ? "Windows" : "Unix",
            searchPattern,
            ignorePatterns,
          });
          if (mergedOptions.enableLog) {
            logger(`❌ ${error}`);
            if (isWindows()) {
              logger(`🔍 调试信息 - 搜索路径: ${searchPattern}`);
              logger(`🔍 调试信息 - 目录存在: ${fs.existsSync(normalizedDir)}`);
            }
          }
        }
      });

      // 去重
      filesToProcess = [...new Set(filesToProcess)];
    }

    stats.totalFiles = filesToProcess.length;
    logger(`📄 找到 ${stats.totalFiles} 个文件待处理`);

    if (mergedOptions.dryRun) {
      logger("🔍 预览模式：以下文件将被处理（不会实际修改）:");
      filesToProcess.forEach((file) => logger(`  - ${file}`));
      return stats;
    }

    // 处理每个文件
    filesToProcess.forEach((filePath) => {
      stats.processedFiles++;

      const result = processSingleFileSafe(filePath, mergedOptions);

      if (result.success) {
        if (result.modified) {
          stats.modifiedFiles++;
          if (result.backupPath) {
            stats.backupFiles.push(result.backupPath);
          }
        }
      } else {
        stats.failedFiles++;
        stats.errors.push({
          file: filePath,
          error: result.error,
        });
      }
    });
  } catch (error) {
    logger(`❌ 批量处理失败: ${error.message}`);
    stats.errors.push({
      file: "BATCH_PROCESS",
      error: error.message,
    });
  }

  // 输出统计信息
  logger("\n📊 处理完成统计:");
  logger(`  总文件数: ${stats.totalFiles}`);
  logger(`  已处理: ${stats.processedFiles}`);
  logger(`  已修改: ${stats.modifiedFiles}`);
  logger(`  失败: ${stats.failedFiles}`);
  logger(`  备份文件: ${stats.backupFiles.length}`);

  if (stats.errors.length > 0) {
    logger("\n❌ 错误详情:");
    stats.errors.forEach((err) => {
      logger(`  ${err.file}: ${err.error}`);
    });
  }

  if (stats.backupFiles.length > 0) {
    logger("\n📋 备份文件位置:");
    stats.backupFiles.forEach((backup) => {
      logger(`  ${backup}`);
    });
  }

  logger("✨ 批量替换完成!");

  return stats;
}

// 导出工具函数供直接使用
export {
  generateRandomParam,
  processFileContent,
  processSingleFile,
  processBatchFiles,
  createBackup,
  restoreFromBackup,
  processSingleFileSafe,
  batchReplaceWithRandomCache,
  // Windows兼容性工具函数
  isWindows,
  normalizeWindowsFilename,
  normalizeFilePath,
  validateFilePath,
  isPathTooLong,
  generateSafeTimestamp,
  normalizeGlobPattern,
  createWindowsCompatibleGlobOptions,
  normalizeGlobDirectory,
};
