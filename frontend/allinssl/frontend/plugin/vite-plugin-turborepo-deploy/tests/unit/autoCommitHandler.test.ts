import { describe, it, expect, vi, beforeEach } from "vitest";
import { performAutoCommit } from "../../src/core/autoCommitHandler";
import path from "path";
import fs from "fs-extra";

// 模拟依赖
vi.mock("simple-git", () => {
  // 创建简单的模拟实现
  const mockGit = {
    checkIsRepo: vi.fn().mockResolvedValue(true),
    branchLocal: vi.fn().mockResolvedValue({ current: "develop" }),
    log: vi.fn().mockResolvedValue({
      all: [
        { hash: "1234567", message: "一般提交1" },
        { hash: "2345678", message: "一般提交2" },
        { hash: "3456789", message: "/** 提交分隔符 **/" },
        { hash: "4567890", message: "之前的提交" },
      ],
    }),
    status: vi
      .fn()
      .mockResolvedValue({ isClean: vi.fn().mockReturnValue(true) }),
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(undefined),
    checkout: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: vi.fn().mockReturnValue(mockGit),
    __esModule: true,
  };
});

vi.mock("fs-extra", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  __esModule: true,
}));

// 模拟日志记录器
const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  verbose: vi.fn(),
  setLogLevel: vi.fn(),
};

describe("performAutoCommit", () => {
  const mockViteRoot = "/test/root";
  const mockSharedCommitMessagesHolder = { current: null as string[] | null };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该处理单个项目的自动提交 (独立模块)", async () => {
    const config = {
      projects: [
        {
          targetDir: "services/api-gateway",
          projectName: "api-gateway",
          watchAuthor: "张三",
          push: true,
        },
      ],
      enableSharedCommits: true,
      insertSeparator: true,
    };

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 验证日志和基本操作
    expect(mockLogger.info).toHaveBeenCalledWith("开始自动提交操作...");
    expect(mockLogger.info).toHaveBeenCalledWith("已重置共享提交信息缓冲区");
    expect(mockLogger.info).toHaveBeenCalledWith(
      "处理自动提交项目: api-gateway",
    );
    expect(mockLogger.info).toHaveBeenCalledWith("自动提交操作完成");

    // 验证Git操作
    const simpleGit = require("simple-git").default;
    const mockGit = simpleGit();
    expect(mockGit.log).toHaveBeenCalled();
    expect(mockGit.commit).toHaveBeenCalledTimes(2); // 一次正常提交，一次分隔符
    expect(mockGit.push).toHaveBeenCalledTimes(2); // 一次正常推送，一次分隔符推送
  });

  it("应该在禁用共享提交时不重置共享缓冲区", async () => {
    const config = {
      projects: [
        {
          targetDir: "services/api-gateway",
          projectName: "api-gateway",
          watchAuthor: "张三",
        },
      ],
      enableSharedCommits: false,
      insertSeparator: true,
    };

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 验证没有重置共享缓冲区
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      "已重置共享提交信息缓冲区",
    );
  });

  it("应该在项目不存在时跳过处理", async () => {
    // 模拟文件不存在
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);

    const config = {
      projects: [
        {
          targetDir: "services/non-existent",
          projectName: "non-existent",
          watchAuthor: "张三",
        },
      ],
    };

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("不存在，跳过此项目"),
    );
    // 验证没有进行Git操作
    const simpleGit = require("simple-git").default;
    expect(simpleGit).not.toHaveBeenCalled();
  });

  it("应该使用共享提交信息", async () => {
    // 设置共享提交信息
    mockSharedCommitMessagesHolder.current = ["[abcdef1] 共享的提交信息"];

    const config = {
      projects: [
        {
          targetDir: "services/consumer",
          projectName: "consumer",
          useSharedCommits: true,
          push: true,
        },
      ],
      enableSharedCommits: true,
    };

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 验证使用了共享提交信息
    expect(mockLogger.info).toHaveBeenCalledWith("[consumer] 使用共享提交信息");

    // 验证提交操作
    const simpleGit = require("simple-git").default;
    const mockGit = simpleGit();
    expect(mockGit.commit).toHaveBeenCalled();
    expect(mockGit.push).toHaveBeenCalled();
  });

  it("应该在没有提交时跳过", async () => {
    // 模拟没有提交记录
    const simpleGit = require("simple-git").default;
    const mockGit = simpleGit();
    vi.mocked(mockGit.log).mockResolvedValueOnce({ all: [] });

    const config = {
      projects: [
        {
          targetDir: "services/no-commits",
          projectName: "no-commits",
          watchAuthor: "张三",
        },
      ],
    };

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 验证没有进行提交操作
    expect(mockGit.commit).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "[no-commits] 没有要处理的新提交",
    );
  });

  it("应该处理分支切换", async () => {
    const config = {
      projects: [
        {
          targetDir: "services/branch-test",
          projectName: "branch-test",
          watchAuthor: "张三",
          branch: "feature/test",
        },
      ],
    };

    // 模拟当前分支不是目标分支
    const simpleGit = require("simple-git").default;
    const mockGit = simpleGit();
    vi.mocked(mockGit.branchLocal).mockResolvedValueOnce({ current: "main" });

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 验证分支切换
    expect(mockGit.checkout).toHaveBeenCalledWith("feature/test");
    expect(mockLogger.info).toHaveBeenCalledWith("切换到分支 feature/test...");
  });

  it("应该支持多项目并发处理", async () => {
    const config = {
      projects: [
        {
          targetDir: "services/api-gateway",
          projectName: "api-gateway",
          watchAuthor: "张三",
          push: true,
        },
        {
          targetDir: "services/user-service",
          projectName: "user-service",
          useSharedCommits: true,
          push: true,
        },
      ],
      enableSharedCommits: true,
    };

    await performAutoCommit(
      config,
      mockViteRoot,
      mockLogger,
      mockSharedCommitMessagesHolder,
    );

    // 验证处理了两个项目
    expect(mockLogger.info).toHaveBeenCalledWith(
      "处理自动提交项目: api-gateway",
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "处理自动提交项目: user-service",
    );
  });
});
