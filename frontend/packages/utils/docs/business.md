# 业务工具函数文档

这个模块提供了一系列用于业务处理的实用工具函数。该模块使用 Ramda.js 进行函数式编程，并提供了完整的 TypeScript 类型支持。

## 目录

1. [正则验证](#正则验证)
2. [业务操作](#业务操作)
3. [代理函数](#代理函数)

## 正则验证

### 邮箱验证

```typescript
isEmail(email: string): boolean
```

验证字符串是否为有效的邮箱地址。使用标准邮箱格式验证，要求包含 `@` 和域名。

### 手机号验证

```typescript
isPhone(phone: string): boolean
```

验证字符串是否为有效的中国大陆手机号。要求以 1 开头，第二位为 3-9，总长度为 11 位。

### 身份证号验证

```typescript
isIdCard(idCard: string): boolean
```

验证字符串是否为有效的中国大陆身份证号。支持 18 位身份证号码验证，包含生日和校验位检查。

### URL验证

```typescript
isUrl(url: string): boolean
```

验证字符串是否为有效的URL。支持 http、https、ftp、rtsp、mms 等协议。

### IP地址验证

#### IPv4验证

```typescript
isIpv4(ip: string): boolean
```

验证字符串是否为有效的IPv4地址。每段数字范围为 0-255，使用更精确的数字范围验证。

#### IPv6验证

```typescript
isIpv6(ip: string): boolean
```

验证字符串是否为有效的IPv6地址。支持以下格式：

- 标准 IPv6 地址
- 压缩形式
- 混合形式
- IPv4 映射到 IPv6
- 特殊形式（如 fe80:: 链路本地地址）

#### 通用IP验证

```typescript
isIp(ip: string): boolean
```

验证字符串是否为有效的IP地址，同时支持 IPv4 和 IPv6。

### IP段验证

```typescript
isIps(ips: string): boolean
```

验证字符串是否为有效的IP段。支持 CIDR 表示法，如 "192.168.1.0/24"。

### 端口验证

```typescript
isPort(port: string): boolean
```

验证字符串是否为有效的端口号。范围为 1-65535，使用精确的数字范围验证。

### MAC地址验证

```typescript
isMac(mac: string): boolean
```

验证字符串是否为有效的MAC地址。格式为 XX-XX-XX-XX-XX-XX，其中 X 为十六进制数字。

### 中文验证

```typescript
isChinese(str: string): boolean
```

验证字符串是否只包含中文字符。使用 Unicode 范围 \u4e00-\u9fa5 进行验证。

## 业务操作

### 手机号加密

```typescript
encryptPhone(phone: string): string
```

将手机号中间4位替换为星号。

示例：

```typescript
encryptPhone('13812345678') // 返回: '138****5678'
```

### 身份证号加密

```typescript
encryptIdCard(idCard: string): string
```

将身份证号中间4位替换为星号。

示例：

```typescript
encryptIdCard('440101199001011234') // 返回: '440101****1234'
```

### 版本号比较

```typescript
compareVersion(version1: string, version2: string): number
```

使用函数式编程方式比较两个版本号的大小。

- 返回 1: version1 > version2
- 返回 -1: version1 < version2
- 返回 0: version1 = version2

特点：

- 使用 Ramda.js 的 pipe 函数进行函数组合
- 自动处理不同长度的版本号
- 支持任意深度的版本号比较

### 字节转换

```typescript
formatBytes(bytes: number, fixed?: number, isUnit?: boolean, endUnit?: string): string
formatBytesCurried(bytes: number)(fixed?: number, isUnit?: boolean, endUnit?: string): string
```

将字节数转换为可读的字符串，提供普通版本和柯里化版本。

参数：

- `bytes`: 要转换的字节数
- `fixed`: 保留小数位数，默认为 2
- `isUnit`: 是否显示单位，默认为 true
- `endUnit`: 指定结束单位，如果指定则转换到该单位为止

支持的单位：B、KB、MB、GB、TB

### 分页字符串转换

```typescript
formatPage(page: string): number
```

从特定格式的字符串中提取分页数量。使用正则表达式匹配 `class='Pcount'>共n条<` 格式的字符串。

## 代理函数

### 代理配置生成

```typescript
getProxyConfig(proxyKey: string, usage?: 'query' | 'params'): string | { request_time: number; request_token: string }
```

生成代理请求所需的配置信息。使用 MD5 加密生成请求令牌。

参数：

- `proxyKey`: 代理密钥
- `usage`: 使用场景
  - 'params': 返回对象格式
  - 'query': 返回查询字符串格式

返回值：

- params 格式: `{ request_time: number; request_token: string }`
- query 格式: `request_time=${time}&request_token=${token}`

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 使用 Ramda.js 进行函数式编程
3. 提供柯里化版本的函数
4. 使用精确的正则表达式进行验证
5. 支持现代化的 IP 地址格式（包括 IPv6）

## 注意事项

1. 所有正则验证函数都使用严格的匹配规则
2. 版本号比较支持任意深度的版本号格式
3. 字节转换函数支持自定义结束单位
4. 代理配置函数仅在开发环境下使用
5. 所有函数都经过优化，支持函数式编程范式
