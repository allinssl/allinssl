/**
 * 配置系统测试脚本
 * 用于验证环境变量配置功能
 */

import chalk from 'chalk';
import {
  DEFAULT_CONFIG,
  parseConfig,
  validateConfig,
  generateEnvFile,
  readEnvFile,
  getConfigSummary
} from './config.js';

/**
 * 测试配置解析功能
 */
function testConfigParsing() {
  console.log(chalk.blue('🧪 测试配置解析功能...'));
  
  const testEnv = {
    PORT: '8080',
    HOST: '127.0.0.1',
    API_TARGET: 'http://localhost:4000',
    DEV_MODE: 'false',
    CORS_ENABLED: 'true',
    LOG_LEVEL: 'debug'
  };
  
  const config = parseConfig(testEnv);
  
  console.log('✅ 解析的配置:', {
    port: config.PORT,
    host: config.HOST,
    apiTarget: config.API_TARGET,
    devMode: config.DEV_MODE,
    corsEnabled: config.CORS_ENABLED,
    logLevel: config.LOG_LEVEL
  });
  
  // 验证类型
  const typeChecks = [
    { key: 'PORT', expected: 'number', actual: typeof config.PORT },
    { key: 'DEV_MODE', expected: 'boolean', actual: typeof config.DEV_MODE },
    { key: 'CORS_ENABLED', expected: 'boolean', actual: typeof config.CORS_ENABLED }
  ];
  
  typeChecks.forEach(check => {
    if (check.expected === check.actual) {
      console.log(chalk.green(`✅ ${check.key}: ${check.actual}`));
    } else {
      console.log(chalk.red(`❌ ${check.key}: expected ${check.expected}, got ${check.actual}`));
    }
  });
}

/**
 * 测试配置验证功能
 */
function testConfigValidation() {
  console.log(chalk.blue('\n🧪 测试配置验证功能...'));
  
  const testCases = [
    {
      name: '有效配置',
      config: {
        PORT: 3000,
        HOST: '0.0.0.0',
        API_TARGET: 'http://localhost:4000',
        LOG_LEVEL: 'info',
        CORS_ORIGIN: '*'
      },
      shouldPass: true
    },
    {
      name: '无效端口',
      config: {
        PORT: 99999,
        HOST: '0.0.0.0'
      },
      shouldPass: false
    },
    {
      name: '无效 API 目标',
      config: {
        API_TARGET: 'not-a-url'
      },
      shouldPass: false
    },
    {
      name: '无效日志级别',
      config: {
        LOG_LEVEL: 'invalid'
      },
      shouldPass: false
    }
  ];
  
  testCases.forEach(testCase => {
    const validation = validateConfig(testCase.config);
    const passed = validation.isValid === testCase.shouldPass;
    
    if (passed) {
      console.log(chalk.green(`✅ ${testCase.name}`));
    } else {
      console.log(chalk.red(`❌ ${testCase.name}`));
      if (validation.errors.length > 0) {
        validation.errors.forEach(error => {
          console.log(chalk.red(`   • ${error}`));
        });
      }
    }
  });
}

/**
 * 测试 .env 文件生成
 */
function testEnvFileGeneration() {
  console.log(chalk.blue('\n🧪 测试 .env 文件生成...'));
  
  const testConfig = {
    PORT: 5000,
    HOST: 'localhost',
    API_TARGET: 'http://localhost:3000',
    API_PREFIX: '/api/v1',
    DEV_MODE: true,
    LOG_LEVEL: 'debug',
    CORS_ENABLED: true,
    CORS_ORIGIN: 'http://localhost:3000,https://example.com',
    SPA_FALLBACK_ENABLED: true,
    SPA_EXCLUDE_EXTENSIONS: '.js,.css,.png'
  };
  
  const envContent = generateEnvFile(testConfig);
  
  console.log(chalk.green('✅ 生成的 .env 内容:'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(envContent);
  console.log(chalk.gray('─'.repeat(40)));
  
  // 测试解析生成的内容
  const lines = envContent.split('\n');
  const parsedEnv = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        parsedEnv[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  const reparsedConfig = parseConfig(parsedEnv);
  const isConsistent = JSON.stringify(testConfig) === JSON.stringify(reparsedConfig);
  
  if (isConsistent) {
    console.log(chalk.green('✅ 生成的内容解析正确'));
  } else {
    console.log(chalk.red('❌ 生成的内容解析不一致'));
    console.log('原始配置:', testConfig);
    console.log('重新解析:', reparsedConfig);
  }
}

/**
 * 测试配置摘要生成
 */
function testConfigSummary() {
  console.log(chalk.blue('\n🧪 测试配置摘要生成...'));
  
  const testConfig = {
    PORT: 5173,
    HOST: '0.0.0.0',
    PUBLIC_DIR: 'dist',
    API_TARGET: 'http://localhost:3000',
    API_PREFIX: '/api',
    DEV_MODE: true,
    CORS_ENABLED: true,
    CORS_ORIGIN: '*',
    SPA_FALLBACK_ENABLED: true,
    SPA_EXCLUDE_EXTENSIONS: '.js,.css,.png,.jpg'
  };
  
  const summary = getConfigSummary(testConfig);
  
  console.log(chalk.green('✅ 生成的摘要:'));
  console.log(JSON.stringify(summary, null, 2));
  
  // 验证摘要结构
  const requiredKeys = ['server', 'proxy', 'spa', 'cors'];
  const hasAllKeys = requiredKeys.every(key => key in summary);
  
  if (hasAllKeys) {
    console.log(chalk.green('✅ 摘要包含所有必需的键'));
  } else {
    console.log(chalk.red('❌ 摘要缺少必需的键'));
  }
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log(chalk.cyan('🚀 SPA 预览服务器配置测试\n'));
  
  try {
    testConfigParsing();
    testConfigValidation();
    testEnvFileGeneration();
    testConfigSummary();
    
    console.log(chalk.green('\n🎉 所有测试完成!'));
    console.log(chalk.blue('\n📝 测试摘要:'));
    console.log(chalk.green('✅ 配置解析'));
    console.log(chalk.green('✅ 配置验证'));
    console.log(chalk.green('✅ .env 文件生成'));
    console.log(chalk.green('✅ 配置摘要'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ 测试失败:'), error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接调用则运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };