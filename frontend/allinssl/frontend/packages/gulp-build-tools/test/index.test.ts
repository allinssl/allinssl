import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GulpBuildTools, createBuildTools, helpers, presets } from '../src/index.js';
import { BuildToolsConfig } from '../src/types.js';
import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

describe('index module', () => {
  const testDir = './test-temp/index';
  let buildTools: GulpBuildTools;

  beforeEach(async () => {
    await fs.promises.mkdir(testDir, { recursive: true });
    
    buildTools = createBuildTools({
      cwd: testDir,
      verbose: false,
      tempDir: path.join(testDir, 'temp')
    });
  });

  afterEach(async () => {
    await rimraf(testDir);
  });

  describe('GulpBuildTools class', () => {
    it('should create instance with default config', () => {
      const tools = new GulpBuildTools();
      expect(tools).toBeInstanceOf(GulpBuildTools);
    });

    it('should create instance with custom config', () => {
      const config: BuildToolsConfig = {
        cwd: '/custom/path',
        verbose: true,
        tempDir: '/tmp'
      };
      
      const tools = new GulpBuildTools(config);
      expect(tools).toBeInstanceOf(GulpBuildTools);
    });

    it('should have all required methods', () => {
      expect(buildTools.renameFiles).toBeDefined();
      expect(buildTools.replaceContent).toBeDefined();
      expect(buildTools.uploadFiles).toBeDefined();
      expect(buildTools.compressFiles).toBeDefined();
      expect(buildTools.gitOperation).toBeDefined();
      expect(buildTools.sshExecution).toBeDefined();
      expect(buildTools.createBuildPipeline).toBeDefined();
      expect(buildTools.createParallelTasks).toBeDefined();
      expect(buildTools.createSeriesTasks).toBeDefined();
    });
  });

  describe('createBuildTools function', () => {
    it('should create build tools instance', () => {
      const tools = createBuildTools();
      expect(tools).toBeInstanceOf(GulpBuildTools);
    });

    it('should pass config to instance', () => {
      const config: BuildToolsConfig = {
        verbose: true,
        tempDir: './custom-temp'
      };
      
      const tools = createBuildTools(config);
      expect(tools).toBeInstanceOf(GulpBuildTools);
    });
  });

  describe('createBuildPipeline', () => {
    it('should create empty pipeline', () => {
      const pipeline = buildTools.createBuildPipeline({});
      expect(pipeline).toBeDefined();
      expect(typeof pipeline).toBe('function');
    });

    it('should create pipeline with single task', () => {
      const srcDir = path.join(testDir, 'src');
      const destDir = path.join(testDir, 'dest');
      
      const pipeline = buildTools.createBuildPipeline({
        replace: [{
          src: path.join(srcDir, '**/*.js'),
          replacements: [
            { search: 'test', replace: 'production' }
          ],
          dest: destDir
        }]
      });

      expect(pipeline).toBeDefined();
      expect(typeof pipeline).toBe('function');
      expect(pipeline.displayName).toBe('build-pipeline');
    });

    it('should create pipeline with multiple task types', () => {
      const srcDir = path.join(testDir, 'src');
      const destDir = path.join(testDir, 'dest');
      
      const pipeline = buildTools.createBuildPipeline({
        replace: [{
          src: path.join(srcDir, '**/*.js'),
          replacements: [{ search: 'dev', replace: 'prod' }],
          dest: destDir
        }],
        rename: [{
          src: path.join(destDir, '**/*.js'),
          rename: helpers.rename.addSuffix('.min'),
          dest: destDir
        }],
        compress: {
          src: path.join(destDir, '**/*'),
          filename: 'bundle.zip',
          dest: path.join(testDir, 'releases')
        }
      });

      expect(pipeline).toBeDefined();
      expect(typeof pipeline).toBe('function');
    });
  });

  describe('createParallelTasks', () => {
    it('should create parallel tasks', () => {
      const srcDir = path.join(testDir, 'src');
      const destDir = path.join(testDir, 'dest');
      
      const tasks = {
        'task1': buildTools.renameFiles({
          src: path.join(srcDir, '*.js'),
          rename: 'bundle1.js',
          dest: destDir
        }),
        'task2': buildTools.renameFiles({
          src: path.join(srcDir, '*.css'),
          rename: 'bundle2.css',
          dest: destDir
        })
      };

      const parallelTask = buildTools.createParallelTasks(tasks);
      
      expect(parallelTask).toBeDefined();
      expect(typeof parallelTask).toBe('function');
      expect(parallelTask.displayName).toBe('parallel-tasks');
    });
  });

  describe('createSeriesTasks', () => {
    it('should create series tasks', () => {
      const srcDir = path.join(testDir, 'src');
      const destDir = path.join(testDir, 'dest');
      
      const tasks = {
        'step1': buildTools.replaceContent({
          src: path.join(srcDir, '**/*.js'),
          replacements: [{ search: 'old', replace: 'new' }],
          dest: destDir
        }),
        'step2': buildTools.compressFiles({
          src: path.join(destDir, '**/*'),
          filename: 'result.zip',
          dest: path.join(testDir, 'output')
        })
      };

      const seriesTask = buildTools.createSeriesTasks(tasks);
      
      expect(seriesTask).toBeDefined();
      expect(typeof seriesTask).toBe('function');
      expect(seriesTask.displayName).toBe('series-tasks');
    });
  });

  describe('helpers export', () => {
    it('should export all helper modules', () => {
      expect(helpers).toBeDefined();
      expect(helpers.rename).toBeDefined();
      expect(helpers.replace).toBeDefined();
      expect(helpers.upload).toBeDefined();
      expect(helpers.compress).toBeDefined();
      expect(helpers.git).toBeDefined();
      expect(helpers.ssh).toBeDefined();
    });

    it('should have working rename helpers', () => {
      expect(helpers.rename.addPrefix).toBeDefined();
      expect(helpers.rename.addSuffix).toBeDefined();
      expect(helpers.rename.changeExtension).toBeDefined();
      expect(helpers.rename.addTimestamp).toBeDefined();
      expect(helpers.rename.toLowerCase).toBeDefined();
      expect(helpers.rename.toUpperCase).toBeDefined();
      expect(helpers.rename.replaceInName).toBeDefined();
    });

    it('should have working replace helpers', () => {
      expect(helpers.replace.version).toBeDefined();
      expect(helpers.replace.apiBaseUrl).toBeDefined();
      expect(helpers.replace.envVariable).toBeDefined();
      expect(helpers.replace.htmlTitle).toBeDefined();
      expect(helpers.replace.copyright).toBeDefined();
      expect(helpers.replace.timestamp).toBeDefined();
      expect(helpers.replace.buildNumber).toBeDefined();
      expect(helpers.replace.cssColor).toBeDefined();
      expect(helpers.replace.jsConfig).toBeDefined();
    });

    it('should have working compress helpers', () => {
      expect(helpers.compress.createConfig).toBeDefined();
      expect(helpers.compress.inferType).toBeDefined();
      expect(helpers.compress.timestampedFilename).toBeDefined();
      expect(helpers.compress.getCompressionLevel).toBeDefined();
      expect(helpers.compress.validateConfig).toBeDefined();
    });
  });

  describe('presets export', () => {
    it('should export all preset modules', () => {
      expect(presets).toBeDefined();
      expect(presets.frontend).toBeDefined();
      expect(presets.backend).toBeDefined();
      expect(presets.general).toBeDefined();
    });

    it('should have frontend presets', () => {
      expect(presets.frontend.vueDeploy).toBeDefined();
      expect(presets.frontend.optimize).toBeDefined();
    });

    it('should have backend presets', () => {
      expect(presets.backend.nodeDeploy).toBeDefined();
    });

    it('should have general presets', () => {
      expect(presets.general.backupAndDeploy).toBeDefined();
    });

    it('should create valid vue deploy config', () => {
      const config = presets.frontend.vueDeploy({
        buildDir: 'dist',
        serverConfig: {
          type: 'sftp',
          host: 'example.com',
          username: 'user',
          password: 'pass',
          remotePath: '/var/www',
          src: 'dist/**/*'
        }
      });

      expect(config).toBeDefined();
      expect(config.replace).toBeDefined();
      expect(config.compress).toBeDefined();
      expect(config.upload).toBeDefined();
      expect(Array.isArray(config.replace)).toBe(true);
    });

    it('should create valid optimization config', () => {
      const config = presets.frontend.optimize('dist');
      
      expect(config).toBeDefined();
      expect(config.replace).toBeDefined();
      expect(Array.isArray(config.replace)).toBe(true);
      expect(config.replace![0].src).toContain('dist');
    });

    it('should create valid node deploy config', () => {
      const config = presets.backend.nodeDeploy({
        appPath: '/var/www/app',
        serverConfig: {
          type: 'sftp',
          host: 'server.com',
          username: 'deploy',
          password: 'pass',
          remotePath: '/var/www',
          src: 'dist/**/*'
        },
        sshConfig: {
          host: 'server.com',
          username: 'deploy',
          password: 'pass',
          commands: []
        }
      });

      expect(config).toBeDefined();
      expect(config.git).toBeDefined();
      expect(config.upload).toBeDefined();
      expect(config.ssh).toBeDefined();
    });
  });

  describe('integration tests', () => {
    it('should work with real file operations', async () => {
      const srcDir = path.join(testDir, 'src');
      const destDir = path.join(testDir, 'dest');
      
      await fs.promises.mkdir(srcDir, { recursive: true });
      await fs.promises.mkdir(destDir, { recursive: true });
      
      // 创建测试文件
      await fs.promises.writeFile(
        path.join(srcDir, 'test.js'),
        'const version = "{{VERSION}}";'
      );

      // 创建简单的替换任务
      const task = buildTools.replaceContent({
        src: path.join(srcDir, '*.js'),
        replacements: [
          { search: '{{VERSION}}', replace: '1.0.0' }
        ],
        dest: destDir
      });

      // 执行任务
      await new Promise<void>((resolve, reject) => {
        task((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 验证结果
      const content = await fs.promises.readFile(path.join(destDir, 'test.js'), 'utf8');
      expect(content).toBe('const version = "1.0.0";');
    });

    it('should work with build pipeline', async () => {
      const srcDir = path.join(testDir, 'src');
      const buildDir = path.join(testDir, 'build');
      const releaseDir = path.join(testDir, 'releases');
      
      await fs.promises.mkdir(srcDir, { recursive: true });
      await fs.promises.mkdir(buildDir, { recursive: true });
      await fs.promises.mkdir(releaseDir, { recursive: true });
      
      // 创建测试文件
      await fs.promises.writeFile(
        path.join(srcDir, 'app.js'),
        'const env = "development"; const version = "{{VERSION}}";'
      );

      // 创建构建流水线
      const pipeline = buildTools.createBuildPipeline({
        replace: [{
          src: path.join(srcDir, '*.js'),
          replacements: [
            { search: 'development', replace: 'production' },
            { search: '{{VERSION}}', replace: '2.0.0' }
          ],
          dest: buildDir
        }],
        rename: [{
          src: path.join(buildDir, '*.js'),
          rename: helpers.rename.addSuffix('.min'),
          dest: buildDir
        }],
        compress: {
          src: path.join(buildDir, '**/*'),
          filename: 'release.zip',
          dest: releaseDir
        }
      });

      // 执行流水线
      await new Promise<void>((resolve, reject) => {
        pipeline((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 验证结果
      const buildContent = await fs.promises.readFile(path.join(buildDir, 'app.min.js'), 'utf8');
      expect(buildContent).toContain('production');
      expect(buildContent).toContain('2.0.0');
      
      const releaseFiles = await fs.promises.readdir(releaseDir);
      expect(releaseFiles).toContain('release.zip');
    });
  });
});