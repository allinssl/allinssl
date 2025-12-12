# 加密解密工具函数文档

这个模块提供了一系列用于加密解密的实用工具函数。该模块使用 JSEncrypt 库实现 RSA 加密解密功能。

## 目录

1. [密钥对生成](#密钥对生成)
2. [RSA 加密](#rsa-加密)
3. [RSA 解密](#rsa-解密)

## 密钥对生成

### 生成 RSA 密钥对

```typescript
generateKeyPair(): { publicKey: string, privateKey: string }
```

生成一对 RSA 公私钥。

返回值：

- 包含公钥和私钥的对象
  - `publicKey`: RSA 公钥
  - `privateKey`: RSA 私钥

特点：

- 使用 2048 位密钥长度
- 返回标准 PEM 格式的密钥对

示例：

```typescript
const { publicKey, privateKey } = generateKeyPair()
// publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
// privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
```

## RSA 加密

### RSA 加密函数

```typescript
rsaEncrypt(str: string, publicKey: string): string
```

使用 RSA 公钥对字符串进行加密。

参数：

- `str`: 需要加密的字符串
- `publicKey`: RSA 公钥

返回值：

- 加密后的字符串

注意事项：

- 如果公钥长度小于 10，将直接返回原字符串
- 使用 JSEncrypt 库进行加密操作

示例：

```typescript
const publicKey = '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
const encrypted = rsaEncrypt('hello world', publicKey)
```

## RSA 解密

### RSA 解密函数

```typescript
rsaDecrypt(str: string, privateKey: string): string
```

使用 RSA 私钥对加密字符串进行解密。

参数：

- `str`: 需要解密的字符串
- `privateKey`: RSA 私钥

返回值：

- 解密后的原始字符串

注意事项：

- 如果私钥长度小于 10，将直接返回原字符串
- 使用 JSEncrypt 库进行解密操作

示例：

```typescript
const privateKey = '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
const decrypted = rsaDecrypt(encrypted, privateKey)
```

## 完整使用示例

```typescript
// 1. 生成密钥对
const { publicKey, privateKey } = generateKeyPair()

// 2. 使用公钥加密数据
const message = 'Hello, World!'
const encrypted = rsaEncrypt(message, publicKey)

// 3. 使用私钥解密数据
const decrypted = rsaDecrypt(encrypted, privateKey)
console.log(decrypted) // 输出: 'Hello, World!'
```

## 特点

1. 使用 TypeScript 编写，提供完整的类型支持
2. 基于 JSEncrypt 库实现 RSA 加密解密
3. 提供简单易用的 API
4. 内置密钥长度验证
5. 支持标准 RSA 密钥格式
6. 提供密钥对生成功能

## 注意事项

1. 使用前需要准备好 RSA 公私钥对，或使用 generateKeyPair 生成
2. 密钥必须符合标准 RSA 密钥格式
3. 建议在 HTTPS 环境下使用
4. 注意保护好私钥，不要在客户端存储
5. 加密数据有长度限制，取决于 RSA 密钥长度（2048 位）
