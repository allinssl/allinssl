# Vite插件开发需求文档：Turborepo工作区编译部署自动化工具

## 一、项目概述
**项目名称**：vite-plugin-turborepo-deploy  
**目标**：开发一个Vite插件，实现Turborepo工作区编译后的自动化部署流程，涵盖本地文件同步、Git项目管理（包含可选的智能化自动提交功能，并支持提交信息在项目间共享）。

## 二、功能需求
### 1. 本地文件同步功能
- **配置方式**：支持在插件配置中定义多个本地文件/目录同步任务
- **同步模式**：
  - `copy`：简单复制，不处理目标目录已存在文件
  - `mirror`：镜像同步，删除目标目录中不存在于源的文件
  - `incremental`：增量更新，仅覆盖已变更文件
- **清空目标目录**：支持通过`clearTarget`字段在同步前清空目标目录
- **全新添加模式**：支持`addOnly`字段，仅新增源中存在而目标中不存在的文件/目录
- **过滤规则**：
  - `exclude`：支持通过正则表达式排除特定文件/目录
  - `excludeDirs`：指定排除的目录（支持glob或正则）
  - `excludeFiles`：指定排除的文件（支持glob或正则）
- **路径解析**：所有相对路径自动基于项目根目录解析

### 2. Git项目管理与自动提交功能
- **多项目支持**：可配置多个Git项目的拉取/更新任务。
- **分支管理**：支持指定拉取分支，自动切换到目标分支。
- **目录管理**：
  - 支持自定义项目存放目录。
  - 支持重命名项目目录（通过`projectName`字段）。
- **自动操作**：
  - 检测项目是否存在：存在则执行`git pull`更新，不存在则执行`git clone`。
  - 拉取前自动切换到指定分支。
  - 支持私有仓库（通过SSH密钥或HTTPS认证）。
- **可选的自动提交 (Per-Project Auto Commit)**：
  - **启用方式**：在每个Git项目配置中，通过`autoCommit`对象启用和配置。
  - **智能提交检测机制**（用于填充共享缓冲区或单个项目扫描）：
    - **开发者监听**：通过配置指定需要监听的开发者用户名（对应Git配置中的`user.name`）。
    - **提交记录扫描**：
      - 默认扫描最近50条提交记录（可通过配置调整）。
      - 按时间倒序扫描，优先获取最新提交。
    - **提交分隔符**：使用特殊标记（默认`/** 提交分隔符 **/`）识别分段点。
    - **双模式处理**：
      - **模式1**：存在分隔符时，获取分隔符之后的所有提交。
      - **模式2**：不存在分隔符时，获取最近一条指定开发者的提交。
  - **共享提交信息机制 (Shared Commit Buffer)**:
    - **目的**：当多个Git项目基于同一组源变更（如主仓库的特定开发者提交）进行自动提交时，允许一次获取提交信息并复用。
    - **信息来源**：在`gitProjects`任务执行期间，第一个成功通过"智能提交检测机制"获取到提交信息的项目，其结果将被缓存为"共享提交信息"。
    - **信息使用**：后续的Git项目若在其`autoCommit`配置中设置了`useSharedCommits: true`，则会尝试使用此共享信息。若共享信息为空，或项目未配置使用，则回退到独立扫描其自身仓库。
    - **生命周期**：共享提交信息在每次`updateGitProjects`任务开始时清空。
  - **提交信息生成**：
    - 若项目配置为使用共享提交信息且缓冲区存在内容，则直接使用。
    - 否则，使用从当前项目独立扫描获取的提交信息。
    - 合并多条提交时，采用特定格式：
      ```markdown
      [自动合并] 包含N次提交:

      1. [commitHash1] commitMessage1
      2. [commitHash2] commitMessage2
      ...

      /** 提交分隔符 **/
      ```
  - **提交后操作**：无论是否使用共享信息，自动提交成功后，都在当前Git项目的**当前分支**插入一条新的、空的提交分隔符记录。
  - **错误处理**（针对单个项目的自动提交过程）：
    - **无匹配提交**：若独立扫描未找到指定开发者的任何提交，在该项目中抛出警告但继续执行后续任务。
    - **重复分隔符**：若检测到连续两条分隔符提交，自动清理冗余记录。
    - **提交冲突**：在提交前检查工作区状态，存在未提交变更时抛出错误并跳过该项目的自动提交。
  - **推送**：支持配置是否在自动提交后推送到远程仓库的对应分支。

### 3. 任务编排系统
- **顺序执行**：支持按数组顺序依次执行配置的任务。
- **内置任务**：
  - `localSync`：执行本地文件同步。
  - `updateGitProjects`：更新所有Git项目（如果项目配置了自动提交，则在此阶段执行，包括处理共享提交信息逻辑）。
- **扩展机制**：支持自定义任务（通过插件钩子）。

### 4. 日志记录系统
- **日志文件**：
  - 自动在项目根目录下创建`.sync-log`目录。
  - 按日期生成日志文件（如`2023-05-15_deploy.log`）。
- **日志级别**：
  - `error`：仅记录错误信息。
  - `info`：记录关键步骤信息。
  - `verbose`：记录详细执行过程（默认）。
- **控制台输出**：
  - 彩色日志显示。
  - 关键步骤进度提示。

## 三、技术实现要求

### 1. 基础架构
- **开发语言**：TypeScript，所有源码必须为`.ts`或`.tsx`文件，禁止使用`any`类型。
- **Node.js 版本**：要求 Node.js 16 及以上，推荐 LTS 版本，需兼容 ESM。
- **Vite 版本**：兼容 Vite 3.x 及以上，插件需遵循 Vite 官方插件开发规范。
- **插件类型**：构建后插件（在`buildEnd`钩子触发），需支持异步任务。
- **依赖管理**：使用 pnpm/yarn/npm，推荐 pnpm，所有依赖需锁定版本。

### 2. 代码规范与最佳实践
- **类型安全**：全量使用 TypeScript 接口，避免类型推断不明确。
- **函数式编程**：优先使用函数式、声明式风格，避免类和全局变量。
- **模块化**：每个功能模块单独文件，导出命名函数，禁止默认导出。
- **注释规范**：所有导出函数、接口、类型需使用 JSDoc 注释，描述参数、返回值和用途。
- **错误处理**：所有异步操作需捕获异常，关键错误需中断流程并输出详细日志。
- **日志系统**：日志输出需支持彩色（chalk），并写入`.sync-log`目录下的日志文件，日志内容需结构化，便于后续分析。

### 3. 性能与兼容性
- **异步并发**：文件同步、Git 操作等 IO 密集型任务需支持并发，合理控制并发数，避免资源争用。
- **跨平台**：需兼容 Windows、Linux、macOS，路径处理需使用 Node.js path 模块。
- **配置热重载**：插件配置变更后，支持自动重载，无需重启 Vite 服务。
- **资源优化**：插件自身体积需控制在合理范围，避免引入过大依赖。

### 4. 插件接口与类型定义
- **类型导出**：所有配置接口需导出，便于用户类型推断和 IDE 智能提示。
- **配置校验**：插件初始化时需校验用户配置，发现错误需抛出详细异常。
- **Vite 插件约定**：导出标准 Vite 插件对象，支持链式调用和多插件组合。

### 5. 依赖与工具
- `fs-extra`：文件操作
- `simple-git`：Git 命令封装
- `chalk`：控制台彩色输出
- `ora`：进度指示器
- `zod` 或 `joi`：配置校验（推荐 zod）

### 6. 测试与质量保障
- **单元测试**：使用 Vitest 或 Jest，覆盖率需达 80% 以上。
- **集成测试**：模拟完整部署流程，验证各功能模块协作。
- **CI/CD**：集成 GitHub Actions，自动化测试、构建和发布。

## 四、交互与输出
### 1. 控制台输出示例
```
🚀 [Turborepo Deploy] 开始执行部署流程...

🔄 正在同步本地文件...
   ✅ 已同步 dist → ../deploy/public (mirror模式)
   ✅ 已同步 src/assets → ../deploy/assets (incremental模式)

🔄 正在更新Git项目...
   ⏳ 正在处理 api-gateway (分支: develop)...
      ✅ 已更新至最新版本 (commit: abc123)
      ✨ 开始执行 api-gateway 的自动提交 (作为共享信息源)...
         ✅ 已扫描最近50条提交记录, 找到提交分隔符（位于 commit: abc123）
         ✅ 识别到3条待同步提交, 已存入共享缓冲区。
            - [def456] 修复登录验证问题
            - [ghi789] 优化API响应格式
            - [jkl012] 添加用户头像上传功能
         ✅ 已合并提交 (commit: mno345) 并推送到远程 (develop)
         ✅ 已在 api-gateway (develop) 插入新的提交分隔符 (commit: pqr678)
   ⏳ 正在处理 user-service (分支: feature/new-endpoint)...
      ✅ 已更新至最新版本 (commit: stu789)
      ✨ 开始执行 user-service 的自动提交 (使用共享信息)...
         ✅ 使用了来自 api-gateway 的3条共享提交信息。
         ✅ 已合并提交 (commit: vwx123) 并推送到远程 (feature/new-endpoint)
         ✅ 已在 user-service (feature/new-endpoint) 插入新的提交分隔符 (commit: yz034)
   ⏳ 正在处理 another-service (分支: main)...
      ✅ 已更新至最新版本 (commit: bcd234)
      ✨ 开始执行 another-service 的自动提交 (独立扫描)...
         ✅ 未找到指定开发者或分隔符的提交，未执行自动提交。

✅ [Turborepo Deploy] 部署完成！
```

### 2. 日志文件格式
```
[2023-05-15T14:30:21.123Z] [INFO] 开始执行部署流程...
[2023-05-15T14:30:21.456Z] [INFO] 正在同步本地文件...
[2023-05-15T14:30:23.789Z] [INFO] 已同步 dist → ../deploy/public (mirror模式)
[2023-05-15T14:30:25.012Z] [INFO] 已同步 src/assets → ../deploy/assets (incremental模式)
[2023-05-15T14:30:25.345Z] [INFO] 正在更新Git项目...
[2023-05-15T14:30:25.678Z] [INFO] [api-gateway] 正在处理项目 (分支: develop)...
[2023-05-15T14:30:30.234Z] [INFO] [api-gateway] 已更新至最新版本 (commit: abc123)
[2023-05-15T14:30:30.500Z] [INFO] [api-gateway] 开始执行自动提交 (作为共享信息源)...
[2023-05-15T14:30:31.890Z] [INFO] [api-gateway] 已扫描最近50条提交记录, 找到提交分隔符（位于 commit: abc123）
[2023-05-15T14:30:32.123Z] [INFO] [api-gateway] 识别到3条待同步提交, 已存入共享缓冲区。
[2023-05-15T14:30:32.456Z] [INFO] [api-gateway]    - [def456] 修复登录验证问题
[2023-05-15T14:30:32.789Z] [INFO] [api-gateway]    - [ghi789] 优化API响应格式
[2023-05-15T14:30:33.012Z] [INFO] [api-gateway]    - [jkl012] 添加用户头像上传功能
[2023-05-15T14:30:35.678Z] [INFO] [api-gateway] 已合并提交 (commit: mno345) 并推送到远程 (develop)
[2023-05-15T14:30:36.901Z] [INFO] [api-gateway] 已插入新的提交分隔符 (commit: pqr678)
[2023-05-15T14:30:37.100Z] [INFO] [user-service] 正在处理项目 (分支: feature/new-endpoint)...
[2023-05-15T14:30:40.234Z] [INFO] [user-service] 已更新至最新版本 (commit: stu789)
[2023-05-15T14:30:40.500Z] [INFO] [user-service] 开始执行自动提交 (使用共享信息)...
[2023-05-15T14:30:40.501Z] [INFO] [user-service] 使用了来自 api-gateway 的3条共享提交信息。
[2023-05-15T14:30:43.678Z] [INFO] [user-service] 已合并提交 (commit: vwx123) 并推送到远程 (feature/new-endpoint)
[2023-05-15T14:30:44.901Z] [INFO] [user-service] 已插入新的提交分隔符 (commit: yz034)
[2023-05-15T14:30:45.000Z] [INFO] [another-service] 正在处理项目 (分支: main)...
[2023-05-15T14:30:50.000Z] [INFO] 部署完成！
```

## 五、使用示例
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import turborepoDeploy from 'vite-plugin-turborepo-deploy';

export default defineConfig({
  plugins: [
    turborepoDeploy({
      localSync: [
        { source: 'dist', target: '../deploy/public', mode: 'mirror', clearTarget: true },
        { source: 'src/assets', target: '../deploy/assets', excludeDirs: ['**/tmp'], excludeFiles: ['**/*.psd'] }
      ],
      gitProjects: [
        {
          repo: 'git@github.com:example-org/api-gateway.git',
          branch: 'develop',
          targetDir: 'services/api-gateway',
          projectName: 'api-gateway', // 用于日志中清晰标识源
          autoCommit: { // 此项目将作为共享提交信息的来源
            enabled: true,
            watchAuthor: '张三',
            maxScanCount: 100,
            commitSeparator: '/** AUTO MERGE MARK **/',
            message: 'chore(api-gateway): auto merge [skip ci]',
            push: true
            // useSharedCommits: false, // 或不设置，默认为false，它会尝试填充共享区
          }
        },
        {
          repo: 'git@github.com:example-org/user-service.git',
          branch: 'feature/new-endpoint',
          targetDir: 'services/user-service',
          projectName: 'user-service',
          autoCommit: { // 此项目将使用共享的提交信息
            enabled: true,
            useSharedCommits: true, // 明确指定使用共享信息
            // watchAuthor, maxScanCount, commitSeparator 在此模式下可不填，若填写了则在共享区为空时作为回退
            message: 'chore(user-service): auto sync from upstream [skip ci]',
            push: true
          }
        },
        {
          repo: 'git@github.com:example-org/another-service.git',
          branch: 'main',
          targetDir: 'services/another-service',
          projectName: 'another-service',
          autoCommit: { // 此项目独立进行提交检测
            enabled: true,
            watchAuthor: '李四', // 不同的开发者或标准
            message: 'chore(another-service): auto merge [skip ci]',
            push: false // 可能只提交不推送
          }
        }
      ],
      taskOrder: ['localSync', 'updateGitProjects']
    })
  ]
});
```

## 六、测试要求
### 1. 单元测试
- 验证文件同步逻辑（包括清空、仅新增、过滤规则）。
- 验证Git项目管理核心操作（克隆、拉取、分支切换）。
- 验证针对单个Git项目的自动提交智能检测逻辑（包括开发者监听、分隔符处理、提交信息生成、提交后操作）。
- **验证共享提交信息缓冲机制**：
    - 源项目成功获取并缓存提交信息。
    - 后续项目配置`useSharedCommits: true`时能正确使用缓存信息。
    - 当共享缓冲为空时，配置了`useSharedCommits: true`的项目能正确回退到独立扫描（或按配置跳过）。
    - 未配置`useSharedCommits: true`的项目不受共享缓冲影响。
- 验证任务编排顺序。

### 2. 集成测试
- 模拟完整部署流程，包含多个Git项目，组合使用独立提交、共享提交源、共享提交消费者等场景。
- 验证日志记录功能，清晰反映各项目的提交方式（独立、共享、来源）。
- 测试不同场景下单个Git项目的自动提交（有分隔符、无分隔符、无匹配提交、提交冲突、推送成功/失败），包括作为共享源和消费者的不同行为。

### 3. 边缘情况测试
- 文件冲突处理。
- Git项目不存在或认证失败。
- 网络异常处理。
- 单个Git项目中重复提交分隔符处理。
- **共享提交信息在任务开始时被正确清空**。

## 七、交付物
1. **源代码**：完整的TypeScript源码
2. **文档**：
   - 使用说明
   - 配置参数文档
   - 开发指南
3. **测试用例**：单元测试和集成测试代码
4. **示例项目**：演示插件功能的示例配置

### 3. 配置接口定义
```typescript
interface GitProjectAutoCommitConfig {
  enabled?: boolean;              // 是否启用，默认false
  watchAuthor?: string;           // 监听的开发者用户名 (当useSharedCommits为false或作为共享提交源时建议填写)
  maxScanCount?: number;          // 最大扫描提交记录数，默认50
  commitSeparator?: string;       // 提交分隔符，默认'/** 提交分隔符 **/'
  message?: string;               // 自动提交消息模板 (可选, 有默认值)
  push?: boolean;                 // 是否推送到远程，默认false
  useSharedCommits?: boolean;     // 可选，是否尝试使用共享的提交信息，默认false
}

interface GitProjectConfig {
  repo: string;             // 仓库地址（SSH或HTTPS）
  branch: string;           // 目标分支
  targetDir: string;        // 存放目录（相对项目根目录）
  projectName?: string;     // 可选：重命名项目目录
  updateIfExists?: boolean; // 存在时是否更新，默认true
  autoCommit?: GitProjectAutoCommitConfig; // 可选的自动提交配置
}

interface LocalSyncConfig {
  source: string;           // 源目录/文件（相对项目根目录）
  target: string;           // 目标目录/文件（相对项目根目录）
  mode?: 'copy' | 'mirror' | 'incremental'; // 同步模式，默认'incremental'
  clearTarget?: boolean;    // 是否同步前清空目标目录，默认false
  addOnly?: boolean;        // 是否仅新增（目标不存在的文件/目录），默认false
  exclude?: string[];       // 排除文件/目录的正则表达式数组
  excludeDirs?: string[];   // 排除目录（glob或正则表达式）
  excludeFiles?: string[];  // 排除文件（glob或正则表达式）
}

interface TurborepoDeployConfig {
  localSync?: Array<LocalSyncConfig>;
  gitProjects?: Array<GitProjectConfig>;
  taskOrder?: Array<'localSync' | 'updateGitProjects'>; // 任务执行顺序
}
```