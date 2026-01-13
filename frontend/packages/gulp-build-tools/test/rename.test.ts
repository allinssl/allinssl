import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRenameTask, renameHelpers, batchRename } from '../src/modules/rename.js';
import { RenameConfig } from '../src/types.js';
import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

describe('rename module', () => {
  const testDir = './test-temp/rename';
  const srcDir = path.join(testDir, 'src');
  const destDir = path.join(testDir, 'dest');

  beforeEach(async () => {
    // 创建测试目录和文件
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.mkdir(destDir, { recursive: true });
    
    // 创建测试文件
    await fs.promises.writeFile(path.join(srcDir, 'test1.js'), 'console.log("test1");');
    await fs.promises.writeFile(path.join(srcDir, 'test2.js'), 'console.log("test2");');
    await fs.promises.writeFile(path.join(srcDir, 'style.css'), '.test { color: red; }');
  });

  afterEach(async () => {
    // 清理测试目录
    await rimraf(testDir);
  });

  describe('createRenameTask', () => {
    it('should rename files with string', async () => {
      const config: RenameConfig = {
        src: path.join(srcDir, '*.js'),
        rename: 'bundle.js',
        dest: destDir
      };

      const task = createRenameTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 检查文件是否被重命名
      const files = await fs.promises.readdir(destDir);
      expect(files).toContain('bundle.js');
    });

    it('should rename files with function', async () => {
      const config: RenameConfig = {
        src: path.join(srcDir, '*.js'),
        rename: (path) => {
          path.basename = path.basename + '.min';
        },
        dest: destDir
      };

      const task = createRenameTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 检查文件是否被重命名
      const files = await fs.promises.readdir(destDir);
      expect(files).toContain('test1.min.js');
      expect(files).toContain('test2.min.js');
    });
  });

  describe('renameHelpers', () => {
    it('should add prefix correctly', () => {
      const mockPath = { basename: 'test', extname: '.js' };
      renameHelpers.addPrefix('prefix-')(mockPath);
      expect(mockPath.basename).toBe('prefix-test');
    });

    it('should add suffix correctly', () => {
      const mockPath = { basename: 'test', extname: '.js' };
      renameHelpers.addSuffix('-suffix')(mockPath);
      expect(mockPath.basename).toBe('test-suffix');
    });

    it('should change extension correctly', () => {
      const mockPath = { basename: 'test', extname: '.js' };
      renameHelpers.changeExtension('.min.js')(mockPath);
      expect(mockPath.extname).toBe('.min.js');
    });

    it('should convert to lowercase', () => {
      const mockPath = { basename: 'TEST', extname: '.js' };
      renameHelpers.toLowerCase()(mockPath);
      expect(mockPath.basename).toBe('test');
    });

    it('should convert to uppercase', () => {
      const mockPath = { basename: 'test', extname: '.js' };
      renameHelpers.toUpperCase()(mockPath);
      expect(mockPath.basename).toBe('TEST');
    });

    it('should replace characters in name', () => {
      const mockPath = { basename: 'old-name', extname: '.js' };
      renameHelpers.replaceInName('old', 'new')(mockPath);
      expect(mockPath.basename).toBe('new-name');
    });

    it('should add timestamp', () => {
      const mockPath = { basename: 'test', extname: '.js' };
      const originalBasename = mockPath.basename;
      renameHelpers.addTimestamp()(mockPath);
      
      expect(mockPath.basename).toMatch(new RegExp(`^${originalBasename}-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}`));
    });
  });

  describe('batchRename', () => {
    it('should handle multiple rename operations', async () => {
      const configs: RenameConfig[] = [
        {
          src: path.join(srcDir, '*.js'),
          rename: renameHelpers.addPrefix('js-'),
          dest: destDir
        },
        {
          src: path.join(srcDir, '*.css'),
          rename: renameHelpers.addPrefix('css-'),
          dest: destDir
        }
      ];

      const results = await batchRename(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      const files = await fs.promises.readdir(destDir);
      expect(files).toContain('js-test1.js');
      expect(files).toContain('js-test2.js');
      expect(files).toContain('css-style.css');
    });

    it('should handle errors gracefully', async () => {
      const configs: RenameConfig[] = [
        {
          src: 'non-existent/**/*.js',
          rename: 'test.js',
          dest: '/invalid/path'
        }
      ];

      const results = await batchRename(configs);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });
});