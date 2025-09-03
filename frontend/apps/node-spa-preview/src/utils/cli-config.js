#!/usr/bin/env node
/**
 * SPA 预览服务器的命令行配置工具
 * 用于交互式管理环境变量
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import chalk from 'chalk';
import {
  DEFAULT_CONFIG,
  parseConfig,
  validateConfig,
  generateEnvFile,
  readEnvFile,
  getConfigSummary
} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建 readline 接口
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 询问用户输入
 * @param {string} question - 问题
 * @param {string} defaultValue - 默认值
 * @returns {Promise<string>} 用户输入
 */
function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const rl = createInterface();
    const prompt = defaultValue 
      ? `${question} ${chalk.gray(`(default: ${defaultValue})`)}: `
      : `${question}: `;
    
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * 询问是/否问题
 * @param {string} question - 问题
 * @param {boolean} defaultValue - 默认值
 * @returns {Promise<boolean>} 用户选择
 */
function askYesNo(question, defaultValue = true) {
  return new Promise((resolve) => {
    const rl = createInterface();
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const prompt = `${question} ${chalk.gray(`(${defaultText})`)}: `;
    
    rl.question(prompt, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === '') {
        resolve(defaultValue);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

/**
 * 显示配置摘要
 * @param {object} config - 配置对象
 */
function displayConfigSummary(config) {
  const summary = getConfigSummary(config);
  
  console.log(chalk.cyan('\n📋 配置摘要:'));
  console.log(chalk.cyan('─'.repeat(50)));
  
  console.log(chalk.yellow('🖥️  Server:'));
  console.log(`   URL: ${chalk.green(summary.server.url)}`);
  console.log(`   Public Directory: ${chalk.green(summary.server.publicDir)}`);
  console.log(`   Development Mode: ${summary.server.devMode ? chalk.green('Enabled') : chalk.red('Disabled')}`);
  
  console.log(chalk.yellow('\n🔄 API Proxy:'));
  if (summary.proxy.enabled) {
    console.log(`   Status: ${chalk.green('Enabled')}`);
    console.log(`   Target: ${chalk.green(summary.proxy.target)}`);
    console.log(`   Prefix: ${chalk.green(summary.proxy.prefix)}`);
  } else {
    console.log(`   Status: ${chalk.red('Disabled')}`);
  }
  
  console.log(chalk.yellow('\n🛣️  SPA Routing:'));
  console.log(`   Fallback: ${summary.spa.fallbackEnabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
  console.log(`   Excluded Extensions: ${chalk.green(summary.spa.excludeExtensions)} types`);
  
  console.log(chalk.yellow('\n🌐 CORS:'));
  console.log(`   Status: ${summary.cors.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`);
  console.log(`   Origin: ${chalk.green(summary.cors.origin)}`);
  
  console.log(chalk.cyan('─'.repeat(50)));
}

/**
 * 交互式配置向导
 * @returns {Promise<object>} 配置对象
 */
async function configWizard() {
  console.log(chalk.blue('🚀 SPA 预览服务器配置向导'));
  console.log(chalk.gray('按 Enter 键使用默认值\n'));
  
  const config = {};
  
  // 服务器配置
  console.log(chalk.yellow('📡 服务器配置:'));
  config.PORT = await askQuestion('端口', DEFAULT_CONFIG.PORT.toString());
  config.HOST = await askQuestion('主机地址', DEFAULT_CONFIG.HOST);
  
  // 静态文件配置
  console.log(chalk.yellow('\n📁 静态文件配置:'));
  config.PUBLIC_DIR = await askQuestion('公共目录', DEFAULT_CONFIG.PUBLIC_DIR);
  config.FALLBACK_FILE = await askQuestion('回退文件', DEFAULT_CONFIG.FALLBACK_FILE);
  
  // API 代理配置
  console.log(chalk.yellow('\n🔄 API 代理配置:'));
  const enableProxy = await askYesNo('启用 API 代理?', false);
  if (enableProxy) {
    config.API_TARGET = await askQuestion('API 目标 URL (例如: http://localhost:3000)');
    config.API_PREFIX = await askQuestion('API 前缀', DEFAULT_CONFIG.API_PREFIX);
  } else {
    config.API_TARGET = '';
    config.API_PREFIX = DEFAULT_CONFIG.API_PREFIX;
  }
  
  // 开发配置
  console.log(chalk.yellow('\n🔧 开发配置:'));
  config.DEV_MODE = await askYesNo('启用开发模式?', DEFAULT_CONFIG.DEV_MODE);
  const logLevels = ['debug', 'info', 'warn', 'error'];
  console.log(`可用的日志级别: ${logLevels.join(', ')}`);
  config.LOG_LEVEL = await askQuestion('日志级别', DEFAULT_CONFIG.LOG_LEVEL);
  
  // CORS 配置
  console.log(chalk.yellow('\n🌐 CORS 配置:'));
  config.CORS_ENABLED = await askYesNo('启用 CORS?', DEFAULT_CONFIG.CORS_ENABLED);
  if (config.CORS_ENABLED) {
    config.CORS_ORIGIN = await askQuestion('CORS 源地址 (* 表示所有，或逗号分隔的 URL)', DEFAULT_CONFIG.CORS_ORIGIN);
  } else {
    config.CORS_ORIGIN = DEFAULT_CONFIG.CORS_ORIGIN;
  }
  
  // SPA 路由配置
  console.log(chalk.yellow('\n🛣️  SPA 路由配置:'));
  config.SPA_FALLBACK_ENABLED = await askYesNo('启用 SPA 回退?', DEFAULT_CONFIG.SPA_FALLBACK_ENABLED);
  if (config.SPA_FALLBACK_ENABLED) {
    config.SPA_EXCLUDE_EXTENSIONS = await askQuestion(
      '排除的文件扩展名 (逗号分隔)',
      DEFAULT_CONFIG.SPA_EXCLUDE_EXTENSIONS
    );
  } else {
    config.SPA_EXCLUDE_EXTENSIONS = DEFAULT_CONFIG.SPA_EXCLUDE_EXTENSIONS;
  }
  
  return config;
}

/**
 * 主函数
 */
async function main() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  
  try {
    console.log(chalk.blue('🔧 SPA 预览服务器配置工具\n'));
    
    // 检查 .env 文件是否存在
    const envExists = fs.existsSync(envPath);
    if (envExists) {
      console.log(chalk.green('✅ 发现现有的 .env 文件'));
      const useExisting = await askYesNo('加载现有配置?', true);
      
      if (useExisting) {
        const existingEnv = readEnvFile(envPath);
        const existingConfig = parseConfig(existingEnv);
        
        console.log(chalk.blue('\n📖 当前配置:'));
        displayConfigSummary(existingConfig);
        
        const modify = await askYesNo('\n修改配置?', false);
        if (!modify) {
          console.log(chalk.green('\n✅ 配置未更改'));
          return;
        }
      }
    }
    
    // 运行配置向导
    const config = await configWizard();
    
    // 验证配置
    const validation = validateConfig(config);
    if (!validation.isValid) {
      console.log(chalk.red('\n❌ 配置验证失败:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
      
      const continueAnyway = await askYesNo('\n仍然保存配置?', false);
      if (!continueAnyway) {
        console.log(chalk.yellow('\n⚠️  配置已取消'));
        return;
      }
    }
    
    // 显示摘要
    displayConfigSummary(config);
    
    // 确认保存
    const confirmSave = await askYesNo('\n保存此配置?', true);
    if (!confirmSave) {
      console.log(chalk.yellow('\n⚠️  配置已取消'));
      return;
    }
    
    // 保存配置
    const envContent = generateEnvFile(config);
    fs.writeFileSync(envPath, envContent, 'utf8');
    
    console.log(chalk.green(`\n✅ 配置已保存到 ${envPath}`));
    
    // 如果不存在则创建 .env.example
    if (!fs.existsSync(envExamplePath)) {
      const exampleConfig = { ...DEFAULT_CONFIG };
      const exampleContent = generateEnvFile(exampleConfig);
      fs.writeFileSync(envExamplePath, exampleContent, 'utf8');
      console.log(chalk.green(`✅ 示例配置已保存到 ${envExamplePath}`));
    }
    
    console.log(chalk.blue('\n🚀 现在可以使用以下命令启动服务器:'));
    console.log(chalk.cyan('   node src/server.js'));
    console.log(chalk.cyan('   # 或者'));
    console.log(chalk.cyan('   pnpm dev'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ 错误:'), error.message);
    process.exit(1);
  }
}

// 如果直接调用则运行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as configWizard };