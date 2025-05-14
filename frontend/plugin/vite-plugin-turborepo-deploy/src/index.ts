import type { Plugin, ResolvedConfig } from 'vite';
import { VitePluginTurborepoDeployOptions, TurborepoDeployConfig } from './types';
import { loadConfig } from "./core/config";
import { createLogger } from "./core/logger";
import { performLocalSync } from "./core/localSync";
import { updateGitProjects } from "./core/gitHandler";
import { performAutoCommit } from "./core/autoCommitHandler";
import { findWorkspaceRoot } from "./core/utils";
import path from "path";

export default function turborepoDeploy(
  options?: VitePluginTurborepoDeployOptions,
): Plugin {
  let viteConfig: ResolvedConfig;
  let pluginConfig: TurborepoDeployConfig;
  let logger: ReturnType<typeof createLogger>;
  let workspaceRoot: string;

  // 共享提交信息的状态容器
  const sharedCommitMessagesHolder = { current: null as string[] | null };

  return {
    name: "vite-plugin-turborepo-deploy",
    apply: "build", // 仅在构建过程中应用

    // 配置解析时钩子
    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;

      // 获取工作区根目录
      workspaceRoot = findWorkspaceRoot(viteConfig.root);
      const isWorkspace = workspaceRoot !== viteConfig.root;

      // 创建日志记录器，基于工作区根目录
      const logDir = options?.logger?.logDir || ".sync-log";
      const logPath = path.isAbsolute(logDir)
        ? logDir
        : path.resolve(workspaceRoot, logDir);

      logger = createLogger(
        workspaceRoot,
        options?.logger?.level || "info",
        options?.logger?.writeToFile !== false, // 默认为true
        logPath,
      );

      logger.info(
        `检测到${isWorkspace ? "Turborepo工作区，" : ""}根目录: ${workspaceRoot}`,
      );

      try {
        // 加载配置，使用工作区根目录
        pluginConfig = loadConfig(options, workspaceRoot);
        logger.info("Turborepo Deploy 插件已配置。");
      } catch (error: any) {
        logger.error(`配置错误: ${error.message}`);
        throw error; // 配置无效时停止构建
      }
    },

    // 关闭构建时钩子：执行所有任务
    async closeBundle() {
      if (Object.keys(pluginConfig).length === 0) {
        logger.info("未配置部署任务。");
        return;
      }

      logger.info("开始执行部署任务...");

      try {
        // 1. 首先执行Git项目管理
        if (pluginConfig.gitProjects && pluginConfig.gitProjects.length > 0) {
          logger.info("开始执行Git项目管理...");
          try {
            await updateGitProjects(
              pluginConfig.gitProjects,
              workspaceRoot,
              logger,
            );
            logger.info("Git项目初始化任务成功完成。");
          } catch (e: any) {
            logger.error(`Git项目初始化错误: ${e.message}`, e);
            // Git项目管理失败必须终止后续任务
            throw e;
          }
        } else {
          logger.info("未配置Git项目，跳过Git项目初始化阶段。");
        }

        // 2. 执行本地文件同步
        if (pluginConfig.localSync && pluginConfig.localSync.length > 0) {
          logger.info("开始执行本地文件同步...");
          await performLocalSync(pluginConfig.localSync, workspaceRoot, logger);
          logger.info("本地文件同步任务完成。");
        }

        // 3. 执行自动提交（重置共享提交信息）
        if (pluginConfig.autoCommit) {
          logger.info("开始执行智能自动提交...");
          sharedCommitMessagesHolder.current = null; // 重置共享提交信息
          await performAutoCommit(
            pluginConfig.autoCommit,
            workspaceRoot,
            logger,
            sharedCommitMessagesHolder,
          );
          logger.info("智能自动提交任务完成。");
        }

        logger.info("所有部署任务成功完成。");
      } catch (e: any) {
        logger.error(`部署错误: ${e.message}`, e);
        // 关键错误终止整个流程
        throw e;
      }
    },
  };
} 