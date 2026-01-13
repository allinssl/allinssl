# Gulp Build Tools

基于 Gulp 的构建文件调整工具库，提供文件重命名、内容替换、上传、压缩、Git操作和SSH执行等功能。

## 特性

- 🔄 **文件重命名** - 支持文件和文件夹的批量重命名
- 📝 **内容替换** - 支持基于正则表达式的文件内容替换
- 🚀 **文件上传** - 支持 FTP/SFTP 文件上传
- 📦 **文件压缩** - 支持 ZIP、TAR、GZIP 等格式压缩
- 🔧 **Git 操作** - 支持提交、拉取、分支切换等 Git 操作
- 🖥️  **SSH 执行** - 支持远程 SSH 命令执行
- ⚡ **任务组合** - 支持并行和串行任务组合
- 📊 **多任务支持** - Git、Upload、SSH 支持多任务并行/串行执行
- 🎯 **预设模板** - 提供常用的部署预设模板

## 安装

```bash
npm install @baota/gulp-build-tools
# 或
pnpm add @baota/gulp-build-tools
```

## 快速开始

```javascript
import { createBuildTools } from '@baota/gulp-build-tools';
import { task } from 'gulp';

// 创建构建工具实例
const buildTools = createBuildTools({
  verbose: true // 显示详细日志
});

// 文件重命名任务
task('rename', buildTools.renameFiles({
  src: 'src/**/*.js',
  rename: (path) => {
    path.basename += '.min';
  },
  dest: 'dist'
}));

// 内容替换任务
task('replace', buildTools.replaceContent({
  src: 'dist/**/*.html',
  replacements: [
    {
      search: '{{VERSION}}',
      replace: '1.0.0'
    }
  ],
  dest: 'dist'
}));

// 文件压缩任务
task('compress', buildTools.compressFiles({
  src: 'dist/**/*',
  filename: 'release.zip',
  dest: 'releases'
}));

// 组合任务
task('build', buildTools.createBuildPipeline({
  replace: [{
    src: 'src/**/*.js',
    replacements: [{ search: 'development', replace: 'production' }],
    dest: 'dist'
  }],
  compress: {
    src: 'dist/**/*',
    filename: 'app.zip',
    dest: 'releases'
  }
}));
```

## API 文档

### 文件重命名

#### `renameFiles(config: RenameConfig)`

重命名文件或文件夹。

```javascript
// 基本重命名
buildTools.renameFiles({
  src: 'src/**/*.js',
  rename: 'new-name.js', // 字符串
  dest: 'dist'
});

// 使用函数重命名
buildTools.renameFiles({
  src: 'src/**/*.js',
  rename: (path) => {
    path.basename = path.basename.replace('old', 'new');
  },
  dest: 'dist'
});

// 使用助手函数
import { helpers } from '@baota/gulp-build-tools';

buildTools.renameFiles({
  src: 'src/**/*.js',
  rename: helpers.rename.addPrefix('prod-'),
  dest: 'dist'
});
```

#### 重命名助手函数

```javascript
const { rename } = helpers;

// 添加前缀
rename.addPrefix('prefix-')

// 添加后缀
rename.addSuffix('-suffix')

// 更改扩展名
rename.changeExtension('.min.js')

// 添加时间戳
rename.addTimestamp()

// 转换大小写
rename.toLowerCase()
rename.toUpperCase()

// 替换文件名中的字符
rename.replaceInName(/old/g, 'new')
```

### 文件内容替换

#### `replaceContent(config: ReplaceConfig)`

替换文件内容。

```javascript
// 基本替换
buildTools.replaceContent({
  src: 'dist/**/*.html',
  replacements: [
    {
      search: '{{TITLE}}',
      replace: 'My App'
    },
    {
      search: /\{\{VERSION\}\}/g,
      replace: '1.0.0'
    }
  ],
  dest: 'dist'
});

// 使用函数替换
buildTools.replaceContent({
  src: 'dist/**/*.js',
  replacements: [
    {
      search: /console\.log\([^)]*\);?/g,
      replace: (match) => {
        return ''; // 移除所有 console.log
      }
    }
  ],
  dest: 'dist'
});
```

#### 替换模式助手

```javascript
const { replace } = helpers;

// 替换版本号
replace.version('2.0.0')

// 替换 API URL
replace.apiBaseUrl('https://api.example.com')

// 替换环境变量
replace.envVariable('NODE_ENV', 'production')

// 替换 HTML 标题
replace.htmlTitle('New Title')

// 替换时间戳
replace.timestamp()
```

### 文件上传

#### `uploadFiles(config: UploadConfig)`

上传文件到 FTP 或 SFTP 服务器。

```javascript
// SFTP 上传
buildTools.uploadFiles({
  type: 'sftp',
  host: 'example.com',
  username: 'user',
  password: 'password',
  // 或使用私钥: privateKey: '/path/to/key',
  remotePath: '/var/www/html',
  src: 'dist/**/*',
  parallel: true,
  clean: true // 上传前清空远程目录
});

// FTP 上传
buildTools.uploadFiles({
  type: 'ftp',
  host: 'ftp.example.com',
  username: 'user',
  password: 'password',
  remotePath: '/public_html',
  src: 'dist/**/*'
});
```

### 文件压缩

#### `compressFiles(config: CompressConfig)`

压缩文件。

```javascript
// ZIP 压缩
buildTools.compressFiles({
  src: 'dist/**/*',
  filename: 'release.zip',
  dest: 'releases',
  level: 6 // 压缩级别 0-9
});

// TAR 压缩
buildTools.compressFiles({
  src: 'dist/**/*',
  filename: 'release.tar',
  dest: 'releases',
  type: 'tar'
});

// GZIP 压缩
buildTools.compressFiles({
  src: 'dist/**/*',
  filename: 'release.tar.gz',
  dest: 'releases',
  type: 'gzip'
});
```

#### 压缩助手函数

```javascript
const { compress } = helpers;

// 创建压缩配置
compress.createConfig('dist/**/*', 'app.zip', 'releases')

// 根据文件名推断类型
compress.inferType('app.tar.gz') // 'gzip'

// 生成带时间戳的文件名
compress.timestampedFilename('backup') // 'backup-2024-01-01T12-00-00.zip'

// 获取推荐压缩级别
compress.getCompressionLevel('speed') // 1
compress.getCompressionLevel('size')  // 9
compress.getCompressionLevel('balanced') // 6
```

### Git 操作

#### `gitOperation(config: GitConfig)`

执行 Git 操作。

```javascript
// 提交代码
buildTools.gitOperation({
  action: 'commit',
  message: '发布版本 1.0.0',
  files: ['dist/**/*', 'package.json']
});

// 拉取代码
buildTools.gitOperation({
  action: 'pull',
  remote: 'origin',
  branch: 'main'
});

// 推送代码
buildTools.gitOperation({
  action: 'push',
  remote: 'origin',
  branch: 'main'
});

// 切换分支
buildTools.gitOperation({
  action: 'checkout',
  branch: 'develop'
});

// 创建分支
buildTools.gitOperation({
  action: 'branch',
  branch: 'feature/new-feature'
});

// 合并分支
buildTools.gitOperation({
  action: 'merge',
  branch: 'feature/new-feature'
});
```

#### Git 助手函数

```javascript
const { git } = helpers;

// 检查仓库状态
const status = await git.checkStatus();
console.log(status.clean); // 是否干净

// 获取当前分支
const branch = await git.getCurrentBranch();

// 检查是否有未提交的更改
const hasChanges = await git.hasUncommittedChanges();

// 获取最新提交信息
const commit = await git.getLatestCommit();
```

### SSH 命令执行

#### `sshExecution(config: SSHConfig)`

执行远程 SSH 命令。

```javascript
// 执行单个命令
buildTools.sshExecution({
  host: 'example.com',
  username: 'user',
  password: 'password',
  commands: 'pm2 restart all',
  verbose: true
});

// 执行多个命令
buildTools.sshExecution({
  host: 'example.com',
  username: 'user',
  privateKey: '/path/to/private/key',
  commands: [
    'cd /var/www/html',
    'git pull origin main',
    'npm install',
    'npm run build',
    'pm2 restart all'
  ]
});
```

#### SSH 助手函数

```javascript
const { ssh } = helpers;

// 测试连接
const connected = await ssh.testConnection({
  host: 'example.com',
  username: 'user',
  password: 'password'
});

// 执行单个命令
const result = await ssh.executeCommand(
  { host: 'example.com', username: 'user', password: 'password' },
  'ls -la'
);

// 使用命令模板
ssh.commands.restartService('nginx')
ssh.commands.checkService('mysql')
ssh.commands.deployApp('/var/www/myapp')
ssh.commands.cleanLogs('/var/log', 7)
ssh.commands.checkDiskSpace()
```

## 多任务支持

从 v1.1.0 开始，Git、Upload 和 SSH 功能支持多任务执行，可以同时对多个目标执行操作。

### 多 Git 操作

```javascript
// 串行执行多个 Git 操作
task('git-multi-serial', buildTools.multiGitOperation([
  {
    action: 'commit',
    message: '提交当前更改',
    files: '.'
  },
  {
    action: 'push',
    remote: 'origin',
    branch: 'main'
  }
], false)); // false = 串行执行

// 并行执行多个 Git 操作（不同仓库）
task('git-multi-parallel', buildTools.multiGitOperation([
  {
    action: 'pull',
    repoPath: '/path/to/repo1',
    remote: 'origin',
    branch: 'main'
  },
  {
    action: 'pull',
    repoPath: '/path/to/repo2',
    remote: 'origin',
    branch: 'develop'
  }
], true)); // true = 并行执行
```

### 多服务器上传

```javascript
// 并行上传到多个服务器
task('upload-multi', buildTools.multiUpload([
  {
    type: 'sftp',
    host: 'server1.example.com',
    username: 'deploy',
    privateKey: '/path/to/key1',
    remotePath: '/var/www/app',
    src: 'dist/**/*'
  },
  {
    type: 'ftp',
    host: 'server2.example.com',
    username: 'deploy',
    password: 'password',
    remotePath: '/public_html',
    src: 'dist/**/*'
  },
  {
    type: 'sftp',
    host: 'server3.example.com',
    username: 'deploy',
    privateKey: '/path/to/key3',
    remotePath: '/var/www/app',
    src: 'dist/**/*'
  }
], true)); // 并行上传
```

### 多 SSH 任务

```javascript
// 并行执行多个 SSH 任务
task('ssh-multi', buildTools.multiSSHExecution([
  {
    host: 'web1.example.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    commands: [
      'pm2 restart web-app',
      'pm2 status'
    ]
  },
  {
    host: 'web2.example.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    commands: [
      'pm2 restart web-app',
      'pm2 status'
    ]
  },
  {
    host: 'api.example.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    commands: [
      'docker restart api-container',
      'docker ps'
    ]
  }
], true)); // 并行执行
```

### 多任务优势

1. **提高效率**: 并行执行多个任务，显著减少部署时间
2. **错误处理**: 单个任务失败不会影响其他任务
3. **进度可视**: 实时显示每个任务的执行状态
4. **灵活配置**: 可以选择并行或串行执行模式

### 复合部署流水线

```javascript
// 生产环境多服务器部署
task('deploy:production', series(
  // 1. 构建和打包
  buildTools.replaceContent({
    src: 'src/**/*.js',
    replacements: [{ search: '{{ENV}}', replace: 'production' }],
    dest: 'dist'
  }),
  
  // 2. 并行上传到多个服务器
  buildTools.multiUpload([
    {
      type: 'sftp',
      host: 'prod-web1.example.com',
      username: 'deploy',
      privateKey: '/path/to/key',
      remotePath: '/var/www/app',
      src: 'dist/**/*'
    },
    {
      type: 'sftp',
      host: 'prod-web2.example.com',
      username: 'deploy',
      privateKey: '/path/to/key',
      remotePath: '/var/www/app',
      src: 'dist/**/*'
    }
  ], true),
  
  // 3. 并行重启所有服务
  buildTools.multiSSHExecution([
    {
      host: 'prod-web1.example.com',
      username: 'deploy',
      privateKey: '/path/to/key',
      commands: ['pm2 restart app', 'nginx -s reload']
    },
    {
      host: 'prod-web2.example.com',
      username: 'deploy',
      privateKey: '/path/to/key',
      commands: ['pm2 restart app', 'nginx -s reload']
    }
  ], true)
));
```

## 预设模板

### 前端项目部署

```javascript
import { presets } from '@baota/gulp-build-tools';

// Vue/React 项目部署
const deployConfig = presets.frontend.vueDeploy({
  buildDir: 'dist',
  serverConfig: {
    type: 'sftp',
    host: 'example.com',
    username: 'user',
    password: 'password',
    remotePath: '/var/www/html'
  },
  sshConfig: {
    host: 'example.com',
    username: 'user',
    password: 'password',
    commands: ['nginx -s reload']
  }
});

task('deploy', buildTools.createBuildPipeline(deployConfig));
```

### 后端项目部署

```javascript
// Node.js 项目部署
const deployConfig = presets.backend.nodeDeploy({
  appPath: '/var/www/myapp',
  serverConfig: {
    type: 'sftp',
    host: 'example.com',
    username: 'user',
    password: 'password',
    remotePath: '/var/www/myapp'
  },
  sshConfig: {
    host: 'example.com',
    username: 'user',
    password: 'password',
    commands: []
  }
});

task('deploy', buildTools.createBuildPipeline(deployConfig));
```

## 批量操作

```javascript
import { batchOperations } from '@baota/gulp-build-tools';

// 批量重命名
const renameResults = await batchOperations.rename([
  { src: 'src/**/*.js', rename: 'bundle.js', dest: 'dist' },
  { src: 'src/**/*.css', rename: 'style.css', dest: 'dist' }
]);

// 批量上传
const uploadResults = await batchOperations.upload([
  { type: 'sftp', host: 'server1.com', ... },
  { type: 'ftp', host: 'server2.com', ... }
]);
```

## 完整示例

```javascript
import { createBuildTools, presets } from '@baota/gulp-build-tools';
import { task, series } from 'gulp';

const buildTools = createBuildTools({ verbose: true });

// 构建任务
task('build', buildTools.createBuildPipeline({
  // 替换版本号和环境变量
  replace: [{
    src: 'src/**/*.js',
    replacements: [
      { search: '{{VERSION}}', replace: '1.0.0' },
      { search: 'development', replace: 'production' }
    ],
    dest: 'dist'
  }],
  
  // 重命名文件
  rename: [{
    src: 'dist/**/*.js',
    rename: (path) => path.basename += '.min',
    dest: 'dist'
  }],
  
  // 压缩文件
  compress: {
    src: 'dist/**/*',
    filename: 'release-1.0.0.zip',
    dest: 'releases'
  }
}));

// 部署任务
task('deploy', buildTools.createBuildPipeline({
  // 上传到服务器
  upload: {
    type: 'sftp',
    host: 'example.com',
    username: 'deploy',
    privateKey: '~/.ssh/id_rsa',
    remotePath: '/var/www/html',
    src: 'dist/**/*',
    clean: true
  },
  
  // 重启服务
  ssh: {
    host: 'example.com',
    username: 'deploy',
    privateKey: '~/.ssh/id_rsa',
    commands: [
      'sudo systemctl reload nginx',
      'pm2 restart all'
    ]
  }
}));

// Git 工作流
task('release', series(
  buildTools.gitOperation({
    action: 'commit',
    message: 'Release 1.0.0',
    files: '.'
  }),
  buildTools.gitOperation({
    action: 'push',
    remote: 'origin',
    branch: 'main'
  })
));

// 完整流水线
task('full-deploy', series('build', 'release', 'deploy'));
```

## 错误处理

所有任务都支持错误处理，可以通过回调函数或 Promise 的方式处理错误：

```javascript
// 使用回调
task('example', (cb) => {
  const stream = buildTools.renameFiles(config);
  
  stream.on('error', (error) => {
    console.error('任务执行失败:', error);
    cb(error);
  });
  
  stream.on('end', () => {
    console.log('任务执行成功');
    cb();
  });
  
  return stream;
});

// 使用批量操作的 Promise
task('batch-example', async () => {
  try {
    const results = await batchOperations.upload(configs);
    results.forEach(result => {
      if (result.success) {
        console.log('成功:', result.message);
      } else {
        console.error('失败:', result.error);
      }
    });
  } catch (error) {
    console.error('批量操作失败:', error);
  }
});
```

## 许可证

MIT