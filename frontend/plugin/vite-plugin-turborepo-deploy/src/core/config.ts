import type { ResolvedConfig } from 'vite';
import { z } from 'zod';
import {
  TurborepoDeployConfig,
  VitePluginTurborepoDeployOptions,
  LocalSyncConfig as LocalSyncConfigType,
  GitProjectConfig as GitProjectConfigType,
  GitProjectAutoCommitConfig as GitProjectAutoCommitConfigType,
  AutoCommitConfig as AutoCommitConfigType,
} from "../types";
import { createLogger, Logger } from "./logger";
import path from "path";

// 通用的自动提交项目配置模式
const AutoCommitProjectSchema = z.object({
  targetDir: z
    .string()
    .min(1, { message: "AutoCommit project targetDir cannot be empty" }),
  projectName: z.string().optional(),
  watchAuthor: z.string().optional(),
  maxScanCount: z.number().int().positive().optional().default(50),
  commitSeparator: z.string().optional().default("/** 提交分隔符 **/"),
  message: z.string().optional(),
  push: z.boolean().optional().default(false),
  useSharedCommits: z.boolean().optional().default(false),
  branch: z.string().optional(),
});

// AutoCommit配置模式
const AutoCommitConfigSchema = z
  .object({
    projects: z.array(AutoCommitProjectSchema),
    insertSeparator: z.boolean().optional().default(true),
    enableSharedCommits: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // 确保至少有一个项目不使用共享提交信息（作为源），或禁用了共享
      if (data.enableSharedCommits) {
        const hasSourceProject = data.projects.some(
          (project) => !project.useSharedCommits && project.watchAuthor,
        );
        return hasSourceProject;
      }
      return true;
    },
    {
      message:
        "When enableSharedCommits is true, at least one project must not use shared commits and have a watchAuthor defined",
      path: ["projects"],
    },
  );

// Git项目配置模式
const GitProjectConfigSchema = z.object({
  repo: z.string().url({ message: "Invalid Git repository URL" }),
  branch: z.string().min(1, { message: "Git branch cannot be empty" }),
  targetDir: z.string().min(1, { message: "Git targetDir cannot be empty" }),
  projectName: z.string().optional(),
  updateIfExists: z.boolean().optional().default(true),
  discardChanges: z.boolean().optional().default(false),
});

// 本地同步配置模式
const LocalSyncConfigSchema = z.object({
  source: z.string().min(1, { message: "LocalSync source cannot be empty" }),
  target: z.union([
    z.string().min(1, { message: "LocalSync target cannot be empty" }),
    z
      .array(
        z
          .string()
          .min(1, { message: "LocalSync target items cannot be empty" }),
      )
      .nonempty({ message: "LocalSync targets array cannot be empty" }),
  ]),
  mode: z
    .enum(["copy", "mirror", "incremental"])
    .optional()
    .default("incremental"),
  clearTarget: z.boolean().optional().default(false),
  addOnly: z.boolean().optional().default(false),
  exclude: z.array(z.string()).optional(),
  excludeDirs: z.array(z.string()).optional(),
  excludeFiles: z.array(z.string()).optional(),
});

// 插件主配置模式
const TurborepoDeployConfigSchema = z
  .object({
    localSync: z.array(LocalSyncConfigSchema).optional(),
    gitProjects: z.array(GitProjectConfigSchema).optional(),
    autoCommit: AutoCommitConfigSchema.optional(),
    logger: z
      .object({
        level: z.enum(["error", "warn", "info", "verbose"]).optional(),
        writeToFile: z.boolean().optional(),
        logDir: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // 确保至少配置了一个任务
      if (
        Object.keys(data).length > 0 &&
        !data.localSync &&
        !data.gitProjects &&
        !data.autoCommit
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Plugin configured but no tasks (localSync, gitProjects, or autoCommit) are defined.",
    },
  );

/**
 * 加载并验证插件配置
 *
 * @param options 用户提供的配置选项
 * @param workspaceRoot 工作区根目录
 * @returns 验证并处理后的配置对象
 */
export function loadConfig(
  options: VitePluginTurborepoDeployOptions | undefined,
  workspaceRoot: string,
): TurborepoDeployConfig {
  if (!options || Object.keys(options).length === 0) {
    return {} as TurborepoDeployConfig; // 返回空对象，插件将在buildEnd中跳过
  }

  try {
    const parsedConfig = TurborepoDeployConfigSchema.parse(options);

    // 验证自动提交配置中的路径
    if (parsedConfig.autoCommit) {
      for (const project of parsedConfig.autoCommit.projects) {
        // 所有项目路径现在都是相对于 .sync-git 目录的
        if (path.isAbsolute(project.targetDir)) {
          throw new Error(
            `AutoCommit 项目路径 '${project.targetDir}' 不应是绝对路径。请使用相对于 .sync-git 目录的路径。`,
          );
        }
      }
    }

    return parsedConfig as TurborepoDeployConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Configuration validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      );
    }
    throw new Error("Unknown error while parsing plugin configuration.");
  }
} 