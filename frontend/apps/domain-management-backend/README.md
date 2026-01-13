# 域名管理系统 - 用户后台

基于 Vue 3 + TypeScript + Vite 构建的现代化域名管理系统用户后台，采用函数式编程范式和 MVC 架构模式，提供完整的域名注册、管理、订单处理和实名认证功能。

## 🚀 技术栈

### 核心框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由管理器
- **Pinia** - Vue 状态管理库

### UI 组件库
- **Naive UI** - 现代化 Vue 3 组件库
- **UnoCSS** - 原子化 CSS 引擎
- **Lucide Vue Next** - 美观的图标库
- **Vue Sonner** - 优雅的通知组件

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Stylelint** - CSS 代码检查
- **Vitest** - 单元测试框架
- **TypeScript** - 类型检查

### 自动化插件
- **unplugin-auto-import** - API 自动导入
- **unplugin-vue-components** - 组件自动导入
- **@vitejs/plugin-vue-jsx** - JSX 支持
- **vite-plugin-svg-icons** - SVG 图标管理

## 📁 项目结构

```
src/
├── api/                 # API 请求模块
│   ├── batch-register.ts
│   ├── domain.ts
│   ├── order.ts
│   ├── real-name.ts
│   ├── recharge.ts
│   └── user.ts
├── assets/              # 静态资源
│   ├── icons/           # SVG 图标文件
│   └── logo.svg
├── components/          # 公共组件
│   ├── common/          # 通用业务组件
│   └── layout/          # 布局组件
│       ├── controller.ts
│       ├── index.vue
│       ├── state.ts
│       └── types.ts
├── router/              # 路由配置
│   └── index.ts
├── stores/              # Pinia 状态管理
│   ├── app.ts           # 应用全局状态
│   ├── batch-register.ts
│   ├── domain.ts
│   ├── order.ts
│   ├── real-name.ts
│   ├── recharge.ts
│   └── user.ts
├── styles/              # 样式文件
│   └── index.css
├── types/               # TypeScript 类型定义
│   ├── batch-register.ts
│   ├── common.ts        # 通用类型
│   ├── domain.ts
│   ├── global.d.ts
│   ├── order.ts
│   ├── real-name.ts
│   ├── recharge.ts
│   └── user.ts
├── utils/               # 工具函数
│   ├── common.ts        # 通用工具
│   ├── date.ts          # 日期处理
│   ├── discrete-api.ts  # 全局 API 实例
│   ├── format.ts        # 格式化工具
│   ├── index.ts         # 工具函数入口
│   └── validation.ts    # 验证工具
├── views/               # 页面视图
│   ├── batch-register/  # 批量注册模块
│   ├── dashboard/       # 仪表板模块
│   ├── domain/          # 域名管理模块
│   ├── order/           # 订单管理模块
│   ├── real-name/       # 实名信息模板模块
│   ├── real-name-auth/  # 实名认证模块
│   └── recharge/        # 充值管理模块
├── App.vue              # 根组件
├── main.ts              # 应用入口
└── vite-env.d.ts        # Vite 类型声明
```

## 🏗️ 架构设计

### MVC 架构模式

每个视图模块严格遵循 MVC（Model-View-Controller）架构模式：

#### 1. 视图层 (View) - `index.vue`
- **职责**：仅负责 UI 渲染、样式呈现和数据绑定
- **特点**：
  - 使用 `<script setup lang="ts">` 语法
  - 通过 `defineProps` 接收数据
  - 通过 `defineEmits` 触发事件
  - 不包含业务逻辑和 API 请求
  - 样式使用 `scoped` 属性避免污染

#### 2. 数据模型层 (Model) - `state.ts`
- **职责**：存储响应式数据及纯数据操作方法
- **特点**：
  - 使用 `ref`/`reactive` 声明响应式状态
  - 提供明确的 TypeScript 类型声明
  - 包含纯数据处理方法（无副作用）
  - 使用 `computed` 创建派生状态

#### 3. 控制器层 (Controller) - `controller.ts`
- **职责**：业务逻辑核心，处理用户交互和状态更新
- **特点**：
  - 导入并使用 `state.ts` 中的状态
  - 处理用户交互事件
  - 调用 API 接口
  - 处理副作用（路由跳转、通知等）
  - 导出 Hook 供视图层使用

### 函数式编程范式

项目严格遵循函数式编程原则：

1. **纯函数**：工具函数保持纯函数特性，相同输入产生相同输出
2. **不可变性**：避免直接修改响应式对象，使用新对象替换
3. **函数组合**：通过组合多个小函数构建复杂功能
4. **避免共享状态**：使用 Pinia 进行有纪律的状态管理
5. **声明式编程**：描述"做什么"而不是"如何做"

### 自动化工具配置

#### API 自动导入
```typescript
// 自动导入 Vue、Vue Router、Pinia 等 API
// 无需手动 import ref, reactive, computed 等
const count = ref(0)
const router = useRouter()
const store = useStore()
```

#### 组件自动导入
```typescript
// 自动导入 Naive UI 组件和自定义组件
// 无需手动 import NButton, NCard 等
<template>
  <NButton>按钮</NButton>
  <PageHeader title="标题" />
</template>
```

## 🎨 样式系统

### UnoCSS 配置

- **预设**：`presetUno`、`presetAttributify`、`presetIcons`
- **主题色彩**：完整的语义化色彩系统（primary、success、warning、error、info）
- **快捷类**：预定义按钮、输入框、卡片等组件样式
- **响应式**：支持移动端、平板、桌面的响应式设计
- **图标系统**：集成 Carbon 图标集

### 样式规范

```css
/* 快捷类示例 */
.btn-primary    /* 主要按钮样式 */
.btn-secondary  /* 次要按钮样式 */
.card          /* 卡片样式 */
.input-base    /* 输入框基础样式 */
```

## 🔧 开发规范

### 命名规范

- **文件/文件夹**：kebab-case（`user-profile.vue`）
- **变量/函数**：camelCase（`getUserInfo`）
- **类型/接口**：PascalCase（`UserInfo`，接口以 `I` 开头）
- **常量**：UPPER_SNAKE_CASE（`API_BASE_URL`）
- **枚举**：PascalCase（`UserStatus`）

### TypeScript 规范

- 所有函数参数、返回值、变量提供类型声明
- 使用 `import type` 导入类型
- 合理使用泛型和类型守卫
- 禁止使用 `any` 类型

### 注释规范

```typescript
/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息对象
 */
const getUserInfo = async (userId: string): Promise<UserInfo> => {
  // 实现逻辑
}
```

## 🚦 开发流程

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 在项目根目录安装所有依赖
pnpm install
```

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 类型检查
pnpm check

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 样式检查
pnpm stylelint

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

### 代码质量检查

每次提交前必须通过以下检查：

1. **TypeScript 检查**：`pnpm check`
2. **ESLint 检查**：`pnpm lint`
3. **样式检查**：`pnpm stylelint`
4. **格式化检查**：`pnpm format:check`

## 📋 功能模块

### 1. 仪表板 (Dashboard)
- 数据总览卡片
- 域名状态概览
- 最近订单列表
- 系统通知
- 快捷操作入口

### 2. 域名管理 (Domain)
- 域名列表查看
- 域名详情管理
- 批量域名注册
- 域名状态监控

### 3. 订单管理 (Order)
- 订单列表查看
- 订单状态跟踪
- 订单详情查看

### 4. 充值管理 (Recharge)
- 账户余额查看
- 充值记录管理
- 多种支付方式

### 5. 实名认证 (Real Name)
- 实名信息模板管理
- 实名认证申请
- 认证状态查看

## 🔌 API 集成

### Mock 数据开发

项目支持 Mock 数据开发模式，通过环境变量 `VITE_USE_MOCK` 控制：

```typescript
// 环境变量配置
VITE_USE_MOCK=true  // 启用 Mock 模式
VITE_USE_MOCK=false // 使用真实 API
```

### API 层设计

```typescript
// API 函数示例
export const fetchDomainList = async (params: DomainListParams): Promise<ApiResponse<PaginationResponse<Domain>>> => {
  return request.get('/domains', { params })
}
```

## 🔒 类型安全

项目提供完整的 TypeScript 类型定义：

- **通用类型**：`src/types/common.ts`
- **业务类型**：按模块分离的类型定义
- **API 类型**：请求参数和响应数据类型
- **组件类型**：Props 和 Emits 类型定义

## 📱 响应式设计

支持多设备适配：

- **桌面端**：>= 1024px
- **平板端**：768px - 1023px
- **移动端**：< 768px

## 🎯 性能优化

- **路由懒加载**：大型页面使用动态导入
- **组件按需加载**：自动导入减少打包体积
- **图片优化**：SVG 图标系统
- **代码分割**：Vite 自动代码分割
- **缓存策略**：Pinia 状态持久化

## 🧪 测试策略

- **单元测试**：使用 Vitest 进行组件和工具函数测试
- **类型检查**：TypeScript 编译时类型检查
- **代码质量**：ESLint + Prettier 保证代码质量

## 📚 相关文档

- [Vue 3 官方文档](https://vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Naive UI 组件库](https://www.naiveui.com/)
- [UnoCSS 文档](https://unocss.dev/)
- [Pinia 状态管理](https://pinia.vuejs.org/)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
