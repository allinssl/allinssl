# AllinSSL

AllinSSL 是一个基于 Vue 3 和 TypeScript 开发的 SSL 证书管理平台，旨在简化 SSL 证书的申请、部署、监控和管理流程。

## 功能特性

- **证书管理**：集中管理所有 SSL 证书，包括证书信息查看、状态监控和到期提醒
- **证书申请**：简化 SSL 证书申请流程，支持多种类型证书的快速申请
- **自动部署**：支持证书的自动化部署到不同的服务器和环境
- **监控系统**：实时监控证书状态，提供证书健康度和到期预警
- **API 管理**：提供 API 接口管理功能，支持与其他系统集成
- **多语言支持**：内置国际化支持，可扩展多种语言

## 技术栈

- **前端框架**：Vue 3 + TypeScript + TSX
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **UI 组件库**：Naive UI
- **工具库**：VueUse
- **CSS 框架**：Tailwind CSS
- **构建工具**：Vite
- **包管理**：Turborepo (Monorepo 结构)

## 开发环境设置

### 前提条件

- Node.js (v16+)
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发服务器启动

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

应用将在本地 `http://localhost:5173` 启动。

## 构建部署

### 构建生产版本

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

构建后的文件将生成在 `dist` 目录中。

### 预览构建结果

```bash
npm run preview
# 或
yarn preview
# 或
pnpm preview
```

## 项目结构

```
src/
├── api/               # API 接口定义
├── assets/            # 静态资源
├── components/        # 公共组件
├── config/            # 全局配置
├── lib/               # 工具库和功能函数
├── locales/           # 国际化语言文件
├── router/            # 路由配置
├── styles/            # 全局样式文件
├── types/             # TypeScript 类型定义
├── views/             # 页面视图组件
│   ├── certApply/     # 证书申请
│   ├── certManage/    # 证书管理
│   ├── autoDeploy/    # 自动部署
│   ├── monitor/       # 监控系统
│   ├── settings/      # 系统设置
│   ├── layout/        # 布局组件
│   ├── login/         # 登录页面
│   └── home/          # 首页
├── App.tsx            # 根组件
└── main.ts            # 应用入口
```

## 代码规范

项目采用 ESLint 和 Prettier 进行代码规范控制，确保代码风格统一。

```bash
# 运行代码检查
npm run lint
# 或
yarn lint
# 或
pnpm lint
```

## 项目特点

- 采用 Vue 3 Composition API 和 TSX 语法
- MVC 分离模式：将状态 (useStore.tsx)、控制器 (useController.tsx) 和视图 (index.tsx) 区分开来
- 使用 Tailwind CSS 实现响应式设计
- 基于 Vite 的高性能构建系统
- Monorepo 结构，便于多包协同开发

## 贡献指南

欢迎贡献代码，请确保遵循以下准则：

1. 遵循项目已有的代码风格和命名规范
2. 提交前进行代码检查和测试
3. 提交消息遵循规范化提交格式
