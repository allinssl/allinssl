# ALLinSSL 前端编译文档

本文档说明 ALLinSSL 这个仓库里的前端是如何构建的，以及你在修改前端后应该如何重新编译，确保最终 `go build` 出来的程序能够正确带上新的控制面板页面。

## 一、先说结论

这个项目的前端不是单独发布的静态站点，而是会被 Go 二进制直接嵌入。

关键关系如下：

1. 前端源码目录在 `frontend/apps/allin-ssl`
2. Vite 构建产物默认输出到 `frontend/apps/allin-ssl/dist`
3. Go 程序真正嵌入的是根目录 `static/build`
4. 后端通过嵌入的 `static/build` 对外提供控制面板页面

也就是说：

只在 `frontend/apps/allin-ssl` 里执行构建还不够，最终还必须把新的构建结果同步到根目录 `static/build`，否则你 `go build` 出来的程序仍然可能带的是旧前端。

## 二、相关代码位置

前端构建命令定义在：

- `frontend/package.json`
- `frontend/apps/allin-ssl/package.json`

Go 嵌入静态资源定义在：

- `static/assets.go`

后端路由对静态页面的暴露在：

- `backend/route/route.go`

## 三、构建原理

### 1. 工作区结构

前端使用的是 pnpm workspace + turborepo。

根目录 `frontend/package.json` 定义了 workspace 和 turbo 脚本，`frontend/apps/allin-ssl` 是实际的控制面板应用。

### 2. allin-ssl 的实际构建命令

`frontend/apps/allin-ssl/package.json` 中的构建命令是：

```bash
vite build --mode build
```

### 3. Go 最终读取的不是前端 dist

`static/assets.go` 中有：

```go
//go:embed build/*
var BuildFS embed.FS
```

说明 Go 编译时嵌入的是根目录 `static/build`。

### 4. 为什么不能只保留 dist

这次实际处理过程中确认过，前端源码里有不少资源是直接写死引用的：

- `/static/images/...`
- `/static/icons/...`
- `/favicon.ico`

这些资源并不一定全部由 Vite 自动重新产出到 dist 中。

因此重新编译后，除了复制新的 Vite 构建结果，还要确认 `static/build` 下面这些静态资源仍然存在：

- `static/build/favicon.ico`
- `static/build/static/images`
- `static/build/static/icons`

## 四、环境要求

建议环境：

1. Node.js 18 及以上
2. pnpm 10.14.0
3. Go 环境可用，用于最终联调验证

本次实际验证使用的是：

1. Node.js v24.18.0
2. pnpm 10.14.0

## 五、首次编译或依赖缺失时怎么做

在仓库根目录执行前，先进入前端工作区：

```powershell
cd frontend
```

### 第一步：安装依赖

```powershell
pnpm install
```

### 第二步：构建 workspace 依赖

这个仓库里的 `allin-ssl` 依赖多个 workspace 包，例如：

- `@baota/pinia`
- `@baota/router`
- `@baota/i18n`
- `@baota/utils`
- 若干自定义 vite plugin

这些包很多通过 `dist` 提供 exports，所以在一个干净环境里，首次构建前通常需要先让依赖包完成构建。

最稳妥的方法是直接在 `frontend` 下执行：

```powershell
pnpm build --filter allin-ssl...
```

如果你希望直接让整个前端工作区统一构建，也可以执行：

```powershell
pnpm build
```

说明：

`...` 的 filter 写法会把 `allin-ssl` 及其依赖一起纳入构建，通常比单独只构建应用更稳。

## 六、日常重新编译前端的标准流程

如果你已经改了前端代码，推荐按下面流程重新编译。

### 1. 进入前端目录

```powershell
cd frontend
```

### 2. 构建 allin-ssl 应用及其依赖

```powershell
pnpm build --filter allin-ssl...
```

正常情况下，构建产物会生成到：

```text
frontend/apps/allin-ssl/dist
```

### 3. 把 dist 同步到根目录 static/build

回到仓库根目录后，用新的 dist 覆盖 `static/build`。

Windows PowerShell 示例：

```powershell
cd ..
if (Test-Path .\static\build) { Remove-Item .\static\build -Recurse -Force }
New-Item -ItemType Directory -Path .\static\build | Out-Null
Copy-Item .\frontend\apps\allin-ssl\dist\* .\static\build\ -Recurse -Force
```

### 4. 确认静态资源没有丢

至少检查下面几个路径是否存在：

```text
static/build/favicon.ico
static/build/static/images
static/build/static/icons
```

如果复制 dist 后这些路径丢了，需要从仓库原有资源中恢复到 `static/build`，否则登录页、品牌图标或其他图片可能显示异常。

## 七、推荐的一次性完整命令

如果你的依赖已经安装好了，下面是一套比较稳的重新编译流程。

### PowerShell

```powershell
cd frontend
pnpm build --filter allin-ssl...
cd ..
if (Test-Path .\static\build) { Remove-Item .\static\build -Recurse -Force }
New-Item -ItemType Directory -Path .\static\build | Out-Null
Copy-Item .\frontend\apps\allin-ssl\dist\* .\static\build\ -Recurse -Force
```

如果你担心图标和图片丢失，可以在复制后额外检查：

```powershell
Test-Path .\static\build\favicon.ico
Test-Path .\static\build\static\images
Test-Path .\static\build\static\icons
```

## 八、如何验证重新编译是否真正生效

### 方法一：直接检查 static/build

这是最重要的一步。

你需要确认新的前端改动已经体现在根目录 `static/build` 中，而不只是体现在 `frontend/apps/allin-ssl/dist` 中。

### 方法二：执行 go build

在仓库根目录执行：

```powershell
go build ./cmd
```

如果这里只构建后端而没有更新 `static/build`，编译虽然可能成功，但浏览器里看到的仍然可能是旧页面。

### 方法三：运行程序后进浏览器验证

真正可靠的验证方式是：

1. `go build` 成功
2. 启动程序
3. 打开控制面板
4. 检查你修改过的页面、表单、文案、按钮或工作流配置是否已经变化

## 九、开发模式和生产构建的区别

### 开发模式

在 `frontend/apps/allin-ssl` 中可以用：

```powershell
pnpm dev
```

这适合改页面时本地调试，但它不会自动更新根目录 `static/build`。

### 生产构建

真正用于 Go 程序嵌入交付的是：

```powershell
pnpm build --filter allin-ssl...
```

然后再同步到：

```text
static/build
```

## 十、这次实践里确认过的几个坑

### 1. 不能只改前端源码

如果你只修改了：

```text
frontend/apps/allin-ssl/src
```

但没有重新生成并覆盖：

```text
static/build
```

那么最终 `go build` 出来的程序还是旧前端。

### 2. 干净环境下直接 build 可能失败

因为 workspace 内的一些包和插件需要先有自己的构建产物，所以首次在干净环境下建议先：

```powershell
cd frontend
pnpm install
pnpm build --filter allin-ssl...
```

### 3. 构建过程可能生成额外临时目录

这个仓库的某些插件可能产生以下内容：

- `frontend/.sync-git`
- `frontend/.turbo`
- 各 package/plugin 下的 `dist`
- `frontend/apps/allin-ssl/dist`

这些是否保留取决于你的工作方式，但最终提交时要注意区分：

1. `static/build` 需要保留并提交，因为它会被 Go 嵌入
2. 临时同步目录如 `.sync-git` 通常不需要提交
3. `node_modules` 不应提交

## 十一、推荐的提交前检查

重新编译并同步完成后，建议在仓库根目录执行：

```powershell
git status --short
```

你至少应该关注两类内容：

1. 前端源码改动是否在 `frontend/apps/allin-ssl/src` 等目录中
2. 新的嵌入产物是否已经出现在 `static/build`

如果你修改了前端逻辑但 `static/build` 没有变化，那通常说明这次重新编译流程没走完整。

## 十二、最简操作指南

如果你只想记住最核心的做法，可以直接照这个流程：

```powershell
cd frontend
pnpm install
pnpm build --filter allin-ssl...
cd ..
if (Test-Path .\static\build) { Remove-Item .\static\build -Recurse -Force }
New-Item -ItemType Directory -Path .\static\build | Out-Null
Copy-Item .\frontend\apps\allin-ssl\dist\* .\static\build\ -Recurse -Force
go build ./cmd
```

然后启动程序，进浏览器确认页面变化已经生效。