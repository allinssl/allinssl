# 宝塔 Turborepo 项目

基于 Turborepo 构建的多项目工作空间，包含多个应用和共享包。

## 技术栈

- **构建工具**: Turborepo、Vite
- **前端框架**: Vue 3
- **语言**: TypeScript
- **样式**: Tailwind CSS、CSS Modules
- **UI 组件库**: Naive UI
- **状态管理**: Pinia
- **路由**: Vue Router
- **工具库**: VueUse、Axios
- **包管理器**: pnpm

## 项目结构

```
.
├── apps/                   # 应用目录
│   ├── allin-ssl/          # SSL 管理应用
│   ├── cloud-control/      # 云控制应用
│   ├── monorepo-docs/      # 项目文档应用
│   ├── naive-template/     # Naive UI 模板
│   └── vueFlow/            # Vue Flow 应用示例
├── packages/               # 共享包目录
│   ├── utils/              # 通用工具函数
│   ├── vue/                # Vue 相关组件和工具
│   ├── react/              # React 相关组件和工具
│   ├── svelte/             # Svelte 相关组件和工具
│   └── node/               # Node.js 相关工具
├── environment/            # 环境配置
├── plugin/                 # 自定义插件
├── scripts/                # 脚本工具
├── types/                  # 全局类型定义
└── ...
```

## 主要应用

### Cloud Control

云控制应用是本项目的主要应用之一，基于 Vue 3、TypeScript 和 Vite 构建。

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm 9.0.0+

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
	# 初次运行，请先执行pnpm build 编译当前的整个应用包的依赖库
	pnpm build
```

```bash
# 启动所有应用
pnpm dev

# 启动指定应用-例如allin-ssl
pnpm dev --filter allin-ssl


### 构建项目

```bash
# 构建所有应用
pnpm build

# 构建指定应用-例如allin-ssl
pnpm build --filter allin-ssl

```

### 其他命令

```bash
# 代码检查
pnpm lint

# 清理项目包
pnpm clear

```

## 开发规范

- 使用 TypeScript 编写所有代码
- 遵循函数式编程和声明式编程模式
- 使用 Vue 3 的 Composition API 和 `<script setup>` 语法
- 遵循 MVC 分离模式，区分状态 (useStore.tsx)、控制器 (useController.tsx) 和视图 (index.tsx)
- 使用 TSX 语法编写 Vue 组件，文件使用 .tsx 后缀
- 使用 JSDoc 注释函数、参数和返回值

## 贡献指南

欢迎提交 Pull Request 或提出 Issue。在贡献代码前，请确保遵循项目的代码风格和开发规范。
