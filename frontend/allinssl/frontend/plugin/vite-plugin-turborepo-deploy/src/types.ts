/**
 * Configuration for individual Git project auto-commit behavior.
 * @deprecated This interface is deprecated and will be removed in a future version. Use AutoCommitConfig instead.
 */
export interface GitProjectAutoCommitConfig {
  /**
   * Whether to enable auto-commit for this project.
   * @default false
   */
  enabled?: boolean;
  /**
   * The Git author username to watch for commits.
   * Required if `useSharedCommits` is false or if this project is intended as a source for shared commits.
   */
  watchAuthor?: string;
  /**
   * Maximum number of recent commits to scan.
   * @default 50
   */
  maxScanCount?: number;
  /**
   * Special marker string to identify commit segment points.
   * @default "/** 提交分隔符 **\/"
   */
  commitSeparator?: string;
  /**
   * Template for the auto-generated commit message.
   * (Optional, a default will be provided if not set)
   */
  message?: string;
  /**
   * Whether to push to the remote repository after committing.
   * @default false
   */
  push?: boolean;
  /**
   * Whether to attempt using shared commit information from a previous project.
   * If true and shared info is available, `watchAuthor`, `maxScanCount`, etc., might be skipped for this project.
   * If shared info is not available, it will fall back to its own scanning logic if configured.
   * @default false
   */
  useSharedCommits?: boolean;
}

/**
 * Configuration for managing a single Git project.
 */
export interface GitProjectConfig {
  /**
   * The repository URL (SSH or HTTPS).
   */
  repo: string;
  /**
   * The target branch to checkout and operate on.
   */
  branch: string;
  /**
   * Directory to store the cloned/updated project.
   * Note: All Git projects will be placed under the `.sync-git` directory in workspace root.
   * This path is relative to the `.sync-git` directory, not to the workspace root directly.
   * For example, if targetDir is 'api', the actual location will be '<workspace_root>/.sync-git/api'.
   */
  targetDir: string;
  /**
   * Optional: A name for the project, used for logging and potentially as an identifier for shared commits.
   */
  projectName?: string;
  /**
   * Whether to update the project if it already exists.
   * @default true
   */
  updateIfExists?: boolean;
  /**
   * Whether to discard all uncommitted changes before pulling.
   * If true, runs git checkout -- . && git clean -fd to remove all local changes.
   * Use with caution, as this will permanently delete local changes.
   * @default false
   */
  discardChanges?: boolean;
}

/**
 * Configuration for the auto-commit module which operates independently.
 */
export interface AutoCommitConfig {
  /**
   * Git projects to run auto-commit operations on
   */
  projects: Array<{
    /**
     * Directory of the git project (relative to workspace root)
     */
    targetDir: string;
    /**
     * Optional: A name for the project, used for logging and as identifier for shared commits.
     * If not provided, targetDir will be used as the project name.
     */
    projectName?: string;
    /**
     * The Git author username to watch for commits.
     * Required if `useSharedCommits` is false or if this project is intended as a source for shared commits.
     */
    watchAuthor?: string;
    /**
     * Maximum number of recent commits to scan.
     * @default 50
     */
    maxScanCount?: number;
    /**
     * Special marker string to identify commit segment points.
     * @default "/** 提交分隔符 **\/"
     */
    commitSeparator?: string;
    /**
     * Template for the auto-generated commit message.
     * (Optional, a default will be provided if not set)
     */
    message?: string;
    /**
     * Whether to push to the remote repository after committing.
     * @default false
     */
    push?: boolean;
    /**
     * Whether to attempt using shared commit information from a previous project.
     * @default false
     */
    useSharedCommits?: boolean;
    /**
     * Target branch to perform auto-commit on.
     * If not specified, the current branch will be used.
     */
    branch?: string;
  }>;
  /**
   * Whether to insert commit separator after auto-commit
   * @default true
   */
  insertSeparator?: boolean;
  /**
   * Whether to enable shared commit buffer across projects
   * @default true
   */
  enableSharedCommits?: boolean;
}

/**
 * Configuration for a single local file/directory synchronization task.
 */
export interface LocalSyncConfig {
  /**
   * Source directory/file (relative to workspace root).
   */
  source: string;
  /**
   * Target directory/file (relative to workspace root).
   * Can be a single path or an array of paths for distribution to multiple targets.
   */
  target: string | string[];
  /**
   * Synchronization mode.
   * - `copy`: Simple copy, doesn\'t handle existing files in target.
   * - `mirror`: Mirror sync, deletes files in target not present in source.
   * - `incremental`: Incremental update, only overwrites changed files.
   * @default \'incremental\'
   */
  mode?: "copy" | "mirror" | "incremental";
  /**
   * Whether to clear the target directory before synchronization.
   * @default false
   */
  clearTarget?: boolean;
  /**
   * If true, only adds files/directories from source that do not exist in target.
   * Does not modify or delete existing files in target.
   * @default false
   */
  addOnly?: boolean;
  /**
   * Array of regular expressions to exclude files/directories.
   */
  exclude?: string[];
  /**
   * Array of glob patterns or regular expressions for directories to exclude.
   */
  excludeDirs?: string[];
  /**
   * Array of glob patterns or regular expressions for files to exclude.
   */
  excludeFiles?: string[];
}

/**
 * Configuration for the logger.
 */
export interface LoggerConfig {
  /**
   * The log level to use.
   * - `error`: Only log errors.
   * - `warn`: Log errors, warnings, and info messages.
   * - `verbose`: Log all messages including debug information.
   * @default 'info'
   */
  level?: "error" | "warn" | "info" | "verbose";

  /**
   * Whether to write logs to file.
   * @default true
   */
  writeToFile?: boolean;

  /**
   * Directory to store log files, relative to workspace root.
   * @default '.sync-log'
   */
  logDir?: string;
}

/**
 * Main configuration for the Turborepo Deploy Vite plugin.
 */
export interface TurborepoDeployConfig {
  /**
   * Configuration for local file/directory synchronization tasks.
   * 在编译后执行。
   */
  localSync?: Array<LocalSyncConfig>;
  /**
   * Configuration for Git project management (clone/update).
   * 在编译前执行。
   */
  gitProjects?: Array<GitProjectConfig>;
  /**
   * Configuration for auto-commit functionality.
   * This runs separately after build.
   * 在编译后执行。
   */
  autoCommit?: AutoCommitConfig;
  /**
   * Logger configuration.
   */
  logger?: LoggerConfig;
}

// Utility type for the plugin itself
export interface VitePluginTurborepoDeployOptions extends TurborepoDeployConfig {} 