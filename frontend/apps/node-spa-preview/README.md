# SPA Preview Server

基于 Express 的单页应用（SPA）预览服务器，支持环境变量配置、API 反向代理和增强的路由处理。

## 功能特性

- 🔧 **环境变量配置** - 通过 `.env` 文件管理所有配置
- 📁 **静态文件服务** - 可配置的静态文件目录
- 🔄 **API 反向代理** - 支持 API 请求代理到后端服务
- 🛣️ **SPA 路由支持** - 智能的客户端路由回退机制
- 🌐 **CORS 支持** - 可配置的跨域资源共享
- 📝 **增强日志** - 多级别日志记录和彩色输出
- ⚡ **缓存优化** - 生产环境静态资源缓存

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

#### 方法一：使用配置向导（推荐）

```bash
# 运行交互式配置向导
pnpm config

# 或者
node src/utils/cli-config.js
```

#### 方法二：手动配置

复制 `.env.example` 文件为 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

### 3. 启动服务器

```bash
# 开发模式
pnpm dev

# 或直接运行
node src/server.js
```

## 环境变量配置

### 服务器配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `5173` | 服务器端口 |
| `HOST` | `0.0.0.0` | 服务器主机地址 |

### 静态文件配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PUBLIC_DIR` | `public` | 静态文件目录 |
| `FALLBACK_FILE` | `index.html` | SPA 回退文件 |

### API 代理配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `API_TARGET` | `` | API 代理目标地址（如：`http://localhost:3000`） |
| `API_PREFIX` | `/api` | API 路由前缀 |
| `API_PROXY_MODE` | `prefix` | API 代理模式：<br>`prefix` - 路径替换模式，移除前缀后转发<br>`include` - 路径包含模式，保留完整路径转发 |

### 开发配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DEV_MODE` | `true` | 开发模式开关 |
| `LOG_LEVEL` | `info` | 日志级别（`debug`, `info`, `warn`, `error`） |

### CORS 配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `CORS_ENABLED` | `true` | 启用 CORS |
| `CORS_ORIGIN` | `*` | 允许的源（多个用逗号分隔） |

### SPA 路由配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `SPA_FALLBACK_ENABLED` | `true` | 启用 SPA 路由回退 |
| `SPA_EXCLUDE_EXTENSIONS` | `.js,.css,.png,...` | 排除的文件扩展名 |

## 配置工具

### 交互式配置向导

项目提供了一个交互式配置向导，帮助您轻松管理环境变量：

```bash
# 启动配置向导
pnpm config
```

配置向导功能：
- 🔍 **自动检测现有配置** - 读取并显示当前 `.env` 文件
- ✅ **配置验证** - 实时验证配置值的有效性
- 📋 **配置摘要** - 清晰显示所有配置项
- 💾 **自动保存** - 生成 `.env` 和 `.env.example` 文件
- 🎨 **彩色输出** - 友好的命令行界面

### 配置验证

配置工具会自动验证以下项目：
- 端口号范围（1-65535）
- 主机地址格式
- API 目标 URL 格式
- 日志级别有效性
- CORS 源地址格式

## 使用示例

### 基本 SPA 部署

1. 将构建好的 SPA 文件放入 `public` 目录
2. 启动服务器
3. 访问 `http://localhost:5173`

### 配置 API 代理

在 `.env` 文件中配置：

```env
API_TARGET=http://localhost:3000
API_PREFIX=/api
```

这样，所有 `/api/*` 的请求都会被代理到 `http://localhost:3000/*`。

### 自定义 CORS

```env
CORS_ORIGIN=http://localhost:3000,https://example.com
```

### 调试模式

```env
LOG_LEVEL=debug
DEV_MODE=true
```

## SPA 路由处理

服务器会智能处理 SPA 路由：

1. **静态文件请求** - 直接提供文件服务
2. **API 请求** - 代理到配置的后端服务
3. **SPA 路由** - 返回 `index.html` 让客户端路由处理

### 路由排除规则

以下类型的请求不会触发 SPA 回退：

- 带有文件扩展名的请求（如 `.js`, `.css`, `.png` 等）
- API 路由请求（以 `API_PREFIX` 开头）

### 自定义排除扩展名

```env
SPA_EXCLUDE_EXTENSIONS=.js,.css,.png,.jpg,.svg,.ico,.woff,.woff2
```

## 生产环境部署

### 环境变量配置

```env
DEV_MODE=false
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com
```

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/server.js --name spa-preview

# 查看状态
pm2 status

# 查看日志
pm2 logs spa-preview
```

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5173

CMD ["node", "src/server.js"]
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :5173
   
   # 修改端口
   echo "PORT=5174" >> .env
   ```

2. **API 代理不工作**
   - 检查 `API_TARGET` 是否正确配置
   - 确认后端服务正在运行
   - 查看调试日志：`LOG_LEVEL=debug`

3. **SPA 路由 404**
   - 确认 `SPA_FALLBACK_ENABLED=true`
   - 检查 `public/index.html` 是否存在
   - 查看排除扩展名配置

### 调试技巧

启用详细日志：

```env
LOG_LEVEL=debug
```

这将显示：
- 代理请求详情
- SPA 回退处理
- 文件服务信息

## 开发

### 项目结构

```
apps/spa-preview/
├── .env                 # 环境变量配置
├── .env.example         # 配置模板
├── .gitignore          # Git 忽略文件
├── package.json        # 项目配置
├── README.md           # 项目文档
├── public/             # 静态文件目录
│   └── .gitkeep
└── src/
    ├── server.js       # 主服务器文件
    └── utils/          # 工具函数
```

### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License