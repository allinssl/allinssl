# All in SSL - SSL 证书全流程管理工具 🔒

[![GitHub License](https://img.shields.io/github/license/allinssl/allinssl)](https://github.com/allinssl/allinssl?tab=readme-ov-file#AGPL-3.0-1-ov-file)
![GitHub Stars](https://img.shields.io/github/stars/allinssl/allinssl?style=social)
[![GitHub Issues](https://img.shields.io/github/issues/allinssl/allinssl)](https://github.com/allinssl/allinssl/issues)
[![GitHub Release](https://img.shields.io/github/v/release/allinssl/allinssl)](https://github.com/allinssl/allinssl/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/allinssl/allinssl)](https://hub.docker.com/r/allinssl/allinssl)


> 🚀 一站式 SSL 证书生命周期管理解决方案 | 支持 Let's Encrypt、ZeroSSL、Google、SSL.COM、BuyPass 等多家 CA | 多平台部署 | 自动化运维

<p align="center">
  <img src=".github/img/main.gif" alt="控制台预览" width="600">
</p>

## 📌 项目亮点
- ✅ 全自动证书申请/续期
- 🌐 多平台部署（CDN/WAF/面板/云存储）
- 🔔 证书过期监控
- 🛡️ 安全入口保护
- 📊 可视化证书管理

## 🚧 开发路线图

我们正在积极完善以下功能，欢迎通过 [GitHub Issues](https://github.com/allinssl/allinssl/issues) 提出建议！

[![GitHub Milestone](https://img.shields.io/github/milestones/progress/allinssl/allinssl/1)](https://github.com/allinssl/allinssl/milestone/1)


## 🚀 快速开始

### 系统要求
- Linux 系统
- macOS/Windows（请参照下面教程，暂不支持脚本安装）
- Docker

### 极速安装
```bash
curl -sSO http://allinssl.bt.cn/install_allinssl.sh && bash install_allinssl.sh allinssl
```

### 极速安装（备用）
```bash
curl -sSO http://download.allinssl.com/install_allinssl.sh && bash install_allinssl.sh allinssl
```

### Docker 安装
```bash
docker run -itd \
  --name allinssl \
  -p 8888:8888 \
  -v /www/allinssl/data:/www/allinssl/data \
  -e ALLINSSL_USER=allinssl \
  -e ALLINSSL_PWD=allinssldocker \
  -e ALLINSSL_URL=allinssl \
  -e TZ=Asia/Shanghai \
  allinssl/allinssl:latest
```

### 二进制文件安装
1. 打开 [releases 下载页面](https://github.com/allinssl/allinssl/releases)
2. 下载最新版本的二进制文件
3. 解压缩文件，并通过终端或者 CMD 进入解压目录
4. 获取登陆地址，账号和密码
   - 账号和登陆地址：
    - Linux: `./allinssl 15`
    - Windows: `.\allinssl 15`
  - 密码：
    - Linux: `./allinssl 6`
    - Windows: `.\allinssl 6`
5. 运行可执行文件启动服务，请保持终端打开，或者自行配置进程守护
   - Linux: 执行 `./allinssl start`
   - Windows: 终端进入到解压目录，执行 `.\allinssl start`
6. 访问 `http://your-server-ip:port/安全入口`，使用账号和密码登录
7. 更多命令行操作请参考 [命令行操作](#💻-命令行操作)

### 源码编译安装

#### 方法一：使用构建脚本（推荐）

**Linux/macOS:**
```bash
git clone https://github.com/allinssl/allinssl.git
cd allinssl
chmod +x build.sh
./build.sh
```

**Windows:**
```batch
git clone https://github.com/allinssl/allinssl.git
cd allinssl
build.bat
```

#### 方法二：手动编译

**前置要求:**
- Go 1.23+
- Node.js 18+
- pnpm 8+

```bash
# 1. 克隆项目
git clone https://github.com/allinssl/allinssl.git
cd allinssl

# 2. 编译前端
cd frontend
pnpm install
pnpm run build
cd ..

# 3. 编译后端
go mod tidy
go build -o allinssl cmd/main.go

# 4. 运行
./allinssl start
```

#### 方法三：Docker 编译

```bash
docker build -t allinssl:latest .
```

### 开发模式运行

#### 前端开发模式
```bash
cd frontend
pnpm run dev
# 访问 http://localhost:5173
# 需要配置代理指向后端端口
```

#### 后端开发模式
```bash
go run cmd/main.go start
# 访问 http://localhost:8888
```

### 首次配置
1. 访问 `http://your-server-ip:port/安全入口`
2. 添加 DNS 提供商和主机提供商凭证 ☁️
3. 创建工作流

[完整安装文档](https://allinssl.com/guide/getting-started.html)

## 🎯 核心功能

### 📜 证书管理
![证书管理流程](https://allinssl.com/images/workflow-edit.png)

| 功能         | 支持提供商                          |
|--------------|-----------------------------------|
| DNS 验证      | 阿里云、腾讯云、Cloudflare...      |
| 证书部署     | 宝塔面板、1Panel、阿里云 CDN、腾讯云 COS |
| 监控通知     | 邮件、Webhook、钉钉                |

### ⚙️ 自动化流程
```mermaid
graph LR
A[证书申请] --> B{有效期监控}
B -->|剩余 30 天 | C[自动续期]
C --> D[部署到目标平台]
D --> E[通知结果]
```

## 🛠️ 技术架构

### 🏗️ 系统架构图
```mermaid
graph TB
    subgraph "前端层"
        A[Vue 3 + Naive UI]
        A --> B[Vite 构建系统]
        A --> C[Turbo Monorepo]
    end

    subgraph "后端层"
        D[Gin Web 框架]
        D --> E[RESTful API]
        D --> F[Session 管理]
        D --> G[中间件层]
    end

    subgraph "核心服务层"
        H[证书申请服务]
        I[证书部署服务]
        J[工作流引擎]
        K[监控调度服务]
        L[通知服务]
    end

    subgraph "数据存储层"
        M[(SQLite 数据库)]
        N[文件存储]
    end

    subgraph "外部集成"
        O[ACME 协议]
        P[云服务商 API]
        Q[DNS 提供商]
        R[CDN/面板 API]
    end

    A -.-> D
    D --> J
    J --> H
    J --> I
    J --> K
    J --> L
    H --> M
    I --> M
    K --> M
    L --> M
    H --> O
    I --> P
    H --> Q
    I --> R
```



## 📚 使用文档
- [快速入门指南](https://allinssl.com/guide/getting-started.html)
- [操作手册](https://allinssl.com/features/dashboard.html)

## 💻 命令行操作
```bash
# 基本操作
allinssl 1: 启动服务 🚀
allinssl 2: 停止服务 ⛔
allinssl 3: 重启服务 🔄
allinssl 4: 修改安全入口 🔐
allinssl 5: 修改用户名 👤
allinssl 6: 修改密码 🔑
allinssl 7: 修改端口 🔧

# Web 服务管理
allinssl 8: 关闭 web 服务 🌐➖
allinssl 9: 开启 web 服务 🌐➕
allinssl 10: 重启 web 服务 🌐🔄

# 后台任务管理
allinssl 11: 关闭后台自动调度 📻⛔
allinssl 12: 开启后台自动调度 📻✅
allinssl 13: 重启后台自动调度 📻🔄

# 系统管理
allinssl 14: 关闭 https 🔓
allinssl 15: 获取面板地址 📋
allinssl 16: 更新 ALLinSSL 到最新版本（文件覆盖安装） 🔄⬆️
allinssl 17: 卸载 ALLinSSL 🗑️
```

## 🤝 参与贡献
欢迎通过以下方式参与项目：
1. 提交 Issue 报告问题
2. 发起 Pull Request 改进代码 💻
3. 完善项目文档 📖
4. 分享使用案例 ✨

[贡献指南](https://allinssl.com/community/contributing.html)

## 📞 联系我们
- QQ 交流群：[768610151](https://qm.qq.com/q/KTmWuskjm0) 👥
- 邮箱：support@allinssl.com 📧
- 问题反馈：[GitHub Issues](https://github.com/allinssl/allinssl/issues)

## 🙏 致谢

**感谢在 SSL 证书管理领域做出贡献的开源项目和社区：**
- [Let's Encrypt](https://letsencrypt.org/) - 免费 SSL 证书颁发机构
- [lego](https://github.com/go-acme/lego) - Go 语言 ACME 客户端，为本项目提供核心证书申请功能
- [acme.sh](https://github.com/acmesh-official/acme.sh) - 纯 Shell 脚本实现的 ACME 客户端
- [certimate](https://github.com/usual2970/certimate) - 工作流部分设计参考，以及使用了其京东云 DNS 的代码实现
- [certd](https://github.com/certd/certd) - 工作流部分的设计参考
- [Certbot](https://certbot.eff.org/) - EFF 官方 ACME 客户端
- [Caddy](https://caddyserver.com/) - 自动 HTTPS Web 服务器

**感谢以下技术栈和依赖库：**

**🔧 后端依赖**
- **Web 框架**: [gin-gonic/gin](https://github.com/gin-gonic/gin) - HTTP Web 框架
- **数据库**: [modernc.org/sqlite](https://github.com/modernc/sqlite) - SQLite 数据库
- **ACME 客户端**: [go-acme/lego](https://github.com/go-acme/lego) - 证书申请核心
- **会话管理**: [gin-contrib/sessions](https://github.com/gin-contrib/sessions) - 用户会话
- **HTTP 客户端**: [go-resty/resty](https://github.com/go-resty/resty) - API 调用
- **邮件服务**: [jordan-wright/email](https://github.com/jordan-wright/email) - 邮件发送
- **验证码**: [mojocn/base64Captcha](https://github.com/mojocn/base64Captcha) - 图形验证码
- **UUID**: [google/uuid](https://github.com/google/uuid) - 唯一标识符
- **环境变量**: [joho/godotenv](https://github.com/joho/godotenv) - 配置管理

**🎨 前端依赖**
- **框架**: [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- **UI 组件**: [Naive UI](https://naiveui.com/) - Vue 3 组件库
- **构建工具**: [Vite](https://vitejs.dev/) - 极速构建工具
- **包管理**: [Turbo](https://turbo.build/) - Monorepo 构建系统
- **路由**: [Vue Router](https://router.vuejs.org/) - 单页应用路由
- **状态管理**: [Pinia](https://pinia.vuejs.org/) - 轻量级状态管理
- **工具库**: [VueUse](https://vueuse.org/) - Vue 组合式 API 工具
- **图表**: [ECharts](https://echarts.apache.org/) - 数据可视化
- **工作流**: [Vue Flow](https://vueflow.dev/) - 可视化流程编辑器
- **HTTP**: [Axios](https://axios-http.com/) - HTTP 客户端
- **样式**: [TailwindCSS](https://tailwindcss.com/) - CSS 框架

**☁️ 云服务集成**
- **阿里云**: [alibabacloud-go](https://github.com/alibabacloud-go) SDK 系列
- **腾讯云**: [tencentcloud-sdk-go](https://github.com/tencentcloud/tencentcloud-sdk-go)
- **华为云**: [huaweicloud-sdk-go-v3](https://github.com/huaweicloud/huaweicloud-sdk-go-v3)
- **百度云**: [bce-sdk-go](https://github.com/baidubce/bce-sdk-go)
- **火山引擎**: [volcengine-go-sdk](https://github.com/volcengine/volcengine-go-sdk)
- **京东云**: [jdcloud-sdk-go](https://github.com/jdcloud-api/jdcloud-sdk-go)
- **七牛云**: [qiniu/go-sdk](https://github.com/qiniu/go-sdk)
- **Azure**: [azure-sdk-for-go](https://github.com/Azure/azure-sdk-for-go)
- **AWS**: [aws-sdk-go-v2](https://github.com/aws/aws-sdk-go-v2)
- **Cloudflare**: [cloudflare-go](https://github.com/cloudflare/cloudflare-go)

**证书颁发机构：**
- [Let's Encrypt](https://letsencrypt.org/) - 免费 SSL 证书
- [ZeroSSL](https://zerossl.com/) - 免费 SSL 证书
- [Google Trust Services](https://pki.goog/) - Google 证书服务
- [SSL.com](https://www.ssl.com/) - 商业 SSL 证书
- [BuyPass](https://www.buypass.com/) - 挪威免费 SSL 证书
- [TrustAsia](https://www.trustasia.com/) - 亚洲诚信
- [Racent](https://www.racent.com/) - 锐成信息

**特别感谢：**
- 所有 DNS 服务商和 CDN 提供商对 API 的开放支持

**感谢以下用户对本项目的支持和贡献：**
- [@寒雨馨](https://www.hanyuxin.cn/)


## 📜 许可证
本项目采用 [AGPL-3.0 license](./LICENSE) 开源协议

## 🌟Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=allinssl/allinssl&type=Date)](https://www.star-history.com/#allinssl/allinssl&Date)

---

> 🌟 **Star 本项目以支持开发** | 推荐用于：中小型网站运维、多证书管理场景、自动化 HTTPS 部署
