# Vite FTP/SFTP Sync Plugin

这是一个用于 Vite 构建后自动同步文件到 SFTP 服务器的插件。

## 安装

```bash
pnpm add @tools/ftp-sync -D
```

## 使用方法

在 `vite.config.ts` 中配置：

```typescript
import { defineConfig } from 'vite';
import ftpSync from '@tools/ftp-sync';

export default defineConfig({
  plugins: [
    ftpSync({
      host: 'your-sftp-host',
      port: 22,
      username: 'your-username',
      password: 'your-password',
      remotePath: '/path/on/remote/server',
      localPath: 'dist' // 可选，默认为 'dist'
    })
  ]
});
```

## 配置选项

- `host`: SFTP 服务器地址
- `port`: SFTP 端口号（默认 22）
- `username`: SFTP 用户名
- `password`: SFTP 密码
- `remotePath`: 远程服务器上的目标路径
- `localPath`: 本地要上传的目录路径（可选，默认为 'dist'）

## 注意事项

1. 该插件仅在构建模式下运行
2. 确保有正确的 SFTP 服务器访问权限
3. 建议将敏感信息（如密码）存储在环境变量中 