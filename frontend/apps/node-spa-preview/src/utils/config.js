/**
 * SPA 预览服务器的配置工具
 * 用于管理和验证环境变量配置
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 默认配置值
 */
export const DEFAULT_CONFIG = {
  // 服务器配置
  PORT: 5173,
  HOST: '0.0.0.0',
  
  // 静态文件配置
  PUBLIC_DIR: 'public',
  FALLBACK_FILE: 'index.html',
  
  // API 代理配置
  API_TARGET: '',
  API_PREFIX: '/api',
  API_PROXY_MODE: 'prefix', // 'prefix' 或 'include'
  
  // 开发配置
  DEV_MODE: true,
  LOG_LEVEL: 'info',
  
  // CORS 配置
  CORS_ENABLED: true,
  CORS_ORIGIN: '*',
  
  // SPA 路由配置
  SPA_FALLBACK_ENABLED: true,
  SPA_EXCLUDE_EXTENSIONS: '.js,.css,.png,.jpg,.jpeg,.gif,.svg,.ico,.woff,.woff2,.ttf,.eot'
};

/**
 * 配置验证规则
 */
export const CONFIG_VALIDATORS = {
  PORT: (value) => {
    const port = Number(value);
    return port > 0 && port <= 65535 ? null : '端口必须在 1 到 65535 之间';
  },
  
  HOST: (value) => {
    const validHosts = ['0.0.0.0', 'localhost', '127.0.0.1'];
    const isValidIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value);
    return validHosts.includes(value) || isValidIP ? null : '无效的主机地址';
  },
  
  API_TARGET: (value) => {
    if (!value) return null; // 可选项
    const urlPattern = /^https?:\/\/.+/;
    return urlPattern.test(value) ? null : 'API_TARGET 必须是有效的 HTTP/HTTPS URL';
  },
  
  API_PROXY_MODE: (value) => {
    const validModes = ['prefix', 'include'];
    return validModes.includes(value) ? null : `API_PROXY_MODE 必须是以下值之一: ${validModes.join(', ')}`;
  },
  
  LOG_LEVEL: (value) => {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    return validLevels.includes(value) ? null : `LOG_LEVEL 必须是以下值之一: ${validLevels.join(', ')}`;
  },
  
  CORS_ORIGIN: (value) => {
    if (value === '*') return null;
    const origins = value.split(',').map(o => o.trim());
    const urlPattern = /^https?:\/\/.+/;
    const invalidOrigins = origins.filter(origin => !urlPattern.test(origin));
    return invalidOrigins.length === 0 ? null : `无效的 CORS 源: ${invalidOrigins.join(', ')}`;
  }
};

/**
 * 解析环境变量配置
 * @param {object} env - 环境变量对象
 * @returns {object} 解析后的配置对象
 */
export function parseConfig(env = process.env) {
  const config = {};
  
  // 解析每个配置值
  Object.keys(DEFAULT_CONFIG).forEach(key => {
    const envValue = env[key];
    const defaultValue = DEFAULT_CONFIG[key];
    
    if (envValue !== undefined) {
      // 解析布尔值
      if (typeof defaultValue === 'boolean') {
        config[key] = envValue === 'true';
      }
      // 解析数字值
      else if (typeof defaultValue === 'number') {
        config[key] = Number(envValue) || defaultValue;
      }
      // 字符串值
      else {
        config[key] = envValue;
      }
    } else {
      config[key] = defaultValue;
    }
  });
  
  return config;
}

/**
 * 验证配置
 * @param {object} config - 配置对象
 * @returns {object} 验证结果 { isValid: boolean, errors: string[] }
 */
export function validateConfig(config) {
  const errors = [];
  
  Object.keys(CONFIG_VALIDATORS).forEach(key => {
    const validator = CONFIG_VALIDATORS[key];
    const value = config[key];
    
    if (value !== undefined && value !== null && value !== '') {
      const error = validator(value);
      if (error) {
        errors.push(`${key}: ${error}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 生成 .env 文件内容
 * @param {object} config - 配置对象
 * @returns {string} .env 文件内容
 */
export function generateEnvFile(config) {
  // 与默认值合并以确保所有值都存在
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const lines = [
    '# SPA 预览服务器配置',
    '# 生成时间: ' + new Date().toISOString(),
    '',
    '# 服务器配置',
    `PORT=${fullConfig.PORT}`,
    `HOST=${fullConfig.HOST}`,
    '',
    '# 静态文件配置',
    `PUBLIC_DIR=${fullConfig.PUBLIC_DIR}`,
    `FALLBACK_FILE=${fullConfig.FALLBACK_FILE}`,
    '',
    '# API 代理配置',
    `API_TARGET=${fullConfig.API_TARGET}`,
    `API_PREFIX=${fullConfig.API_PREFIX}`,
    '',
    '# 开发配置',
    `DEV_MODE=${fullConfig.DEV_MODE}`,
    `LOG_LEVEL=${fullConfig.LOG_LEVEL}`,
    '',
    '# CORS 配置',
    `CORS_ENABLED=${fullConfig.CORS_ENABLED}`,
    `CORS_ORIGIN=${fullConfig.CORS_ORIGIN}`,
    '',
    '# SPA 路由配置',
    `SPA_FALLBACK_ENABLED=${fullConfig.SPA_FALLBACK_ENABLED}`,
    `SPA_EXCLUDE_EXTENSIONS=${fullConfig.SPA_EXCLUDE_EXTENSIONS}`
  ];
  
  return lines.join('\n');
}

/**
 * 读取 .env 文件
 * @param {string} envPath - .env 文件路径
 * @returns {object} 环境变量对象
 */
export function readEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

/**
 * 写入 .env 文件
 * @param {string} envPath - .env 文件路径
 * @param {object} config - 配置对象
 */
export function writeEnvFile(envPath, config) {
  const content = generateEnvFile(config);
  fs.writeFileSync(envPath, content, 'utf8');
}

/**
 * 获取配置摘要信息
 * @param {object} config - 配置对象
 * @returns {object} 配置摘要
 */
export function getConfigSummary(config) {
  return {
    server: {
      url: `http://${config.HOST}:${config.PORT}`,
      publicDir: config.PUBLIC_DIR,
      devMode: config.DEV_MODE
    },
    proxy: {
      enabled: !!config.API_TARGET,
      target: config.API_TARGET,
      prefix: config.API_PREFIX
    },
    spa: {
      fallbackEnabled: config.SPA_FALLBACK_ENABLED,
      excludeExtensions: config.SPA_EXCLUDE_EXTENSIONS.split(',').length
    },
    cors: {
      enabled: config.CORS_ENABLED,
      origin: config.CORS_ORIGIN
    }
  };
}