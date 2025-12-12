import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCompressTask, compressHelpers, batchCompress } from '../src/modules/compress.js';
import { CompressConfig } from '../src/types.js';
import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { extract } from 'tar-fs';

describe('compress module', () => {
  const testDir = './test-temp/compress';
  const srcDir = path.join(testDir, 'src');
  const destDir = path.join(testDir, 'dest');

  beforeEach(async () => {
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.mkdir(destDir, { recursive: true });
    
    // 创建测试文件
    await fs.promises.writeFile(path.join(srcDir, 'file1.txt'), 'This is test file 1');
    await fs.promises.writeFile(path.join(srcDir, 'file2.txt'), 'This is test file 2');
    
    // 创建子目录和文件
    const subDir = path.join(srcDir, 'subdir');
    await fs.promises.mkdir(subDir, { recursive: true });
    await fs.promises.writeFile(path.join(subDir, 'file3.txt'), 'This is test file 3 in subdirectory');
  });

  afterEach(async () => {
    await rimraf(testDir);
  });

  describe('createCompressTask', () => {
    it('should create ZIP archive', async () => {
      const config: CompressConfig = {
        src: path.join(srcDir, '**/*'),
        filename: 'test.zip',
        dest: destDir,
        type: 'zip'
      };

      const task = createCompressTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const zipPath = path.join(destDir, 'test.zip');
      expect(fs.existsSync(zipPath)).toBe(true);
      
      const stats = await fs.promises.stat(zipPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should create TAR archive', async () => {
      const config: CompressConfig = {
        src: path.join(srcDir, '**/*'),
        filename: 'test.tar',
        dest: destDir,
        type: 'tar'
      };

      const task = createCompressTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const tarPath = path.join(destDir, 'test.tar');
      expect(fs.existsSync(tarPath)).toBe(true);
      
      const stats = await fs.promises.stat(tarPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should create GZIP archive', async () => {
      const config: CompressConfig = {
        src: path.join(srcDir, '**/*'),
        filename: 'test.tar.gz',
        dest: destDir,
        type: 'gzip'
      };

      const task = createCompressTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const gzipPath = path.join(destDir, 'test.tar.gz');
      expect(fs.existsSync(gzipPath)).toBe(true);
      
      const stats = await fs.promises.stat(gzipPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle different compression levels', async () => {
      const configs: CompressConfig[] = [
        {
          src: path.join(srcDir, '**/*'),
          filename: 'fast.zip',
          dest: destDir,
          type: 'zip',
          level: 1
        },
        {
          src: path.join(srcDir, '**/*'),
          filename: 'best.zip',
          dest: destDir,
          type: 'zip',
          level: 9
        }
      ];

      for (const config of configs) {
        const task = createCompressTask(config);
        
        await new Promise<void>((resolve, reject) => {
          task((error?: Error) => {
            if (error) reject(error);
            else resolve();
          });
        });
      }

      const fastStats = await fs.promises.stat(path.join(destDir, 'fast.zip'));
      const bestStats = await fs.promises.stat(path.join(destDir, 'best.zip'));
      
      expect(fastStats.size).toBeGreaterThan(0);
      expect(bestStats.size).toBeGreaterThan(0);
      // 通常最高压缩级别的文件应该更小，但对于小文件可能差异不大
    });
  });

  describe('compressHelpers', () => {
    it('should create config correctly', () => {
      const config = compressHelpers.createConfig(
        'src/**/*',
        'test.zip',
        'dest',
        { level: 8, type: 'zip' }
      );

      expect(config.src).toBe('src/**/*');
      expect(config.filename).toBe('test.zip');
      expect(config.dest).toBe('dest');
      expect(config.level).toBe(8);
      expect(config.type).toBe('zip');
    });

    it('should infer type from filename', () => {
      expect(compressHelpers.inferType('test.zip')).toBe('zip');
      expect(compressHelpers.inferType('test.tar')).toBe('tar');
      expect(compressHelpers.inferType('test.tar.gz')).toBe('gzip');
      expect(compressHelpers.inferType('test.tgz')).toBe('gzip');
      expect(compressHelpers.inferType('unknown.ext')).toBe('zip');
    });

    it('should generate timestamped filename', () => {
      const filename = compressHelpers.timestampedFilename('backup');
      expect(filename).toMatch(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.zip$/);
      
      const customExt = compressHelpers.timestampedFilename('backup', 'tar.gz');
      expect(customExt).toMatch(/^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.tar\.gz$/);
    });

    it('should get compression levels', () => {
      expect(compressHelpers.getCompressionLevel('speed')).toBe(1);
      expect(compressHelpers.getCompressionLevel('size')).toBe(9);
      expect(compressHelpers.getCompressionLevel('balanced')).toBe(6);
      expect(compressHelpers.getCompressionLevel()).toBe(6); // default
    });

    it('should validate config', () => {
      const validConfig: CompressConfig = {
        src: 'src/**/*',
        filename: 'test.zip',
        dest: 'dest'
      };
      expect(compressHelpers.validateConfig(validConfig)).toEqual([]);

      const invalidConfig: CompressConfig = {
        src: '',
        filename: '',
        dest: '',
        level: 15
      };
      const errors = compressHelpers.validateConfig(invalidConfig);
      expect(errors).toContain('缺少源文件路径');
      expect(errors).toContain('缺少压缩包文件名');
      expect(errors).toContain('缺少输出目录');
      expect(errors).toContain('压缩级别必须在 0-9 之间');
    });
  });

  describe('batchCompress', () => {
    it('should handle multiple compress operations', async () => {
      const configs: CompressConfig[] = [
        {
          src: path.join(srcDir, '*.txt'),
          filename: 'texts.zip',
          dest: destDir
        },
        {
          src: path.join(srcDir, 'subdir/**/*'),
          filename: 'subdir.zip',
          dest: destDir
        }
      ];

      const results = await batchCompress(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      expect(fs.existsSync(path.join(destDir, 'texts.zip'))).toBe(true);
      expect(fs.existsSync(path.join(destDir, 'subdir.zip'))).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const configs: CompressConfig[] = [
        {
          src: 'non-existent/**/*',
          filename: 'test.zip',
          dest: '/invalid/path'
        }
      ];

      const results = await batchCompress(configs);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('real-world scenarios', () => {
    it('should compress build directory', async () => {
      // 模拟构建目录结构
      const buildDir = path.join(srcDir, 'build');
      await fs.promises.mkdir(path.join(buildDir, 'js'), { recursive: true });
      await fs.promises.mkdir(path.join(buildDir, 'css'), { recursive: true });
      await fs.promises.mkdir(path.join(buildDir, 'assets'), { recursive: true });
      
      await fs.promises.writeFile(path.join(buildDir, 'index.html'), '<html>...</html>');
      await fs.promises.writeFile(path.join(buildDir, 'js', 'app.js'), 'console.log("app");');
      await fs.promises.writeFile(path.join(buildDir, 'css', 'style.css'), '.app {}');
      await fs.promises.writeFile(path.join(buildDir, 'assets', 'logo.png'), 'fake-png-data');

      const config: CompressConfig = {
        src: path.join(buildDir, '**/*'),
        filename: compressHelpers.timestampedFilename('build'),
        dest: destDir,
        level: compressHelpers.getCompressionLevel('balanced')
      };

      const task = createCompressTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const files = await fs.promises.readdir(destDir);
      const zipFile = files.find(f => f.startsWith('build-') && f.endsWith('.zip'));
      
      expect(zipFile).toBeDefined();
      
      if (zipFile) {
        const stats = await fs.promises.stat(path.join(destDir, zipFile));
        expect(stats.size).toBeGreaterThan(0);
      }
    });

    it('should create release package with version', async () => {
      const version = '1.2.3';
      const config: CompressConfig = {
        src: path.join(srcDir, '**/*'),
        filename: `release-v${version}.tar.gz`,
        dest: destDir,
        type: 'gzip',
        level: 9
      };

      const task = createCompressTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const releasePath = path.join(destDir, `release-v${version}.tar.gz`);
      expect(fs.existsSync(releasePath)).toBe(true);
      
      const stats = await fs.promises.stat(releasePath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});