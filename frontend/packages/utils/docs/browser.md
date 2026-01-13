# 浏览器工具函数文档

这个模块提供了一系列用于浏览器端操作的实用工具函数。

## 目录

1. [浏览器环境检测](#浏览器环境检测)
2. [浏览器信息获取](#浏览器信息获取)
3. [缓存操作](#缓存操作)
4. [Cookie 操作](#cookie-操作)
5. [Storage 操作](#storage-操作)

## 浏览器环境检测

### isHttps

检查当前页面是否使用 HTTPS 协议。

```typescript
const isSecure = isHttps() // 返回 boolean
```

### isDev

判断当前是否为开发环境。

```typescript
const isDevelopment = isDev() // 返回 boolean
```

## 浏览器信息获取

### getBrowserOSInfo

获取当前浏览器和操作系统信息。

```typescript
const { browser, os } = getBrowserOSInfo()
// 返回格式：{ browser: string, os: string }
```

### getScreenInfo

获取屏幕分辨率和设备像素比信息。

```typescript
const { resolution, scale } = getScreenInfo()
// 返回格式：{ resolution: string, scale: number }
```

## 缓存操作

### forceRefresh

强制刷新页面并清理所有缓存（包括 Cache API、localStorage 和 sessionStorage）。

```typescript
await forceRefresh()
```

### clearBrowserCache

清空浏览器所有缓存数据。

```typescript
clearBrowserCache()
```

## Cookie 操作

### setCookie

设置 Cookie 值。

```typescript
setCookie(key: string, value: string, days?: number)
```

### getCookie

获取 Cookie 值。

```typescript
const value = getCookie(key: string) // 返回 string | null
```

### deleteCookie

删除指定的 Cookie。

```typescript
deleteCookie(key: string)
```

### clearCookie

清空所有 Cookie。

```typescript
clearCookie()
```

## Storage 操作

### LocalStorage 操作

```typescript
// 设置数据
setLocalItem(key: string, value: any)

// 获取数据
const value = getLocalItem(key: string)

// 删除数据
removeLocalItem(key: string)

// 清空所有数据
clearLocal()
```

### SessionStorage 操作

```typescript
// 设置数据
setSessionItem(key: string, value: any)

// 获取数据
const value = getSessionItem(key: string)

// 删除数据
removeSessionItem(key: string)

// 清空所有数据
clearSession()
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 使用 Ramda.js 进行函数式编程
3. 支持数据自动序列化和反序列化
4. 提供柯里化版本的函数供函数式编程使用

## 注意事项

1. Cookie 操作会自动根据 HTTPS 协议添加前缀
2. Storage 操作会自动进行 JSON 序列化和反序列化
3. 所有清除缓存的操作都是不可逆的，请谨慎使用
