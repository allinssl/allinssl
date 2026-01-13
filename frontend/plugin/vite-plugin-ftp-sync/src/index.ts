import Client from "ssh2-sftp-client";
import { Plugin } from "vite";

export interface FtpSyncTarget {
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath: string;
  localPath?: string;
  clearRemote?: boolean;
}

// 创建日志工具
const logger = {
  pluginName: "vite-plugin-ftp-sync",
  info: (message: string) => {
    console.log(
      `\x1b[36m[${logger.pluginName}]\x1b[0m \x1b[32m${message}\x1b[0m`,
    );
  },
  warn: (message: string) => {
    console.warn(
      `\x1b[36m[${logger.pluginName}]\x1b[0m \x1b[33m${message}\x1b[0m`,
    );
  },
  error: (message: string, err?: any) => {
    console.error(
      `\x1b[36m[${logger.pluginName}]\x1b[0m \x1b[31m${message}\x1b[0m`,
      err || "",
    );
  },
  success: (message: string) => {
    console.log(
      `\x1b[36m[${logger.pluginName}]\x1b[0m \x1b[32m${message} ✓\x1b[0m`,
    );
  },
};

export async function uploadFtp(options: FtpSyncTarget[] | FtpSyncTarget) {
  if (!Array.isArray(options)) options = [options];
  const results = await Promise.allSettled(
    options.map(async (target) => {
      const sftp = new Client();
      try {
        await sftp.connect({
          host: target.host,
          port: target.port,
          username: target.username,
          password: target.password,
        });

        const localPath = target.localPath || "dist";
        logger.info(
          `开始同步文件到 SFTP 服务器 ${target.host}:${target.port} -> ${target.remotePath}`,
        );

        if (target.clearRemote) {
          logger.info(`正在清除远程目录 ${target.remotePath}...`);
          try {
            await sftp.rmdir(target.remotePath, true);
            logger.success(`远程目录 ${target.remotePath} 已清除`);
          } catch (err) {
            logger.warn(`清除远程目录失败，可能目录不存在: ${err}`);
          }
        }

        await sftp.uploadDir(localPath, target.remotePath);
        logger.success(`文件同步到 ${target.host} 完成！`);

        sftp.end();
        return { target, success: true };
      } catch (err) {
        logger.error(`SFTP 同步到 ${target.host} 失败:`, err);
        sftp.end();
        return { target, success: false, error: err };
      }
    }),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failures.length > 0) {
    logger.error(`部分 SFTP 同步失败: ${failures.length} 个目标`);
    throw new Error(`部分 SFTP 同步失败: ${failures.length} 个目标`);
  } else {
    logger.success("所有同步任务已成功完成");
  }
}

export function ftpSync(options: FtpSyncTarget[] | FtpSyncTarget): Plugin {
  return {
    name: "vite-plugin-ftp-sync",
    apply: "build",
    closeBundle: async () => {
      await uploadFtp(options);
    },
  };
}
