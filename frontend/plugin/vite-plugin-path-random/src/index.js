import fs from "fs";
import path from "path";
import { glob } from "glob";

// 全局随机参数变量，在插件初始化时设置
let randomParam = null;

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
      console.log(randomParam, "时间戳");
      // console.log(match, prefix, filePath, suffix);
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
      if (options.logger) {
        options.logger(`✅ 已处理: ${filePath}`);
      }
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

  // 检查目录是否存在
  if (!fs.existsSync(absoluteDir)) {
    const error = `目录不存在: ${absoluteDir}`;
    if (mergedOptions.logger) {
      mergedOptions.logger(`❌ ${error}`);
    }
    stats.errors.push({ file: "DIRECTORY_CHECK", error });
    return stats;
  }

  if (mergedOptions.logger) {
    mergedOptions.logger(`🔍 扫描目录: ${absoluteDir}`);
  }

  try {
    // 收集所有要处理的文件
    let allFiles = [];

    mergedOptions.patterns.forEach((pattern) => {
      const searchPattern = path.join(absoluteDir, pattern);
      const ignorePatterns = mergedOptions.ignore.map((ig) =>
        path.join(absoluteDir, ig)
      );

      try {
        const files = glob.sync(searchPattern, {
          ignore: ignorePatterns,
          absolute: true,
          nodir: true, // 只返回文件，不包括目录
        });

        if (mergedOptions.logger && files.length > 0) {
          mergedOptions.logger(
            `📄 找到 ${files.length} 个匹配文件 (${pattern})`
          );
        }

        allFiles.push(...files);
      } catch (globError) {
        const error = `模式匹配失败 (${pattern}): ${globError.message}`;
        stats.errors.push({ file: pattern, error });
        if (mergedOptions.logger) {
          mergedOptions.logger(`⚠️  ${error}`);
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
            absoluteDir,
            file
          )}`
        );
      }

      let retries = 0;
      let success = false;

      while (retries <= mergedOptions.maxRetries && !success) {
        try {
          stats.processedCount++;

          if (mergedOptions.createBackup) {
            // 使用安全处理函数
            const result = processSingleFileSafe(file, mergedOptions);

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
            const modified = processSingleFile(file, mergedOptions);
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = path.basename(filePath);
    const backupFileName = `${fileName}.${timestamp}.backup`;
    const backupPath = path.join(backupDir, backupFileName);

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

      if (!fs.existsSync(absoluteDir)) {
        throw new Error(`目标目录不存在: ${absoluteDir}`);
      }

      logger(`🔍 扫描目录: ${absoluteDir}`);

      mergedOptions.patterns.forEach((pattern) => {
        const searchPattern = path.join(absoluteDir, pattern);
        const ignorePatterns = mergedOptions.ignore.map((ig) =>
          path.join(absoluteDir, ig)
        );

        const files = glob.sync(searchPattern, {
          ignore: ignorePatterns,
          absolute: true,
        });

        filesToProcess.push(...files);
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
};
