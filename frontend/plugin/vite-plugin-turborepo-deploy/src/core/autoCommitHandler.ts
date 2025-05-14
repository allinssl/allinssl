import type { AutoCommitConfig } from "../types";
import type { Logger } from "./logger";
import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import fs from "fs-extra";
import path from "path";
import { createError } from "./utils";

const DEFAULT_COMMIT_SEPARATOR = "/** 提交分隔符 **/";
const DEFAULT_MAX_SCAN_COUNT = 50;
const DEFAULT_GIT_DIR = ".sync-git";

/**
 * 执行自动提交操作
 *
 * @param config 自动提交配置
 * @param workspaceRoot 工作区根目录
 * @param logger 日志记录器
 * @param sharedCommitMessagesHolder 共享提交信息的容器
 */
export async function performAutoCommit(
  config: AutoCommitConfig,
  workspaceRoot: string,
  logger: Logger,
  sharedCommitMessagesHolder: { current: string[] | null },
): Promise<void> {
  logger.info("开始自动提交操作...");

  // 重置共享提交信息（如果启用）
  const enableSharedCommits = config.enableSharedCommits !== false;
  if (enableSharedCommits) {
    sharedCommitMessagesHolder.current = null;
    logger.info("已重置共享提交信息缓冲区");
  }

  // 确保.sync-git目录存在
  const syncGitDir = path.resolve(workspaceRoot, DEFAULT_GIT_DIR);

  for (const project of config.projects) {
    // 计算Git项目的绝对路径，targetDir现在是相对于.sync-git目录的
    const projectDir = path.resolve(syncGitDir, project.targetDir);
    const projectName = project.projectName || project.targetDir;

    logger.info(`处理自动提交项目: ${projectName} (路径: ${projectDir})`);

    try {
      // 确保目录存在并且是Git仓库
      if (!fs.existsSync(projectDir)) {
        logger.warn(`项目目录 ${projectDir} 不存在，跳过此项目`);
        continue;
      }

      const gitOptions: Partial<SimpleGitOptions> = {
        baseDir: projectDir,
        binary: "git",
        maxConcurrentProcesses: 6,
      };

      const git: SimpleGit = simpleGit(gitOptions);

      if (!(await git.checkIsRepo())) {
        logger.warn(`${projectDir} 不是有效的Git仓库，跳过此项目`);
        continue;
      }

      // 如果指定了分支，切换到该分支
      if (project.branch) {
        const currentBranch = (await git.branchLocal()).current;
        if (currentBranch !== project.branch) {
          logger.info(`切换到分支 ${project.branch}...`);
          await git.checkout(project.branch);
        }
      }

      // 执行自动提交
      await handleProjectAutoCommit(
        git,
        project,
        projectName,
        logger,
        sharedCommitMessagesHolder,
        enableSharedCommits,
        config.insertSeparator !== false,
      );
    } catch (error: any) {
      logger.error(
        `处理项目 ${projectName} 自动提交时出错: ${error.message}`,
        error,
      );
      // 软错误，继续执行下一个项目
    }
  }

  logger.info("自动提交操作完成");
}

/**
 * 处理单个项目的自动提交
 */
async function handleProjectAutoCommit(
  git: SimpleGit,
  project: AutoCommitConfig["projects"][0],
  projectName: string,
  logger: Logger,
  sharedCommitMessagesHolder: { current: string[] | null },
  enableSharedCommits: boolean,
  insertSeparator: boolean,
) {
  let commitsToProcess: string[] = [];

  const useSharedCommits = enableSharedCommits && project.useSharedCommits;

  if (useSharedCommits && sharedCommitMessagesHolder.current) {
    logger.info(`[${projectName}] 使用共享提交信息`);
    commitsToProcess = [...sharedCommitMessagesHolder.current];
  } else {
    if (!project.watchAuthor) {
      logger.warn(
        `[${projectName}] 未定义watchAuthor且未使用共享提交，跳过自动提交`,
      );
      return;
    }

    logger.info(`[${projectName}] 扫描 ${project.watchAuthor} 的提交...`);

    const log = await git.log({
      "--author": project.watchAuthor,
      "--max-count": project.maxScanCount || DEFAULT_MAX_SCAN_COUNT,
      "--pretty": "%H %s", // hash和主题
    });

    const separator = project.commitSeparator || DEFAULT_COMMIT_SEPARATOR;
    let foundSeparator = false;
    let tempCommits: string[] = [];

    for (const commit of log.all) {
      if (commit.message.includes(separator)) {
        logger.info(`[${projectName}] 找到提交分隔符: "${commit.message}"`);
        foundSeparator = true;
        break;
      }
      tempCommits.unshift(`[${commit.hash.substring(0, 7)}] ${commit.message}`); // 添加到开头以保持顺序
    }

    if (foundSeparator) {
      commitsToProcess = tempCommits; // 分隔符之后的提交（已反转并正确排序）
    } else if (log.all.length > 0) {
      // 模式2：没有分隔符，取作者的最新提交
      const latestCommit = log.all[0];
      commitsToProcess = [
        `[${latestCommit.hash.substring(0, 7)}] ${latestCommit.message}`,
      ];
      logger.info(
        `[${projectName}] 未找到分隔符。使用 ${project.watchAuthor} 的最新提交: ${commitsToProcess[0]}`,
      );
    }

    // 为共享提交缓冲区填充数据（如果启用且是非共享提交消费者）
    if (
      enableSharedCommits &&
      commitsToProcess.length > 0 &&
      !sharedCommitMessagesHolder.current &&
      !project.useSharedCommits
    ) {
      logger.info(
        `[${projectName}] 将 ${commitsToProcess.length} 条提交存入共享缓冲区`,
      );
      sharedCommitMessagesHolder.current = [...commitsToProcess];
    }
  }

  if (commitsToProcess.length === 0) {
    logger.info(`[${projectName}] 没有要处理的新提交`);
    return;
  }

  logger.info(`[${projectName}] 准备提交 ${commitsToProcess.length} 个更改`);

  // 检查工作区状态
  const status = await git.status();
  if (!status.isClean()) {
    logger.info(`[${projectName}] 工作目录有未提交的更改，暂存所有更改`);
    await git.add("./*");
  } else {
    logger.info(
      `[${projectName}] 工作目录干净，没有本地更改需要提交。这是正常的，将继续处理同步提交信息`,
    );
  }

  // 创建提交信息
  const commitMessageBody = commitsToProcess
    .map((msg, idx) => `${idx + 1}. ${msg}`)
    .join("\n");

  const finalCommitMessage = (
    project.message ||
    `[自动合并] 包含 ${commitsToProcess.length} 次提交:\n\n${commitMessageBody}\n\n${project.commitSeparator || DEFAULT_COMMIT_SEPARATOR}`
  ).replace("N", commitsToProcess.length.toString());

  logger.info(`[${projectName}] 提交信息:\n${finalCommitMessage}`);
  await git.commit(finalCommitMessage);

  if (project.push) {
    const branch = project.branch || (await git.branchLocal()).current;
    logger.info(`[${projectName}] 推送到 origin ${branch}...`);
    await git.push("origin", branch);
  }

  // 插入新的分隔符提交（如果配置启用）
  if (insertSeparator) {
    const separatorCommitMessage =
      project.commitSeparator || DEFAULT_COMMIT_SEPARATOR;
    logger.info(
      `[${projectName}] 插入新的分隔符提交: "${separatorCommitMessage}"`,
    );
    await git.commit(separatorCommitMessage, ["--allow-empty"]);

    if (project.push) {
      const branch = project.branch || (await git.branchLocal()).current;
      logger.info(`[${projectName}] 推送分隔符提交到 origin ${branch}...`);
      await git.push("origin", branch);
    }

    // 处理重复分隔符
    const logAfter = await git.log({ "--max-count": "2", "--pretty": "%s" });
    if (
      logAfter.all.length === 2 &&
      logAfter.all[0].message === separatorCommitMessage &&
      logAfter.all[1].message === separatorCommitMessage
    ) {
      logger.info(`[${projectName}] 检测到重复分隔符，正在清理...`);
      await git.reset(["--hard", "HEAD~1"]);

      if (project.push) {
        const branch = project.branch || (await git.branchLocal()).current;
        logger.warn(`[${projectName}] 强制推送以修复远程重复分隔符`);
        await git.push("origin", branch, ["--force"]);
      }
    }
  }

  logger.info(`[${projectName}] 自动提交处理完成`);
}
