import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadConfig, processTasks } from "../../src/core/config";
import path from "path";

// 模拟依赖
vi.mock("../../src/core/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    verbose: vi.fn(),
    setLogLevel: vi.fn(),
  })),
}));

vi.mock("../../src/core/localSync", () => ({
  performLocalSync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/core/gitHandler", () => ({
  updateGitProjects: vi.fn().mockResolvedValue(undefined),
}));

// 导入模拟的模块
import { performLocalSync } from "../../src/core/localSync";
import { updateGitProjects } from "../../src/core/gitHandler";

describe("loadConfig", () => {
  it("应该返回空对象当没有提供选项时", () => {
    const config = loadConfig(undefined, "/test/root");
    expect(config).toEqual({});
  });

  it("应该验证并返回有效的配置", () => {
    const options = {
      localSync: [{ source: "src", target: "dist" }],
      gitProjects: [
        {
          repo: "https://github.com/example/repo.git",
          branch: "main",
          targetDir: "services/repo",
        },
      ],
    };

    const config = loadConfig(options, "/test/root");
    expect(config).toEqual(options);
  });

  it("应该在无效配置时抛出错误", () => {
    const invalidOptions = {
      localSync: [
        { source: "", target: "dist" }, // 无效的source
      ],
    };

    expect(() => loadConfig(invalidOptions, "/test/root")).toThrow();
  });
});

describe("processTasks", () => {
  const mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    verbose: vi.fn(),
    setLogLevel: vi.fn(),
  };

  const mockViteConfig = {
    root: "/test/root",
  } as any;

  const mockSharedCommitMessagesHolder = { current: null as string[] | null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该按顺序执行配置的任务", async () => {
    const config = {
      localSync: [{ source: "src", target: "dist" }],
      gitProjects: [
        {
          repo: "https://github.com/example/repo.git",
          branch: "main",
          targetDir: "services/repo",
        },
      ],
      taskOrder: ["localSync", "updateGitProjects"],
    };

    await processTasks(
      config,
      mockViteConfig,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      "执行任务顺序: localSync, updateGitProjects",
    );
    expect(mockLogger.info).toHaveBeenCalledWith("开始任务: localSync");
    expect(performLocalSync).toHaveBeenCalledWith(
      config.localSync,
      mockViteConfig.root,
      mockLogger,
    );
    expect(mockLogger.info).toHaveBeenCalledWith("任务 localSync 完成。");

    expect(mockLogger.info).toHaveBeenCalledWith("开始任务: updateGitProjects");
    expect(updateGitProjects).toHaveBeenCalledWith(
      config.gitProjects,
      mockViteConfig.root,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "任务 updateGitProjects 完成。",
    );
  });

  it("应该使用默认任务顺序当未指定时", async () => {
    const config = {
      localSync: [{ source: "src", target: "dist" }],
      gitProjects: [
        {
          repo: "https://github.com/example/repo.git",
          branch: "main",
          targetDir: "services/repo",
        },
      ],
      // 未指定taskOrder
    };

    await processTasks(
      config,
      mockViteConfig,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 默认顺序: localSync, updateGitProjects
    expect(mockLogger.info).toHaveBeenCalledWith(
      "执行任务顺序: localSync, updateGitProjects",
    );
    expect(performLocalSync).toHaveBeenCalled();
    expect(updateGitProjects).toHaveBeenCalled();
  });

  it("应该处理任务错误并继续执行", async () => {
    const config = {
      localSync: [{ source: "src", target: "dist" }],
      gitProjects: [
        {
          repo: "https://github.com/example/repo.git",
          branch: "main",
          targetDir: "services/repo",
        },
      ],
      taskOrder: ["localSync", "updateGitProjects"],
    };

    const error = new Error("测试错误");
    (performLocalSync as any).mockRejectedValueOnce(error);

    await processTasks(
      config,
      mockViteConfig,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      "任务 localSync 执行错误: 测试错误",
      error,
    );
    expect(updateGitProjects).toHaveBeenCalled(); // 第二个任务仍然执行
  });

  it("应该在关键错误时中断流程", async () => {
    const config = {
      localSync: [{ source: "src", target: "dist" }],
      gitProjects: [
        {
          repo: "https://github.com/example/repo.git",
          branch: "main",
          targetDir: "services/repo",
        },
      ],
      taskOrder: ["localSync", "updateGitProjects"],
    };

    const criticalError = new Error("关键错误") as Error & {
      isCritical: boolean;
    };
    criticalError.isCritical = true;
    (performLocalSync as any).mockRejectedValueOnce(criticalError);

    await expect(
      processTasks(
        config,
        mockViteConfig,
        mockLogger,
        mockSharedCommitMessagesHolder,
      ),
    ).rejects.toThrow("关键错误");

    expect(updateGitProjects).not.toHaveBeenCalled(); // 第二个任务不应执行
  });
});
