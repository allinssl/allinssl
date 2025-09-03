import { createBuildTools, helpers, presets } from '../src/index.js';
import { task, series, parallel } from 'gulp';

// 创建构建工具实例
const buildTools = createBuildTools({
  verbose: true,
  cwd: process.cwd(),
  tempDir: './temp'
});

// ===== 基础功能示例 =====

// 1. 文件重命名示例
task('example:rename', buildTools.renameFiles({
  src: 'src/**/*.js',
  rename: helpers.rename.addPrefix('bundle-'),
  dest: 'dist'
}));

// 2. 内容替换示例
task('example:replace', buildTools.replaceContent({
  src: 'src/**/*.html',
  replacements: [
    helpers.replace.version('2.0.0'),
    helpers.replace.htmlTitle('我的应用'),
    {
      search: /{{API_URL}}/g,
      replace: 'https://api.example.com'
    }
  ],
  dest: 'dist'
}));

// 3. 文件压缩示例
task('example:compress', buildTools.compressFiles({
  src: 'dist/**/*',
  filename: helpers.compress.timestampedFilename('release'),
  dest: 'releases',
  type: 'zip',
  level: helpers.compress.getCompressionLevel('balanced')
}));

// 4. Git 操作示例
task('example:git-commit', buildTools.gitOperation({
  action: 'commit',
  message: `自动构建 - ${new Date().toLocaleString()}`,
  files: ['dist/**/*', 'package.json']
}));

task('example:git-push', buildTools.gitOperation({
  action: 'push',
  remote: 'origin',
  branch: 'main'
}));

// 5. 文件上传示例（需要配置真实服务器信息）
task('example:upload-sftp', buildTools.uploadFiles({
  type: 'sftp',
  host: 'your-server.com',
  username: 'deploy',
  password: 'your-password',
  // 或使用私钥: privateKey: '/path/to/private/key',
  remotePath: '/var/www/html',
  src: 'dist/**/*',
  parallel: true,
  clean: false
}));

// 6. SSH 命令执行示例（需要配置真实服务器信息）
task('example:ssh', buildTools.sshExecution({
  host: 'your-server.com',
  username: 'deploy',
  password: 'your-password',
  commands: [
    helpers.ssh.commands.checkDiskSpace(),
    helpers.ssh.commands.checkMemory(),
    helpers.ssh.commands.restartService('nginx')
  ],
  verbose: true
}));

// ===== 组合任务示例 =====

// 简单的构建流水线
task('example:simple-build', buildTools.createBuildPipeline({
  replace: [{
    src: 'src/**/*.js',
    replacements: [
      { search: 'development', replace: 'production' },
      { search: /console\.log\([^)]*\);?/g, replace: '' }
    ],
    dest: 'dist'
  }],
  rename: [{
    src: 'dist/**/*.js',
    rename: helpers.rename.addSuffix('.min'),
    dest: 'dist'
  }],
  compress: helpers.compress.createConfig(
    'dist/**/*',
    'app.zip',
    'releases'
  )
}));

// 前端项目部署流水线
task('example:frontend-deploy', () => {
  const config = presets.frontend.vueDeploy({
    buildDir: 'dist',
    serverConfig: {
      type: 'sftp',
      host: 'your-server.com',
      username: 'deploy',
      password: 'your-password',
      remotePath: '/var/www/html',
      src: 'dist/**/*',
      clean: true
    },
    sshConfig: {
      host: 'your-server.com',
      username: 'deploy',
      password: 'your-password',
      commands: [
        'sudo nginx -s reload',
        'echo "部署完成"'
      ]
    }
  });
  
  return buildTools.createBuildPipeline(config)();
});

// 复杂的部署流水线
task('example:complex-deploy', buildTools.createBuildPipeline({
  // 步骤1: 更新版本号和构建信息
  replace: [{
    src: 'src/**/*.js',
    replacements: [
      helpers.replace.version('1.2.0'),
      helpers.replace.buildNumber('2024.001'),
      helpers.replace.timestamp(),
      { search: 'DEBUG_MODE = true', replace: 'DEBUG_MODE = false' }
    ],
    dest: 'dist'
  }],
  
  // 步骤2: 重命名和优化文件
  rename: [{
    src: 'dist/**/*.{js,css}',
    rename: (path) => {
      // 添加哈希后缀用于缓存破坏
      const hash = Math.random().toString(36).substring(2, 8);
      path.basename += `.${hash}`;
    },
    dest: 'dist'
  }],
  
  // 步骤3: 创建备份
  compress: {
    src: 'dist/**/*',
    filename: `backup-${new Date().toISOString().slice(0, 10)}.zip`,
    dest: 'backups',
    type: 'zip',
    level: 9
  },
  
  // 步骤4: Git 提交
  git: {
    action: 'commit',
    message: `部署版本 1.2.0 - ${new Date().toLocaleString()}`,
    files: '.'
  },
  
  // 步骤5: 上传文件
  upload: {
    type: 'sftp',
    host: 'production-server.com',
    username: 'deploy',
    privateKey: '/path/to/deploy/key',
    remotePath: '/var/www/production',
    src: 'dist/**/*',
    parallel: true,
    clean: true
  },
  
  // 步骤6: 服务器端操作
  ssh: {
    host: 'production-server.com',
    username: 'deploy',
    privateKey: '/path/to/deploy/key',
    commands: [
      // 备份当前版本
      'cp -r /var/www/production /var/backups/$(date +%Y%m%d_%H%M%S)',
      
      // 更新依赖
      'cd /var/www/production && npm install --production',
      
      // 重启服务
      'pm2 restart production-app',
      
      // 重新加载 Nginx 配置
      'sudo nginx -s reload',
      
      // 健康检查
      'sleep 5 && curl -f http://localhost/health || exit 1',
      
      // 清理旧备份（保留最近5个）
      'ls -t /var/backups/ | tail -n +6 | xargs -I {} rm -rf /var/backups/{}'
    ],
    verbose: true
  }
}));

// ===== 并行任务示例 =====

// 多服务器并行部署
task('example:multi-server-deploy', buildTools.createParallelTasks({
  'deploy-server1': buildTools.uploadFiles({
    type: 'sftp',
    host: 'server1.com',
    username: 'deploy',
    password: 'password1',
    remotePath: '/var/www/html',
    src: 'dist/**/*'
  }),
  
  'deploy-server2': buildTools.uploadFiles({
    type: 'sftp',
    host: 'server2.com',
    username: 'deploy',
    password: 'password2',
    remotePath: '/var/www/html',
    src: 'dist/**/*'
  }),
  
  'deploy-server3': buildTools.uploadFiles({
    type: 'ftp',
    host: 'server3.com',
    username: 'deploy',
    password: 'password3',
    remotePath: '/public_html',
    src: 'dist/**/*'
  })
}));

// ===== 串行任务示例 =====

// 完整的 CI/CD 流水线
task('example:cicd-pipeline', buildTools.createSeriesTasks({
  'prepare': buildTools.replaceContent({
    src: 'src/**/*.js',
    replacements: [
      { search: '{{ENVIRONMENT}}', replace: 'production' },
      { search: '{{BUILD_TIME}}', replace: new Date().toISOString() }
    ],
    dest: 'dist'
  }),
  
  'test': buildTools.sshExecution({
    host: 'test-server.com',
    username: 'tester',
    password: 'test-password',
    commands: [
      'cd /var/www/test',
      'npm test',
      'npm run e2e'
    ]
  }),
  
  'build': buildTools.compressFiles({
    src: 'dist/**/*',
    filename: 'production-build.zip',
    dest: 'releases'
  }),
  
  'backup': buildTools.sshExecution({
    host: 'production-server.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    commands: [
      'mkdir -p /var/backups/$(date +%Y%m%d)',
      'cp -r /var/www/production /var/backups/$(date +%Y%m%d)/'
    ]
  }),
  
  'deploy': buildTools.uploadFiles({
    type: 'sftp',
    host: 'production-server.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    remotePath: '/var/www/production',
    src: 'dist/**/*',
    clean: true
  }),
  
  'restart': buildTools.sshExecution({
    host: 'production-server.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    commands: [
      'pm2 restart production-app',
      'sudo nginx -s reload'
    ]
  })
}));

// ===== 预设模板使用示例 =====

// 使用前端部署预设
task('example:preset-frontend', () => {
  const deployConfig = presets.frontend.vueDeploy({
    buildDir: 'dist',
    serverConfig: {
      type: 'sftp',
      host: 'cdn-server.com',
      username: 'cdn-user',
      password: 'cdn-password',
      remotePath: '/var/www/cdn',
      src: 'dist/**/*'
    }
  });
  
  return buildTools.createBuildPipeline(deployConfig)();
});

// 使用后端部署预设
task('example:preset-backend', () => {
  const deployConfig = presets.backend.nodeDeploy({
    appPath: '/var/www/myapp',
    serverConfig: {
      type: 'sftp',
      host: 'app-server.com',
      username: 'app-user',
      privateKey: '/path/to/app/key',
      remotePath: '/var/www/myapp',
      src: 'dist/**/*'
    },
    sshConfig: {
      host: 'app-server.com',
      username: 'app-user',
      privateKey: '/path/to/app/key',
      commands: []
    }
  });
  
  return buildTools.createBuildPipeline(deployConfig)();
});

// ===== 实用工具示例 =====

// 自定义任务：环境特定的构建
function createEnvironmentBuild(env: 'development' | 'staging' | 'production') {
  const envConfig = {
    development: {
      apiUrl: 'http://localhost:3000',
      debugMode: true,
      minify: false
    },
    staging: {
      apiUrl: 'https://staging-api.example.com',
      debugMode: true,
      minify: true
    },
    production: {
      apiUrl: 'https://api.example.com',
      debugMode: false,
      minify: true
    }
  }[env];

  return buildTools.createBuildPipeline({
    replace: [{
      src: 'src/**/*.js',
      replacements: [
        { search: '{{API_URL}}', replace: envConfig.apiUrl },
        { search: '{{DEBUG_MODE}}', replace: envConfig.debugMode.toString() },
        ...(envConfig.minify ? [
          { search: /console\.log\([^)]*\);?/g, replace: '' },
          { search: /\s+/g, replace: ' ' }
        ] : [])
      ],
      dest: `dist/${env}`
    }],
    compress: {
      src: `dist/${env}/**/*`,
      filename: `${env}-build.zip`,
      dest: 'releases'
    }
  });
}

// 为不同环境创建构建任务
task('example:build-dev', createEnvironmentBuild('development'));
task('example:build-staging', createEnvironmentBuild('staging'));
task('example:build-prod', createEnvironmentBuild('production'));

// 构建所有环境
task('example:build-all', parallel(
  createEnvironmentBuild('development'),
  createEnvironmentBuild('staging'),
  createEnvironmentBuild('production')
));

// ===== 主要任务 =====

// 开发环境任务
task('dev', series('example:replace', 'example:rename'));

// 构建任务
task('build', series('example:simple-build', 'example:compress'));

// 部署任务（需要配置真实服务器）
task('deploy', series('build', 'example:git-commit', 'example:upload-sftp', 'example:ssh'));

// 完整流水线
task('full-pipeline', series('example:complex-deploy'));

// 默认任务
task('default', series('build'));

export default buildTools;