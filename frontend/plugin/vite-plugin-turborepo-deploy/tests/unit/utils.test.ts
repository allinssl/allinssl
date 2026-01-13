import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs-extra";
import {
  resolvePath,
  createError,
  formatDate,
  isAbsolutePath,
  safeRemoveFile,
  isSubdirectoryOf,
  normalizePaths,
  analyzePathRelationship,
} from "../../src/core/utils";

// 创建临时测试文件的路径
const tmpDir = path.join(process.cwd(), "tests", "tmp");
const tmpFile = path.join(tmpDir, "test-file.txt");

// 确保临时目录存在
beforeAll(async () => {
  await fs.ensureDir(tmpDir);
});

// 测试后清理
afterAll(async () => {
  await fs.remove(tmpDir);
});

describe("resolvePath", () => {
  it("应该正确解析相对路径", () => {
    const viteRoot = "/test/root";
    const relativePath = "src/components";
    const expected = path.resolve(viteRoot, relativePath);

    expect(resolvePath(viteRoot, relativePath)).toBe(expected);
  });

  it("应该保留绝对路径", () => {
    const viteRoot = "/test/root";
    const absolutePath = "/absolute/path";

    expect(resolvePath(viteRoot, absolutePath)).toBe(absolutePath);
  });
});

describe("createError", () => {
  it("应该创建非关键错误", () => {
    const message = "Test error";
    const error = createError(message);

    expect(error.message).toBe(message);
    expect(error.isCritical).toBe(false);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it("应该创建关键错误", () => {
    const message = "Critical error";
    const error = createError(message, true);

    expect(error.message).toBe(message);
    expect(error.isCritical).toBe(true);
    expect(error.timestamp).toBeInstanceOf(Date);
  });
});

describe("formatDate", () => {
  it("应该正确格式化日期", () => {
    const date = new Date(2023, 0, 1); // 2023-01-01
    expect(formatDate(date)).toBe("2023-01-01");

    const date2 = new Date(2023, 11, 31); // 2023-12-31
    expect(formatDate(date2)).toBe("2023-12-31");
  });

  it("应该在月份和日期前补零", () => {
    const date = new Date(2023, 0, 1); // 2023-01-01
    expect(formatDate(date)).toBe("2023-01-01");

    const date2 = new Date(2023, 8, 9); // 2023-09-09
    expect(formatDate(date2)).toBe("2023-09-09");
  });
});

describe("isAbsolutePath", () => {
  it("应该识别绝对路径", () => {
    const absolutePath = path.resolve("/absolute/path");
    expect(isAbsolutePath(absolutePath)).toBe(true);
  });

  it("应该识别相对路径", () => {
    expect(isAbsolutePath("relative/path")).toBe(false);
    expect(isAbsolutePath("./relative/path")).toBe(false);
  });
});

describe("safeRemoveFile", () => {
  it("应该删除存在的文件", async () => {
    // 创建测试文件
    await fs.writeFile(tmpFile, "test content");
    expect(fs.existsSync(tmpFile)).toBe(true);

    // 删除文件
    await safeRemoveFile(tmpFile);
    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it("应该安全地处理不存在的文件", async () => {
    const nonExistentFile = path.join(tmpDir, "non-existent.txt");

    // 确保文件不存在
    if (fs.existsSync(nonExistentFile)) {
      await fs.remove(nonExistentFile);
    }

    // 不应抛出错误
    await expect(safeRemoveFile(nonExistentFile)).resolves.not.toThrow();
  });
});

describe("normalizePaths", () => {
  it("应该正规化单个路径", () => {
    const paths = normalizePaths("C:/test\\path//file.txt");
    expect(paths).toHaveLength(1);
    expect(paths[0]).toBe(path.normalize("C:/test\\path//file.txt"));
  });

  it("应该正规化多个路径", () => {
    const input = ["C:/test\\path1", "D:\\test/path2", "./relative\\path"];
    const result = normalizePaths(...input);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(path.normalize("C:/test\\path1"));
    expect(result[1]).toBe(path.normalize("D:\\test/path2"));
    expect(result[2]).toBe(path.normalize("./relative\\path"));
  });

  it("应该处理空路径数组", () => {
    const result = normalizePaths();
    expect(result).toHaveLength(0);
  });
});

describe("isSubdirectoryOf", () => {
  describe("Unix/Linux 路径格式", () => {
    it("应该识别子目录", () => {
      expect(isSubdirectoryOf("/root/sub", "/root")).toBe(true);
      expect(isSubdirectoryOf("/root/sub/deep", "/root")).toBe(true);
      expect(isSubdirectoryOf("/root/sub/deep/file.txt", "/root")).toBe(true);
    });

    it("应该识别相同目录", () => {
      expect(isSubdirectoryOf("/root", "/root")).toBe(true);
      expect(isSubdirectoryOf("/root/", "/root")).toBe(true);
      expect(isSubdirectoryOf("/root", "/root/")).toBe(true);
    });

    it("应该拒绝非子目录", () => {
      expect(isSubdirectoryOf("/other", "/root")).toBe(false);
      expect(isSubdirectoryOf("/root-similar", "/root")).toBe(false);
      expect(isSubdirectoryOf("/", "/root")).toBe(false);
    });
  });

  describe("Windows 路径格式", () => {
    it("应该识别子目录", () => {
      expect(isSubdirectoryOf("C:\\root\\sub", "C:\\root")).toBe(true);
      expect(isSubdirectoryOf("C:\\root\\sub\\deep", "C:\\root")).toBe(true);
    });

    it("应该识别相同目录", () => {
      expect(isSubdirectoryOf("C:\\root", "C:\\root")).toBe(true);
      expect(isSubdirectoryOf("C:\\root\\", "C:\\root")).toBe(true);
    });

    it("应该拒绝非子目录", () => {
      expect(isSubdirectoryOf("D:\\root", "C:\\root")).toBe(false);
      expect(isSubdirectoryOf("C:\\other", "C:\\root")).toBe(false);
    });
  });

  describe("混合路径分隔符處理", () => {
    it("应该处理混合的路径分隔符", () => {
      // 這是實際錯誤場景：正規化應該統一分隔符
      expect(isSubdirectoryOf("C:/root\\.sync-git\\target", "C:\\root")).toBe(
        true,
      );
      expect(isSubdirectoryOf("C:\\root/.sync-git/target", "C:/root")).toBe(
        true,
      );
    });

    it("应该处理尾随分隔符", () => {
      expect(isSubdirectoryOf("C:/root/sub/", "C:/root/")).toBe(true);
      expect(isSubdirectoryOf("C:\\root\\sub\\", "C:\\root\\")).toBe(true);
    });
  });

  describe("邊界條件測試", () => {
    it("应该处理根目录", () => {
      if (process.platform === "win32") {
        expect(isSubdirectoryOf("C:\\", "C:\\")).toBe(true);
        expect(isSubdirectoryOf("C:\\sub", "C:\\")).toBe(true);
      } else {
        expect(isSubdirectoryOf("/", "/")).toBe(true);
        expect(isSubdirectoryOf("/sub", "/")).toBe(true);
      }
    });

    it("应该处理相对路径", () => {
      expect(isSubdirectoryOf("./sub", ".")).toBe(true);
      expect(isSubdirectoryOf("../other", ".")).toBe(false);
      expect(isSubdirectoryOf("sub/deep", "sub")).toBe(true);
    });

    it("应该处理空字符串和特殊字符", () => {
      expect(isSubdirectoryOf("", "")).toBe(true);
      expect(isSubdirectoryOf("a", "")).toBe(false);
      expect(isSubdirectoryOf("", "a")).toBe(false);
    });
  });
});

describe("analyzePathRelationship", () => {
  it("应该提供详细的路径分析", () => {
    const targetPath = "C:/root\\.sync-git\\target";
    const sourcePath = "C:\\root";

    const analysis = analyzePathRelationship(targetPath, sourcePath);

    expect(analysis.isSubdirectory).toBe(true);
    expect(analysis.normalizedTarget).toBe(path.normalize(targetPath));
    expect(analysis.normalizedSource).toBe(path.normalize(sourcePath));
    expect(analysis.startsWithCheck).toBe(true);
    expect(analysis.equalityCheck).toBe(false);
    expect(analysis.separator).toBe(path.sep);
  });

  it("应该分析相同路径", () => {
    const targetPath = "C:\\root";
    const sourcePath = "C:/root";

    const analysis = analyzePathRelationship(targetPath, sourcePath);

    expect(analysis.isSubdirectory).toBe(true);
    expect(analysis.startsWithCheck).toBe(false);
    expect(analysis.equalityCheck).toBe(true);
  });

  it("应该分析非子目录关系", () => {
    const targetPath = "/other/path";
    const sourcePath = "/root";

    const analysis = analyzePathRelationship(targetPath, sourcePath);

    expect(analysis.isSubdirectory).toBe(false);
    expect(analysis.startsWithCheck).toBe(false);
    expect(analysis.equalityCheck).toBe(false);
  });

  it("应该包含正確的分隔符信息", () => {
    const analysis = analyzePathRelationship("any", "path");

    expect(analysis.separator).toBe(path.sep);
    if (process.platform === "win32") {
      expect(analysis.separator).toBe("\\");
    } else {
      expect(analysis.separator).toBe("/");
    }
  });
});
