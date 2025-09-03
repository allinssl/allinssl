import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createReplaceTask, replacePatterns, batchReplace } from '../src/modules/replace.js';
import { ReplaceConfig } from '../src/types.js';
import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

describe('replace module', () => {
  const testDir = './test-temp/replace';
  const srcDir = path.join(testDir, 'src');
  const destDir = path.join(testDir, 'dest');

  beforeEach(async () => {
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.mkdir(destDir, { recursive: true });
    
    // 创建测试文件
    await fs.promises.writeFile(
      path.join(srcDir, 'config.js'),
      `const API_URL = "{{API_URL}}";
const VERSION = "{{VERSION}}";
const DEBUG = true;`
    );
    
    await fs.promises.writeFile(
      path.join(srcDir, 'index.html'),
      `<!DOCTYPE html>
<html>
<head>
  <title>{{TITLE}}</title>
</head>
<body>
  <h1>{{TITLE}}</h1>
  <p>Version: {{VERSION}}</p>
</body>
</html>`
    );

    await fs.promises.writeFile(
      path.join(srcDir, 'package.json'),
      `{
  "name": "test-app",
  "version": "1.0.0",
  "description": "Test application"
}`
    );
  });

  afterEach(async () => {
    await rimraf(testDir);
  });

  describe('createReplaceTask', () => {
    it('should replace content with string', async () => {
      const config: ReplaceConfig = {
        src: path.join(srcDir, 'config.js'),
        replacements: [
          {
            search: '{{API_URL}}',
            replace: 'https://api.example.com'
          },
          {
            search: '{{VERSION}}',
            replace: '2.0.0'
          }
        ],
        dest: destDir
      };

      const task = createReplaceTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const content = await fs.promises.readFile(path.join(destDir, 'config.js'), 'utf8');
      expect(content).toContain('https://api.example.com');
      expect(content).toContain('2.0.0');
      expect(content).not.toContain('{{API_URL}}');
      expect(content).not.toContain('{{VERSION}}');
    });

    it('should replace content with regex', async () => {
      const config: ReplaceConfig = {
        src: path.join(srcDir, 'config.js'),
        replacements: [
          {
            search: /const\s+DEBUG\s*=\s*true/g,
            replace: 'const DEBUG = false'
          }
        ],
        dest: destDir
      };

      const task = createReplaceTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const content = await fs.promises.readFile(path.join(destDir, 'config.js'), 'utf8');
      expect(content).toContain('const DEBUG = false');
      expect(content).not.toContain('const DEBUG = true');
    });

    it('should replace content with function', async () => {
      const config: ReplaceConfig = {
        src: path.join(srcDir, 'config.js'),
        replacements: [
          {
            search: /{{([A-Z_]+)}}/g,
            replace: (match, varName) => {
              const replacements: Record<string, string> = {
                'API_URL': 'https://api.production.com',
                'VERSION': '3.0.0'
              };
              return replacements[varName] || match;
            }
          }
        ],
        dest: destDir
      };

      const task = createReplaceTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const content = await fs.promises.readFile(path.join(destDir, 'config.js'), 'utf8');
      expect(content).toContain('https://api.production.com');
      expect(content).toContain('3.0.0');
    });
  });

  describe('replacePatterns', () => {
    it('should create version replacement pattern', () => {
      const pattern = replacePatterns.version('2.5.0');
      expect(pattern.search).toBeInstanceOf(RegExp);
      expect(pattern.replace).toBe('"version": "2.5.0"');
    });

    it('should create API base URL replacement pattern', () => {
      const pattern = replacePatterns.apiBaseUrl('https://new-api.com');
      expect(pattern.search).toBeInstanceOf(RegExp);
      expect(pattern.replace).toBe("const API_BASE_URL = 'https://new-api.com'");
    });

    it('should create environment variable replacement pattern', () => {
      const pattern = replacePatterns.envVariable('NODE_ENV', 'production');
      expect(pattern.search).toBeInstanceOf(RegExp);
      expect(pattern.replace).toBe('NODE_ENV=production');
    });

    it('should create HTML title replacement pattern', () => {
      const pattern = replacePatterns.htmlTitle('My New App');
      expect(pattern.search).toBeInstanceOf(RegExp);
      expect(pattern.replace).toBe('<title>My New App</title>');
    });

    it('should create timestamp replacement pattern', () => {
      const pattern = replacePatterns.timestamp();
      expect(pattern.search).toBeInstanceOf(RegExp);
      expect(pattern.replace).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('batchReplace', () => {
    it('should handle multiple replace operations', async () => {
      const configs: ReplaceConfig[] = [
        {
          src: path.join(srcDir, 'config.js'),
          replacements: [
            { search: '{{API_URL}}', replace: 'https://api1.com' }
          ],
          dest: destDir
        },
        {
          src: path.join(srcDir, 'index.html'),
          replacements: [
            { search: '{{TITLE}}', replace: 'Test App' },
            { search: '{{VERSION}}', replace: '1.5.0' }
          ],
          dest: destDir
        }
      ];

      const results = await batchReplace(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      const configContent = await fs.promises.readFile(path.join(destDir, 'config.js'), 'utf8');
      const htmlContent = await fs.promises.readFile(path.join(destDir, 'index.html'), 'utf8');
      
      expect(configContent).toContain('https://api1.com');
      expect(htmlContent).toContain('Test App');
      expect(htmlContent).toContain('1.5.0');
    });

    it('should handle errors gracefully', async () => {
      const configs: ReplaceConfig[] = [
        {
          src: 'non-existent.js',
          replacements: [
            { search: 'test', replace: 'replacement' }
          ],
          dest: '/invalid/path'
        }
      ];

      const results = await batchReplace(configs);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });

  describe('real-world scenarios', () => {
    it('should handle package.json version update', async () => {
      const config: ReplaceConfig = {
        src: path.join(srcDir, 'package.json'),
        replacements: [
          replacePatterns.version('2.0.0')
        ],
        dest: destDir
      };

      const task = createReplaceTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const content = await fs.promises.readFile(path.join(destDir, 'package.json'), 'utf8');
      const packageJson = JSON.parse(content);
      expect(packageJson.version).toBe('2.0.0');
    });

    it('should handle HTML template replacement', async () => {
      const config: ReplaceConfig = {
        src: path.join(srcDir, 'index.html'),
        replacements: [
          replacePatterns.htmlTitle('Production App'),
          { search: /{{VERSION}}/g, replace: '2.1.0' },
          { search: /<h1>{{TITLE}}<\/h1>/g, replace: '<h1>Production App</h1>' }
        ],
        dest: destDir
      };

      const task = createReplaceTask(config);
      
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      const content = await fs.promises.readFile(path.join(destDir, 'index.html'), 'utf8');
      expect(content).toContain('<title>Production App</title>');
      expect(content).toContain('<h1>Production App</h1>');
      expect(content).toContain('Version: 2.1.0');
    });
  });
});