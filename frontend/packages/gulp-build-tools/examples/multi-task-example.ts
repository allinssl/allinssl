import { createBuildTools, multiTaskOperations, parallelOperations } from '../src/index.js';
import { task, series, parallel } from 'gulp';

// 创建构建工具实例
const buildTools = createBuildTools({
  verbose: true
});

// ===== Git 多任务示例 =====

// 串行执行多个 Git 操作
task('git:multi-serial', buildTools.multiGitOperation([
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
task('git:multi-parallel', buildTools.multiGitOperation([
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
  },
  {
    action: 'pull',
    repoPath: '/path/to/repo3',
    remote: 'upstream',
    branch: 'main'
  }
], true)); // true = 并行执行

// ===== 多服务器上传示例 =====

// 串行上传到多个服务器
task('upload:multi-serial', buildTools.multiUpload([
  {
    type: 'sftp',
    host: 'server1.example.com',
    username: 'deploy',
    privateKey: '/path/to/key1',
    remotePath: '/var/www/app',
    src: 'dist/**/*',
    clean: true
  },
  {
    type: 'sftp',
    host: 'server2.example.com',
    username: 'deploy',
    privateKey: '/path/to/key2',
    remotePath: '/var/www/app',
    src: 'dist/**/*',
    clean: true
  }
], false));

// 并行上传到多个服务器
task('upload:multi-parallel', buildTools.multiUpload([
  {
    type: 'sftp',
    host: 'server1.example.com',
    username: 'deploy',
    password: 'password1',
    remotePath: '/var/www/app',
    src: 'dist/**/*',
    parallel: true
  },
  {
    type: 'ftp',
    host: 'server2.example.com',
    username: 'deploy',
    password: 'password2',
    remotePath: '/public_html',
    src: 'dist/**/*'
  },
  {
    type: 'sftp',
    host: 'server3.example.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    remotePath: '/var/www/app',
    src: 'dist/**/*',
    clean: false
  }
], true)); // 并行上传到 3 个服务器

// ===== 多 SSH 任务示例 =====

// 串行执行多个 SSH 任务
task('ssh:multi-serial', buildTools.multiSSHExecution([
  {
    host: 'server1.example.com',
    username: 'deploy',
    privateKey: '/path/to/key',
    commands: [
      'cd /var/www/app',
      'npm install --production',
      'pm2 restart app'
    ],
    verbose: true
  },
  {
    host: 'server2.example.com',
    username: 'deploy',
    password: 'password',
    commands: [
      'sudo systemctl restart nginx',
      'sudo systemctl status nginx'
    ]
  }
], false));

// 并行执行多个 SSH 任务
task('ssh:multi-parallel', buildTools.multiSSHExecution([
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
], true)); // 并行执行，提高部署效率

// ===== 复合部署流水线示例 =====

// 生产环境多服务器部署
task('deploy:production', series(
  // 1. 构建和压缩
  buildTools.replaceContent({
    src: 'src/**/*.js',
    replacements: [
      { search: '{{ENV}}', replace: 'production' },
      { search: '{{VERSION}}', replace: '2.0.0' }
    ],
    dest: 'dist'
  }),
  
  buildTools.compressFiles({
    src: 'dist/**/*',
    filename: 'production-release.zip',
    dest: 'releases'
  }),

  // 2. Git 操作
  buildTools.multiGitOperation([
    {
      action: 'commit',
      message: 'Production release 2.0.0',
      files: '.'
    },
    {
      action: 'push',
      remote: 'origin',
      branch: 'main'
    }
  ]),

  // 3. 并行上传到多个生产服务器
  buildTools.multiUpload([
    {
      type: 'sftp',
      host: 'prod-web1.example.com',
      username: 'deploy',
      privateKey: '/path/to/prod-key',
      remotePath: '/var/www/app',
      src: 'dist/**/*',
      clean: true
    },
    {
      type: 'sftp',
      host: 'prod-web2.example.com',
      username: 'deploy',
      privateKey: '/path/to/prod-key',
      remotePath: '/var/www/app',
      src: 'dist/**/*',
      clean: true
    },
    {
      type: 'sftp',
      host: 'prod-api.example.com',
      username: 'deploy',
      privateKey: '/path/to/prod-key',
      remotePath: '/var/www/api',
      src: 'dist/**/*',
      clean: true
    }
  ], true),

  // 4. 并行重启所有服务
  buildTools.multiSSHExecution([
    {
      host: 'prod-web1.example.com',
      username: 'deploy',
      privateKey: '/path/to/prod-key',
      commands: [
        'pm2 restart web-app',
        'sudo nginx -s reload'
      ]
    },
    {
      host: 'prod-web2.example.com',
      username: 'deploy',
      privateKey: '/path/to/prod-key',
      commands: [
        'pm2 restart web-app',
        'sudo nginx -s reload'
      ]
    },
    {
      host: 'prod-api.example.com',
      username: 'deploy',
      privateKey: '/path/to/prod-key',
      commands: [
        'pm2 restart api-app',
        'curl -f http://localhost:3000/health'
      ]
    }
  ], true)
));

// 开发环境多分支同步
task('sync:dev-branches', buildTools.multiGitOperation([
  {
    action: 'checkout',
    branch: 'develop'
  },
  {
    action: 'pull',
    remote: 'origin',
    branch: 'develop'
  },
  {
    action: 'checkout',
    branch: 'feature/new-ui'
  },
  {
    action: 'merge',
    branch: 'develop'
  }
]));

// 多环境部署
task('deploy:multi-env', parallel(
  // 测试环境
  series(
    buildTools.replaceContent({
      src: 'src/**/*.js',
      replacements: [{ search: '{{ENV}}', replace: 'testing' }],
      dest: 'dist-test'
    }),
    buildTools.uploadFiles({
      type: 'sftp',
      host: 'test.example.com',
      username: 'deploy',
      password: 'test-password',
      remotePath: '/var/www/test',
      src: 'dist-test/**/*'
    })
  ),
  
  // 预发布环境
  series(
    buildTools.replaceContent({
      src: 'src/**/*.js',
      replacements: [{ search: '{{ENV}}', replace: 'staging' }],
      dest: 'dist-staging'
    }),
    buildTools.uploadFiles({
      type: 'sftp',
      host: 'staging.example.com',
      username: 'deploy',
      privateKey: '/path/to/staging-key',
      remotePath: '/var/www/staging',
      src: 'dist-staging/**/*'
    })
  )
));

// 备份和清理任务
task('maintenance:backup-and-clean', buildTools.multiSSHExecution([
  {
    host: 'server1.example.com',
    username: 'admin',
    privateKey: '/path/to/admin-key',
    commands: [
      'mysqldump -u root -p myapp > /backups/myapp_$(date +%Y%m%d).sql',
      'find /var/log -name "*.log" -mtime +7 -delete',
      'docker system prune -f'
    ],
    verbose: true
  },
  {
    host: 'server2.example.com',
    username: 'admin',
    privateKey: '/path/to/admin-key',
    commands: [
      'tar -czf /backups/www_$(date +%Y%m%d).tar.gz /var/www',
      'find /tmp -mtime +3 -delete',
      'pm2 flush'
    ],
    verbose: true
  }
], true));

// 健康检查任务
task('health:check-all', buildTools.multiSSHExecution([
  {
    host: 'web1.example.com',
    username: 'monitor',
    privateKey: '/path/to/monitor-key',
    commands: [
      'df -h',
      'free -m',
      'pm2 status',
      'curl -f http://localhost/health'
    ]
  },
  {
    host: 'web2.example.com',
    username: 'monitor',
    privateKey: '/path/to/monitor-key',
    commands: [
      'df -h',
      'free -m',
      'pm2 status',
      'curl -f http://localhost/health'
    ]
  },
  {
    host: 'db.example.com',
    username: 'monitor',
    privateKey: '/path/to/monitor-key',
    commands: [
      'df -h',
      'free -m',
      'systemctl status mysql',
      'mysql -e "SHOW PROCESSLIST;"'
    ]
  }
], true));

// 默认任务
task('default', series('deploy:production'));

export default buildTools;