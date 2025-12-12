import { series, parallel } from 'gulp';
import { GulpBuildTools, createBuildTools, CompressConfig } from '../src/index.js';

/**
 * 多压缩任务示例
 * 展示如何使用 Gulp Build Tools 进行多个文件的并行和串行压缩
 */

// 创建构建工具实例
const buildTools = createBuildTools({
  cwd: process.cwd(),
  verbose: true,
  tempDir: './temp'
});

/**
 * 示例 1: 串行多压缩任务
 * 按顺序依次压缩多个文件包
 */
const serialMultiCompressConfigs: CompressConfig[] = [
  {
    src: ['src/**/*.ts'],
    filename: 'source-code.zip',
    dest: './dist/archives',
    type: 'zip',
    level: 6
  },
  {
    src: ['docs/**/*.md'],
    filename: 'documentation.tar.gz',
    dest: './dist/archives',
    type: 'gzip',
    level: 9
  },
  {
    src: ['assets/**/*'],
    filename: 'assets-bundle.zip',
    dest: './dist/archives',
    type: 'zip',
    level: 4
  }
];

export const serialMultiCompress = buildTools.multiCompress(serialMultiCompressConfigs, false);

/**
 * 示例 2: 并行多压缩任务
 * 同时压缩多个文件包，提高效率
 */
const parallelMultiCompressConfigs: CompressConfig[] = [
  {
    src: ['build/**/*.js', 'build/**/*.css'],
    filename: 'production-assets.zip',
    dest: './releases',
    type: 'zip',
    level: 9
  },
  {
    src: ['tests/**/*.spec.ts'],
    filename: 'test-files.tar',
    dest: './backups',
    type: 'tar'
  },
  {
    src: ['config/**/*.json', 'config/**/*.yaml'],
    filename: 'configurations.zip',
    dest: './backups',
    type: 'zip',
    level: 6
  }
];

export const parallelMultiCompress = buildTools.multiCompress(parallelMultiCompressConfigs, true);

/**
 * 示例 3: 多环境部署包压缩
 * 为不同环境创建对应的部署包
 */
const environmentPackages: CompressConfig[] = [
  {
    src: ['dist/dev/**/*'],
    filename: 'app-dev-v1.0.0.zip',
    dest: './releases/dev',
    type: 'zip',
    level: 6
  },
  {
    src: ['dist/staging/**/*'],
    filename: 'app-staging-v1.0.0.zip',
    dest: './releases/staging',
    type: 'zip',
    level: 6
  },
  {
    src: ['dist/production/**/*'],
    filename: 'app-production-v1.0.0.zip',
    dest: './releases/production',
    type: 'zip',
    level: 9
  }
];

export const multiEnvironmentCompress = buildTools.multiCompress(environmentPackages, true);

/**
 * 示例 4: Monorepo 模块压缩
 * 为 Monorepo 中的每个模块单独打包
 */
const monorepoPackages: CompressConfig[] = [
  {
    src: ['packages/ui-components/dist/**/*'],
    filename: 'ui-components-v2.1.0.zip',
    dest: './releases/packages',
    type: 'zip',
    level: 8
  },
  {
    src: ['packages/utils/dist/**/*'],
    filename: 'utils-v1.5.2.zip',
    dest: './releases/packages',
    type: 'zip',
    level: 8
  },
  {
    src: ['packages/api-client/dist/**/*'],
    filename: 'api-client-v3.0.1.zip',
    dest: './releases/packages',
    type: 'zip',
    level: 8
  },
  {
    src: ['apps/web-app/dist/**/*'],
    filename: 'web-app-v1.0.0.tar.gz',
    dest: './releases/apps',
    type: 'gzip',
    level: 9
  }
];

export const monorepoMultiCompress = buildTools.multiCompress(monorepoPackages, false);

/**
 * 示例 5: 备份归档系统
 * 创建不同类型的备份文件
 */
const backupConfigs: CompressConfig[] = [
  {
    src: ['src/**/*.ts', 'src/**/*.js'],
    filename: `source-backup-${new Date().toISOString().slice(0, 10)}.zip`,
    dest: './backups/daily',
    type: 'zip',
    level: 9
  },
  {
    src: ['database/**/*.sql'],
    filename: `database-backup-${new Date().toISOString().slice(0, 10)}.tar.gz`,
    dest: './backups/database',
    type: 'gzip',
    level: 9
  },
  {
    src: ['logs/**/*.log'],
    filename: `logs-backup-${new Date().toISOString().slice(0, 10)}.tar`,
    dest: './backups/logs',
    type: 'tar'
  },
  {
    src: ['uploads/**/*'],
    filename: `uploads-backup-${new Date().toISOString().slice(0, 10)}.zip`,
    dest: './backups/uploads',
    type: 'zip',
    level: 6
  }
];

export const backupMultiCompress = buildTools.multiCompress(backupConfigs, true);

/**
 * 示例 6: 不同压缩级别的性能测试
 * 使用不同压缩级别创建相同文件的多个版本
 */
const compressionLevelTest: CompressConfig[] = [
  {
    src: ['test-data/**/*'],
    filename: 'test-data-speed.zip',
    dest: './performance-test',
    type: 'zip',
    level: 1 // 最快压缩
  },
  {
    src: ['test-data/**/*'],
    filename: 'test-data-balanced.zip',
    dest: './performance-test',
    type: 'zip',
    level: 6 // 平衡压缩
  },
  {
    src: ['test-data/**/*'],
    filename: 'test-data-maximum.zip',
    dest: './performance-test',
    type: 'zip',
    level: 9 // 最大压缩
  }
];

export const compressionTestMultiCompress = buildTools.multiCompress(compressionLevelTest, false);

/**
 * 示例 7: 混合格式多压缩
 * 创建不同格式的压缩文件以满足不同需求
 */
const mixedFormatConfigs: CompressConfig[] = [
  {
    src: ['build/**/*'],
    filename: 'release.zip',
    dest: './releases',
    type: 'zip',
    level: 6
  },
  {
    src: ['build/**/*'],
    filename: 'release.tar.gz',
    dest: './releases',
    type: 'gzip',
    level: 9
  },
  {
    src: ['build/**/*'],
    filename: 'release.tar',
    dest: './releases',
    type: 'tar'
  }
];

export const mixedFormatMultiCompress = buildTools.multiCompress(mixedFormatConfigs, true);

/**
 * 完整的部署流水线示例
 * 包含多压缩任务的完整部署流程
 */
export const deploymentPipeline = series(
  // 首先创建环境特定的压缩包
  multiEnvironmentCompress,
  
  // 然后创建备份
  backupMultiCompress,
  
  // 最后打包 Monorepo 模块
  parallel(
    monorepoMultiCompress,
    mixedFormatMultiCompress
  )
);

/**
 * 使用助手函数创建压缩配置的示例
 */
import { compressHelpers } from '../src/modules/compress.js';

const dynamicConfigs: CompressConfig[] = [
  compressHelpers.createConfig(
    ['src/**/*.ts'],
    compressHelpers.timestampedFilename('source-code'),
    './releases',
    {
      type: 'zip',
      level: compressHelpers.getCompressionLevel('balanced')
    }
  ),
  compressHelpers.createConfig(
    ['docs/**/*.md'],
    compressHelpers.timestampedFilename('documentation', 'tar.gz'),
    './releases',
    {
      type: 'gzip',
      level: compressHelpers.getCompressionLevel('size')
    }
  )
];

export const dynamicMultiCompress = buildTools.multiCompress(dynamicConfigs, true);

/**
 * 条件压缩示例
 * 根据环境变量决定压缩策略
 */
const conditionalConfigs: CompressConfig[] = [];

// 根据环境添加不同的压缩配置
if (process.env.NODE_ENV === 'production') {
  conditionalConfigs.push({
    src: ['dist/**/*'],
    filename: 'production-release.zip',
    dest: './releases',
    type: 'zip',
    level: 9 // 生产环境使用最大压缩
  });
} else {
  conditionalConfigs.push({
    src: ['dist/**/*'],
    filename: 'development-build.zip',
    dest: './builds',
    type: 'zip',
    level: 1 // 开发环境优先速度
  });
}

// 总是创建源码备份
conditionalConfigs.push({
  src: ['src/**/*'],
  filename: compressHelpers.timestampedFilename('source-backup'),
  dest: './backups',
  type: 'zip',
  level: 6
});

export const conditionalMultiCompress = buildTools.multiCompress(conditionalConfigs, false);

/**
 * 定义所有任务，方便在 gulpfile 中使用
 */
export const multiCompressTasks = {
  'multi-compress:serial': serialMultiCompress,
  'multi-compress:parallel': parallelMultiCompress,
  'multi-compress:environments': multiEnvironmentCompress,
  'multi-compress:monorepo': monorepoMultiCompress,
  'multi-compress:backup': backupMultiCompress,
  'multi-compress:performance-test': compressionTestMultiCompress,
  'multi-compress:mixed-format': mixedFormatMultiCompress,
  'multi-compress:dynamic': dynamicMultiCompress,
  'multi-compress:conditional': conditionalMultiCompress,
  'deploy:full-pipeline': deploymentPipeline
};

// 导出默认任务
export default deploymentPipeline;