# AllinSSL API 认证使用文档

## 概述

AllinSSL 现在支持多种 API 认证方式，方便外部系统调用后台管理 API。

## 认证方式

### 方式一：JWT Token 认证（推荐）

#### 1. 获取 JWT Token

**方法 A：使用登录接口**
```bash
# Linux/macOS
curl -X POST http://localhost:8888/v1/login/sign \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=your_password"

# Windows CMD
curl -X POST http://localhost:8888/v1/login/sign -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin&password=your_password"

# PowerShell
curl -X POST http://localhost:8888/v1/login/sign -H "Content-Type: application/x-www-form-urlencoded" -d 'username=admin&password=your_password'
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expire": 86400,
    "token_type": "Bearer",
    "username": "admin"
  },
  "message": "success",
  "status": true
}
```

**方法 B：使用专用 Token 接口**
```bash
# JSON 格式
curl -X POST http://localhost:8888/v1/token/generate \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Form 格式
curl -X POST http://localhost:8888/v1/token/generate \
  -d "username=admin&password=your_password"
```

#### 2. 使用 JWT Token 调用 API

```bash
# 在 Authorization header 中携带 token
curl -X POST http://localhost:8888/v1/overview/get_overviews \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取工作流列表
curl -X POST http://localhost:8888/v1/workflow/get_list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded"

# 获取 ACME 账户列表
curl -X POST http://localhost:8888/v1/acme_account/get_list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. 刷新 Token

```bash
curl -X POST http://localhost:8888/v1/token/refresh \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_JWT_TOKEN"}'

# 或使用 Authorization header
curl -X POST http://localhost:8888/v1/token/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 方式二：API Key 认证（适合服务器间调用）

#### 1. 配置 API Key

```bash
# 首先需要登录获取 token
curl -X POST http://localhost:8888/v1/login/sign \
  -d "username=admin&password=your_password"

# 保存 API Key
curl -X POST http://localhost:8888/v1/token/save_api_key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"api_key":"your_secret_api_key"}'
```

#### 2. 生成 API Token

API Token 需要时间戳和 API Key 生成，有效期 5 分钟。

**方法 A：使用接口生成**
```bash
# 获取当前时间戳（Unix 时间戳，秒）
timestamp=$(date +%s)  # Linux/macOS
# Windows PowerShell: $timestamp = [int][double]::Parse((Get-Date -UFormat %s))

# 调用接口生成
curl -X POST http://localhost:8888/v1/token/generate_api_token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"timestamp\":\"$timestamp\"}"
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "api_key": "your_secret_api_key",
    "timestamp": "1234567890",
    "api_token": "abc123...",
    "bearer": "api_key:your_secret_api_key:1234567890:abc123...",
    "expire_in": 300,
    "usage": "Authorization: Bearer api_key:your_secret_api_key:1234567890:abc123..."
  }
}
```

**方法 B：自行生成（编程方式）**
```python
# Python 示例
import hashlib
import time

api_key = "your_secret_api_key"
timestamp = str(int(time.time()))

# 生成 api_token
key_md5 = hashlib.md5(api_key.encode()).hexdigest()
api_token = hashlib.md5((timestamp + key_md5).encode()).hexdigest()

# 构造 bearer token
bearer = f"api_key:{api_key}:{timestamp}:{api_token}"
```

#### 3. 使用 API Key 调用 API

```bash
# 方式 1：使用 Authorization header（推荐）
curl -X POST http://localhost:8888/v1/overview/get_overviews \
  -H "Authorization: Bearer api_key:your_secret_api_key:1234567890:abc123..."

# 方式 2：使用表单参数（向后兼容）
curl -X POST http://localhost:8888/v1/overview/get_overviews \
  -d "api_token=abc123...&timestamp=1234567890"
```

---

### 方式三：Session Cookie 认证（原有方式）

原有的后台管理系统基于 Cookie 的认证方式继续有效，适用于浏览器访问。

---

## 常用 API 示例

### 1. 获取概览数据
```bash
curl -X POST http://localhost:8888/v1/overview/get_overviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 获取工作流列表
```bash
curl -X POST http://localhost:8888/v1/workflow/get_list \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d '{"page":1,"page_size":10}'
```

### 3. 获取 ACME 账户列表
```bash
curl -X POST http://localhost:8888/v1/acme_account/get_list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 获取证书列表
```bash
curl -X POST http://localhost:8888/v1/cert/get_list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 获取监控列表
```bash
curl -X POST http://localhost:8888/v1/monitor/get_list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 错误处理

### 401 Unauthorized
- Token 无效或过期
- API Key 不正确
- 时间戳过期（超过 5 分钟）

### 404 Not Found
- Session 无效（未登录）
- 请求的资源不存在

### 500 Internal Server Error
- 服务器内部错误
- 参数格式错误

---

## 安全建议

1. **JWT Token**：
   - 妥善保存 token，不要泄露
   - token 有效期默认 24 小时，可在设置中调整
   - 建议定期刷新 token

2. **API Key**：
   - 使用强随机字符串作为 API Key
   - 定期更换 API Key
   - 不要在客户端代码中硬编码 API Key

3. **HTTPS**：
   - 生产环境建议启用 HTTPS
   - 避免在不安全的网络中传输敏感信息

---

## 完整 API 列表

| 端点 | 方法 | 说明 |
|------|------|------|
| `/v1/login/sign` | POST | 用户登录 |
| `/v1/login/sign-out` | POST | 用户登出 |
| `/v1/login/get_code` | GET | 获取验证码 |
| `/v1/token/generate` | POST | 生成 JWT token |
| `/v1/token/refresh` | POST | 刷新 JWT token |
| `/v1/token/get_api_key` | POST | 获取 API Key 配置 |
| `/v1/token/generate_api_token` | POST | 生成 API token |
| `/v1/token/save_api_key` | POST | 保存 API Key |
| `/v1/token/delete_api_key` | POST | 删除 API Key |
| `/v1/overview/get_overviews` | POST | 获取概览数据 |
| `/v1/workflow/*` | POST | 工作流管理 |
| `/v1/acme_account/*` | POST | ACME 账户管理 |
| `/v1/cert/*` | POST | 证书管理 |
| `/v1/monitor/*` | POST | 监控管理 |
| `/v1/setting/*` | POST | 设置管理 |
