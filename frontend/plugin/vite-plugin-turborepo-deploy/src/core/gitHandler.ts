import type { GitProjectConfig } from '../types';
import type { Logger } from "./logger";
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';

// 默认的Git项目存放目录
const DEFAULT_GIT_DIR = '.sync-git';

/**
 * 检查仓库是否具有未提交的更改
 * @param git SimpleGit实例
 * @param logger 日志记录器
 * @returns 是否有未提交的更改
 */
async function hasUncommittedChanges(git: SimpleGit, logger: Logger): Promise<boolean> {
  try {
    // 检查仓库是否为空
    const hasFiles = await git.raw(['ls-files']).then(output => !!output.trim());
    if (!hasFiles) {
      // 空仓库没有未提交的更改
      return false;
    }

    // 获取状态
    const status = await git.status();
    
    // 检查是否有未跟踪的文件
    const hasUntracked = status.not_added.length > 0;
    
    // 检查是否有已修改但未暂存的文件
    const hasModified = status.modified.length > 0;
    
    // 检查是否有已暂存的更改
    const hasStaged = status.staged.length > 0;
    
    // 检查是否有已删除但未暂存的文件
    const hasDeleted = status.deleted.length > 0;
    
    // 检查是否有冲突的文件
    const hasConflicted = status.conflicted.length > 0;
    
    return hasUntracked || hasModified || hasStaged || hasDeleted || hasConflicted || !status.isClean();
  } catch (error: any) {
    logger.warn(`检查未提交更改时出错: ${error.message}，将假设没有未提交更改`);
    return false;
  }
}

/**
 * 安全地丢弃工作区中的所有更改
 * @param git SimpleGit实例
 * @param projectName 项目名称
 * @param logger 日志记录器
 */
async function safelyDiscardChanges(git: SimpleGit, projectName: string, logger: Logger): Promise<void> {
  try {
    // 检查仓库是否为空或是否有已跟踪的文件
    const trackedFiles = await git.raw(['ls-files']);
    if (!trackedFiles.trim()) {
      logger.info(`${projectName}: 仓库为空或没有已跟踪的文件，跳过丢弃更改操作`);
      return;
    }

    // 获取具体的更改状态
    const status = await git.status();
    
    if (status.modified.length > 0 || status.deleted.length > 0) {
      logger.info(`${projectName}: 丢弃已修改或已删除但未暂存的文件更改`);
      await git.checkout(['--', '.']);
    }
    
    if (status.staged.length > 0) {
      logger.info(`${projectName}: 丢弃已暂存的更改`);
      await git.reset(['HEAD', '--', '.']);
      if (status.staged.length > 0) {
        await git.checkout(['--', '.']);
      }
    }
    
    if (status.not_added.length > 0) {
      logger.info(`${projectName}: 删除未跟踪的文件`);
      await git.clean('fd');
    }
    
    logger.info(`${projectName}: 已丢弃所有本地更改`);
  } catch (error: any) {
    logger.warn(`${projectName}: 丢弃更改时出错: ${error.message}，尝试继续操作`);
  }
}

/**
 * 更新Git项目，在编译前执行
 * 所有Git项目都存放在workspaceRoot/.sync-git目录下
 * 
 * @param configs Git项目配置数组
 * @param workspaceRoot 工作区根目录
 * @param logger 日志记录器
 * @returns Promise<void>
 */
export async function updateGitProjects(
  configs: GitProjectConfig[],
  workspaceRoot: string,
  logger: Logger,
): Promise<void> {
  logger.info("开始Git项目初始化...");

  // 确保.sync-git目录存在
  const syncGitDir = path.resolve(workspaceRoot, DEFAULT_GIT_DIR);
  await fs.ensureDir(syncGitDir);
  logger.info(`Git项目根目录: ${syncGitDir}`);

  // 检查是否所有Git项目都已准备就绪的标志
  let allProjectsReady = true;

  for (const config of configs) {
    // 构建Git项目路径，放在.sync-git目录下
    const relativeProjectDir = config.targetDir;
    const absoluteProjectDir = path.resolve(syncGitDir, relativeProjectDir);
    const projectName = config.projectName || config.targetDir;

    logger.info(
      `处理Git项目: ${projectName} (仓库: ${config.repo}, 分支: ${config.branch})`,
    );

    const gitOptions: Partial<SimpleGitOptions> = {
      baseDir: absoluteProjectDir,
      binary: "git",
      maxConcurrentProcesses: 6,
    };

    try {
      // 检查项目目录是否存在
      const dirExists = await fs.pathExists(absoluteProjectDir);
      if (!dirExists) {
        logger.info(`项目目录不存在: ${absoluteProjectDir}，将创建并克隆仓库`);
        await fs.ensureDir(absoluteProjectDir);
      }

      const git: SimpleGit = simpleGit(gitOptions);

      // 检查是否为Git仓库
      const isRepo = dirExists && (await git.checkIsRepo().catch(() => false));

      if (!isRepo) {
        logger.info(`正在克隆 ${config.repo} 到 ${absoluteProjectDir}...`);
        // 确保父目录存在
        await fs.ensureDir(path.dirname(absoluteProjectDir));
        // 克隆仓库
        await simpleGit(path.dirname(absoluteProjectDir)).clone(
          config.repo,
          path.basename(absoluteProjectDir),
          [`--branch=${config.branch}`],
        );
        logger.info(`克隆成功。`);
      } else {
        if (config.updateIfExists !== false) {
          logger.info(`正在获取并拉取 ${projectName} 的更新...`);
          await git.fetch();

          // 提前获取当前分支信息
          const branchInfo = await git.branchLocal();
          const currentBranch = branchInfo.current;
          logger.info(`${projectName}: 当前分支 ${currentBranch}`);

          // 检查是否有未提交的更改
          const uncommittedChanges = await hasUncommittedChanges(git, logger);

          if (uncommittedChanges) {
            if (config.discardChanges) {
              logger.warn(
                `${projectName}: 检测到未提交的更改，根据配置将丢弃所有本地修改...`,
              );
              // 安全地丢弃所有更改
              await safelyDiscardChanges(git, projectName, logger);
            } else {
              logger.warn(
                `${projectName}: 检测到未提交的更改。如需自动丢弃这些更改，请设置 discardChanges: true`,
              );
            }
          } else {
            logger.info(`${projectName}: 没有检测到未提交的更改，继续操作...`);
          }

          // 检查当前分支是否为目标分支
          if (currentBranch !== config.branch) {
            logger.info(
              `${projectName}: 需要从分支 ${currentBranch} 切换到分支 ${config.branch}...`,
            );
            try {
              await git.checkout(config.branch);
              logger.info(`${projectName}: 成功切换到分支 ${config.branch}`);
            } catch (checkoutError: any) {
              if (config.discardChanges) {
                logger.warn(
                  `${projectName}: 切换分支失败: ${checkoutError.message}，尝试强制切换...`,
                );
                await git.checkout(["-f", config.branch]);
                logger.info(
                  `${projectName}: 成功强制切换到分支 ${config.branch}`,
                );
              } else {
                throw checkoutError;
              }
            }
          } else {
            logger.info(
              `${projectName}: 已经在目标分支 ${config.branch} 上，无需切换`,
            );
          }

          // 执行拉取操作
          logger.info(`${projectName}: 从远程拉取最新更改...`);
          try {
            await git.pull("origin", config.branch, { "--rebase": "true" });
            logger.info(`${projectName}: 成功更新分支 ${config.branch}。`);
          } catch (pullError: any) {
            if (
              (pullError.message.includes("You have unstaged changes") ||
                pullError.message.includes(
                  "Your local changes to the following files would be overwritten",
                )) &&
              config.discardChanges
            ) {
              logger.warn(
                `拉取失败 (${pullError.message})，尝试丢弃更改后重新拉取...`,
              );

              // 尝试中止可能进行中的变基
              try {
                await git.rebase(["--abort"]);
              } catch (e) {
                // 忽略错误，因为可能没有正在进行的变基
              }

              // 安全地丢弃所有更改
              await safelyDiscardChanges(git, projectName, logger);

              // 重新尝试拉取
              await git.pull("origin", config.branch, { "--rebase": "true" });
              logger.info(`丢弃更改后成功更新 ${projectName}。`);
            } else {
              throw pullError;
            }
          }
        } else {
          logger.info(
            `项目 ${projectName} 已存在且 updateIfExists 为 false，跳过更新。`,
          );
        }
      }
    } catch (error: any) {
      logger.error(
        `处理Git项目 ${projectName} 时出错: ${error.message}`,
        error,
      );
      // 标记有项目未准备就绪
      allProjectsReady = false;
      // 编译前阶段出错，中止编译流程
      throw new Error(
        `Git项目 ${projectName} 初始化失败，编译中止: ${error.message}`,
      );
    }
  }

  if (allProjectsReady) {
    logger.info("所有Git项目初始化完成，可以开始编译。");
  }
} 