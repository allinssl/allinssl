import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

export type LogLevel = "error" | "warn" | "info" | "verbose";

export interface Logger {
  error: (message: string, error?: Error) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  verbose: (message: string) => void;
  setLogLevel: (level: LogLevel) => void;
}

const LogLevelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
};

/**
 * 创建日志记录器
 *
 * @param workspaceRoot 工作区根目录
 * @param initialLevel 初始日志级别
 * @param writeToFile 是否写入日志文件
 * @param logDir 日志目录路径
 * @returns 日志记录器实例
 */
export function createLogger(
  workspaceRoot: string,
  initialLevel: LogLevel = "info",
  writeToFile: boolean = true,
  logDir: string = ".sync-log",
): Logger {
  let currentLogLevel = initialLevel;
  const pluginName = chalk.cyan("[vite-plugin-turborepo-deploy]");

  // 确保日志目录存在
  const logDirPath = path.isAbsolute(logDir)
    ? logDir
    : path.resolve(workspaceRoot, logDir);
  if (writeToFile) {
    fs.ensureDirSync(logDirPath);
  }

  // 创建日志文件名（按日期）
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const logFilePath = path.join(logDirPath, `${dateStr}_deploy.log`);

  const log = (level: LogLevel, message: string, error?: Error) => {
    if (LogLevelOrder[level] <= LogLevelOrder[currentLogLevel]) {
      // 控制台输出
      let formattedMessage = `${pluginName} `;
      if (level === "error") formattedMessage += chalk.red(`ERROR: ${message}`);
      else if (level === "warn")
        formattedMessage += chalk.yellow(`WARN: ${message}`);
      else if (level === "info") formattedMessage += chalk.green(message);
      else formattedMessage += chalk.dim(message);

      console.log(formattedMessage);
      if (
        error &&
        (level === "error" ||
          LogLevelOrder.verbose <= LogLevelOrder[currentLogLevel])
      ) {
        console.error(error);
      }

      // 文件日志
      if (writeToFile) {
        try {
          const timestamp = new Date().toISOString();
          let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

          if (
            error &&
            (level === "error" ||
              LogLevelOrder.verbose <= LogLevelOrder[currentLogLevel])
          ) {
            logEntry += `[${timestamp}] [${level.toUpperCase()}] Error details: ${error.stack || error.message}\n`;
          }

          fs.appendFileSync(logFilePath, logEntry);
        } catch (e) {
          console.error(
            `${pluginName} ${chalk.red(`ERROR: Failed to write to log file: ${e instanceof Error ? e.message : "Unknown error"}`)}`,
          );
        }
      }
    }
  };

  return {
    error: (message, error) => log("error", message, error),
    warn: (message) => log("warn", message),
    info: (message) => log("info", message),
    verbose: (message) => log("verbose", message),
    setLogLevel: (level: LogLevel) => {
      currentLogLevel = level;
    },
  };
}
