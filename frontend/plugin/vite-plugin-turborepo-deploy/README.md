# vite-plugin-turborepo-deploy

Vite插件，用于自动化Turborepo工作区编译部署，包含本地文件同步、Git项目管理和智能自动提交功能。

## 功能特点

### 1. 本地文件同步
- 支持多种同步模式：复制、镜像、增量更新
- 支持目标目录清空、仅添加新文件
- 灵活的文件过滤规则：正则表达式、glob模式
- 自动解析相对路径
- 在构建完成后执行

### 2. Git项目管理
- 多项目支持：配置多个Git项目的拉取/更新任务
- 自动分支管理：自动切换到指定分支
- 专注于仓库维护，不包含自动提交功能
- 集中存放：所有Git项目统一存放在工作区根目录的`.sync-git`目录下
- 在构建完成后最先执行

### 3. 独立的智能自动提交模块
- 完全独立于Git项目管理，作为单独模块运行
- 在Git项目管理和文件同步后执行，保证数据一致性
- 支持强大的自动提交功能：
  - 监听特定开发者的提交
  - 提交分隔符识别
  - 跨项目的共享提交信息机制
  - 自动处理重复分隔符
  - 支持多项目并发处理
- 在构建完成后最后执行

### 4. 顺序执行任务
- 所有任务在构建完成后的`closeBundle`钩子中执行
- 按固定顺序依次执行：Git项目管理 → 本地文件同步 → 自动提交
- 前一任务出错会中止后续任务

### 5. 日志记录系统
- 多级日志：error、warn、info、verbose
- 控制台彩色输出
- 按日期生成日志文件

### 6. 工作区根目录检测
- 自动检测Turborepo/PNPM/Yarn/NPM工作区根目录
- 所有路径（Git项目、文件同步、日志等）都基于工作区根目录
- 支持monorepo中的子项目使用相同的配置
- 所有Git项目统一存放在`.sync-git`目录下，便于管理

## 安装

```bash
npm install vite-plugin-turborepo-deploy --save-dev
# 或
yarn add vite-plugin-turborepo-deploy --dev
# 或
pnpm add vite-plugin-turborepo-deploy --save-dev
```

## 使用方法

在`vite.config.ts`中配置插件：

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import turborepoDeploy from 'vite-plugin-turborepo-deploy';

export default defineConfig({
  plugins: [
    turborepoDeploy({
      // 本地文件同步配置 (在Git项目管理后执行)
      // 路径相对于工作区根目录
      localSync: [
        { 
          source: 'dist', 
          target: 'deploy/public',  // 相对于工作区根目录
          mode: 'mirror', 
          clearTarget: true 
        },
        { 
          source: 'src/assets', 
          target: 'deploy/assets',  // 相对于工作区根目录
          excludeDirs: ['**/tmp'], 
          excludeFiles: ['**/*.psd'] 
        },
        {
          source: 'dist/shared',
          target: [  // 使用数组实现文件分发到多个目标路径
            'deploy/site-a/shared',
            'deploy/site-b/shared',
            'deploy/site-c/shared'
          ],
          mode: 'incremental'
        }
      ],
      
      // Git项目管理配置 (最先执行)
      // 所有Git项目都存放在工作区根目录的.sync-git目录下
      gitProjects: [
        {
          repo: 'git@github.com:example-org/api-gateway.git',
          branch: 'develop',
          targetDir: 'api-gateway',  // 相对于.sync-git目录
          projectName: 'API网关', // 用于日志中清晰标识
          updateIfExists: true,
          discardChanges: false  // 默认不丢弃未提交的更改
        },
        {
          repo: 'git@github.com:example-org/user-service.git',
          branch: 'feature/new-endpoint',
          targetDir: 'user-service',  // 相对于.sync-git目录
          projectName: '用户服务',
          updateIfExists: true,
          discardChanges: true  // 自动丢弃所有未提交的更改（谨慎使用）
        }
      ],
      
      // 自动提交配置 (最后执行)
      // 路径相对于.sync-git目录
      autoCommit: {
        // 启用在项目间共享提交信息
        enableSharedCommits: true,
        // 在提交后添加分隔符
        insertSeparator: true,
        // 要处理的项目列表
        projects: [
          {
            targetDir: 'api-gateway',  // 相对于.sync-git目录
            projectName: 'API网关', // 用于日志标识
            watchAuthor: '张三', // 作为提交信息来源
            maxScanCount: 100,
            commitSeparator: '/** 提交分隔符 **/',
            message: 'chore(api-gateway): auto merge [skip ci]',
            push: true,
            // 不使用共享提交信息，作为提交信息源
            useSharedCommits: false,
            // 可以指定分支，不指定则使用当前分支
            branch: 'develop'
          },
          {
            targetDir: 'user-service',  // 相对于.sync-git目录
            projectName: '用户服务',
            // 不需要watchAuthor，因为使用共享提交信息
            useSharedCommits: true, // 使用共享信息
            message: 'chore(user-service): auto sync from upstream [skip ci]',
            push: true,
            branch: 'feature/new-endpoint'
          }
        ]
      },
      
      // 日志配置
      // 路径相对于工作区根目录
      logger: {
        level: 'info',
        writeToFile: true,
        logDir: '.sync-log'  // 相对于工作区根目录
      }
    })
  ]
});
```

## 工作区根目录检测

插件会自动检测工作区的根目录，具体检测规则如下：

1. 查找 `turbo.json` 文件的存在（Turborepo）
2. 检查 `package.json` 中的 `workspaces` 配置（Yarn/NPM Workspaces）
3. 查找 `pnpm-workspace.yaml` 文件的存在（PNPM Workspaces）

如果找到以上任一标志，则使用该目录作为工作区根目录；如果未找到，则使用Vite项目的根目录。

**注意**:
- 所有配置中的相对路径都相对于工作区根目录，而非Vite项目的根目录。这使得多个子项目可以共享相同的配置。
- Git项目都存放在工作区根目录下的`.sync-git`目录中，配置中的`targetDir`是相对于`.sync-git`目录的路径。
- 自动提交中的`targetDir`也是相对于`.sync-git`目录的路径。

## 配置选项

### 主配置

| 选项 | 类型 | 默认值 | 描述 | 执行顺序 |
|------|------|--------|------|---------|
| `gitProjects` | `Array<GitProjectConfig>` | - | Git项目管理配置数组 | 1 |
| `localSync` | `Array<LocalSyncConfig>` | - | 本地文件同步配置数组 | 2 |
| `autoCommit` | `AutoCommitConfig` | - | 独立的自动提交模块配置 | 3 |
| `logger` | `LoggerConfig` | - | 日志配置 | 全局 |

### LocalSyncConfig

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `source` | `string` | - | 源目录/文件（相对于工作区根目录） |
| `target` | `string \| string[]` | - | 目标目录/文件（相对于工作区根目录），可以是单个路径或多个路径数组以实现文件分发 |
| `mode` | `'copy' \| 'mirror' \| 'incremental'` | `'incremental'` | 同步模式 |
| `clearTarget` | `boolean` | `false` | 是否同步前清空目标目录 |
| `addOnly` | `boolean` | `false` | 是否仅添加新文件 |
| `exclude` | `string[]` | - | 排除文件/目录的正则表达式数组 |
| `excludeDirs` | `string[]` | - | 排除目录的glob模式数组 |
| `excludeFiles` | `string[]` | - | 排除文件的glob模式数组 |

### GitProjectConfig

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `repo` | `string` | - | 仓库地址（SSH或HTTPS） |
| `branch` | `string` | - | 目标分支 |
| `targetDir` | `string` | - | 存放目录（相对于.sync-git目录） |
| `projectName` | `string` | - | 项目名称（用于日志） |
| `updateIfExists` | `boolean` | `true` | 存在时是否更新 |
| `discardChanges` | `boolean` | `false` | 是否自动丢弃未提交的更改，设为true时会执行git checkout -- . 和 git clean -fd |

### AutoCommitConfig

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `projects` | `Array<AutoCommitProjectConfig>` | - | 自动提交项目配置数组 |
| `enableSharedCommits` | `boolean` | `true` | 是否启用共享提交信息功能 |
| `insertSeparator` | `boolean` | `true` | 是否在提交后插入分隔符 |

### AutoCommitProjectConfig

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `targetDir` | `string` | - | 项目目录（相对于.sync-git目录） |
| `projectName` | `string` | `targetDir` | 项目名称（用于日志） |
| `watchAuthor` | `string` | - | 监听的开发者用户名（非共享模式必须） |
| `maxScanCount` | `number` | `50` | 最大扫描提交记录数 |
| `commitSeparator` | `string` | `'/** 提交分隔符 **/'` | 提交分隔符 |
| `message` | `string` | - | 自动提交消息模板 |
| `push` | `boolean` | `false` | 是否推送到远程 |
| `useSharedCommits` | `boolean` | `false` | 是否使用共享提交信息 |
| `branch` | `string` | 当前分支 | 要操作的分支 |

### LoggerConfig

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `level` | `'error' \| 'warn' \| 'info' \| 'verbose'` | `'info'` | 日志级别 |
| `writeToFile` | `boolean` | `true` | 是否写入日志文件 |
| `logDir` | `string` | `'.sync-log'` | 日志目录（相对于工作区根目录） |

## 工作原理

### 插件执行流程

插件在Vite构建完成后执行所有任务：

1. **初始化阶段**（`configResolved`钩子）：
   - 检测Turborepo工作区根目录
   - 所有路径计算基于工作区根目录
   - 加载并验证配置

2. **构建完成阶段**（`closeBundle`钩子）：
   - 按固定顺序依次执行：
     - Git项目管理：克隆或更新指定的仓库
     - 本地文件同步：处理编译生成的文件
     - 智能自动提交：将更改提交到Git仓库

### 本地文件同步

- **复制模式**：简单复制源到目标，不处理目标中已存在的文件
- **镜像模式**：镜像同步，删除目标中不存在于源的文件
- **增量模式**：仅覆盖已变更文件

### Git项目管理

1. 检查项目是否存在：
   - 存在则执行`git pull`更新
   - 不存在则执行`git clone`
2. 切换到指定分支
3. 不再包含自动提交功能，仅负责仓库维护

### 独立的自动提交机制

1. 作为单独模块运行，在Git项目管理和文件同步后执行
2. 自动提交流程：
   - 扫描指定作者的提交记录
   - 识别提交分隔符，获取有效提交
   - 生成合并提交信息
   - 推送到远程仓库（如果配置）
   - 插入新的提交分隔符

3. 共享提交信息机制：
   - 第一个成功获取提交信息的项目，其结果将被缓存
   - 后续项目可以使用此共享信息进行提交

## 许可证

MIT 