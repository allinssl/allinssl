/**
 * 增强的 Express 服务器，用于 SPA 预览和可配置的反向代理支持
 *
 * 功能特性:
 * - 基于环境变量的配置
 * - 从可配置目录提供静态资源服务
 * - 增强的单页应用 (SPA) 回退机制，支持路由排除
 * - 可配置的 API 请求反向代理
 * - 支持可配置源的 CORS
 * - 改进的日志记录和错误处理
 *
 * 使用方法:
 *  - 通过 .env 文件或环境变量进行配置
 *  - node src/server.js
 *  - 或使用 package.json 脚本: pnpm dev
 */

import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import dotenv from "dotenv";
import chalk from "chalk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 .env 文件加载环境变量
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

/**
 * 解析相对于项目根目录的路径
 * @param {...string} segs - 路径片段
 * @returns {string} 解析后的路径
 */
function r(...segs) {
  return path.resolve(__dirname, "..", ...segs);
}

/**
 * 配置对象，包含环境变量默认值
 */
const config = {
  // 服务器配置
  port: Number(process.env.PORT) || 5173,
  host: process.env.HOST || "0.0.0.0",

  // 静态文件配置
  publicDir: process.env.PUBLIC_DIR || "public",
  fallbackFile: process.env.FALLBACK_FILE || "index.html",

  // API 代理配置
  apiTarget: process.env.API_TARGET || "",
  apiPrefix: process.env.API_PREFIX || "/api",
  apiProxyMode: process.env.API_PROXY_MODE || "prefix", // 'prefix' 或 'include'

  // 开发配置
  devMode:
    process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development",
  logLevel: process.env.LOG_LEVEL || "info",

  // CORS 配置
  corsEnabled: process.env.CORS_ENABLED !== "false",
  corsOrigin: process.env.CORS_ORIGIN || "*",

  // SPA 路由配置
  spaFallbackEnabled: process.env.SPA_FALLBACK_ENABLED !== "false",
  spaExcludeExtensions: (
    process.env.SPA_EXCLUDE_EXTENSIONS ||
    ".js,.css,.png,.jpg,.jpeg,.gif,.svg,.ico,.woff,.woff2,.ttf,.eot"
  )
    .split(",")
    .map((ext) => ext.trim()),
};

/**
 * 不同级别的日志工具
 */
const logger = {
  info: (message, ...args) => {
    if (["info", "debug"].includes(config.logLevel)) {
      console.log(chalk.blue("[INFO]"), message, ...args);
    }
  },
  warn: (message, ...args) => {
    if (["info", "warn", "debug"].includes(config.logLevel)) {
      console.warn(chalk.yellow("[WARN]"), message, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(chalk.red("[ERROR]"), message, ...args);
  },
  debug: (message, ...args) => {
    if (config.logLevel === "debug") {
      console.log(chalk.gray("[DEBUG]"), message, ...args);
    }
  },
};

const app = express();

// 如果配置了 CORS 则启用
if (config.corsEnabled) {
  const corsOptions = {
    origin:
      config.corsOrigin === "*"
        ? true
        : config.corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  };
  app.use(cors(corsOptions));
  logger.debug("CORS enabled with origin:", config.corsOrigin);
}

// 静态文件目录设置
const publicDir = r(config.publicDir);
const fallbackIndex = r(config.publicDir, config.fallbackFile);

/**
 * 确保 public 文件夹存在，如果缺少则创建基本的 index.html
 */
function ensurePublicDirectory() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    logger.info("Created public directory:", publicDir);
  }

  if (!fs.existsSync(fallbackIndex)) {
    const defaultContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>SPA Preview Server</title>
  <style>
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 2rem;
      line-height: 1.6;
      background: #0f172a;
      color: #e2e8f0;
      max-width: 800px;
      margin: 0 auto;
    }
    .container { background: #1e293b; padding: 2rem; border-radius: 8px; }
    .status { color: #10b981; }
    .config { background: #374151; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
    code { background: #4b5563; padding: 0.2rem 0.4rem; border-radius: 3px; }
    a { color: #93c5fd; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 SPA Preview Server</h1>
    <p class="status">✅ Server is running successfully!</p>
    
    <h2>Configuration</h2>
    <div class="config">
      <p><strong>Server:</strong> http://${config.host}:${config.port}</p>
      <p><strong>Public Directory:</strong> <code>${config.publicDir}</code></p>
      <p><strong>API Proxy:</strong> ${
        config.apiTarget
          ? `<code>${config.apiPrefix}</code> → <code>${config.apiTarget}</code>`
          : "Disabled"
      }</p>
      <p><strong>SPA Fallback:</strong> ${
        config.spaFallbackEnabled ? "Enabled" : "Disabled"
      }</p>
    </div>
    
    <h2>Getting Started</h2>
    <ol>
      <li>Place your built SPA files into <code>apps/spa-preview/${
        config.publicDir
      }</code></li>
      <li>Configure API proxy in <code>.env</code> file if needed</li>
      <li>Your SPA routes will be handled automatically</li>
    </ol>
    
    <p><a href="https://github.com/your-repo" target="_blank">📖 Documentation</a></p>
  </div>
</body>
</html>`;

    fs.writeFileSync(fallbackIndex, defaultContent);
    logger.info("Created default index.html:", fallbackIndex);
  }
}

ensurePublicDirectory();

// 提供静态资源服务
app.use(
  express.static(publicDir, {
    index: false,
    fallthrough: true,
    setHeaders: (res, path) => {
      // 在生产环境中为静态资源添加缓存头
      if (!config.devMode) {
        if (
          path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
        ) {
          res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
        }
      }
    },
  })
);

// 为 API 请求设置反向代理
if (config.apiTarget) {
  const proxyOptions = {
    target: config.apiTarget,
    changeOrigin: true,
    pathRewrite: (pathStr) => {
      let rewritten = pathStr;

      // 根据代理模式处理路径
      if (config.apiProxyMode === "prefix") {
        // 路径替换模式：移除前缀
        rewritten = pathStr.replace(new RegExp(`^${config.apiPrefix}`), "");
      }
      // 路径包含模式不修改路径

      logger.debug(`Proxy rewrite: ${pathStr} → ${rewritten}`);
      return rewritten;
    },
    logLevel: config.logLevel === "debug" ? "debug" : "warn",
    onProxyReq: (proxyReq, req) => {
      logger.debug(`Proxying ${req.method} ${req.url} to ${config.apiTarget}`);
    },
    onError: (err, req, res) => {
      logger.error("Proxy error:", err.message);
      res.status(500).json({ error: "Proxy error", message: err.message });
    },
  };

  // 根据代理模式设置中间件
  if (config.apiProxyMode === "prefix") {
    // 路径替换模式：只代理特定前缀的请求
    app.use(config.apiPrefix, createProxyMiddleware(proxyOptions));
    logger.info(
      `API proxy enabled (prefix mode): ${config.apiPrefix} → ${config.apiTarget}`
    );
  } else if (config.apiProxyMode === "include") {
    // 路径包含模式：代理所有包含特定路径的请求
    const pathFilter = (path) => path.includes(config.apiPrefix);
    app.use(pathFilter, createProxyMiddleware(proxyOptions));
    logger.info(
      `API proxy enabled (include mode): paths containing '${config.apiPrefix}' → ${config.apiTarget}`
    );
  }
} else {
  logger.info("API proxy disabled (set API_TARGET to enable)");
}

/**
 * 增强的 SPA 回退中间件
 * 通过为非文件请求提供 index.html 来处理客户端路由
 */
if (config.spaFallbackEnabled) {
  app.get("*", (req, res, next) => {
    const requestPath = req.path;
    const fileExtension = path.extname(requestPath);

    // 如果请求有应该从 SPA 回退中排除的扩展名，则跳过
    if (fileExtension && config.spaExcludeExtensions.includes(fileExtension)) {
      logger.debug(`Skipping SPA fallback for file: ${requestPath}`);
      return next();
    }

    // 跳过 API 路由
    if (
      config.apiProxyMode === "prefix" &&
      requestPath.startsWith(config.apiPrefix)
    ) {
      return next();
    } else if (
      config.apiProxyMode === "include" &&
      requestPath.includes(config.apiPrefix)
    ) {
      return next();
    }

    logger.debug(`SPA fallback serving index.html for: ${requestPath}`);
    res.sendFile(fallbackIndex, (err) => {
      if (err) {
        logger.error("Error serving fallback index.html:", err.message);
        res.status(500).send("Internal Server Error");
      }
    });
  });

  logger.info("SPA fallback enabled");
}

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// 404 处理器
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Not Found", path: req.url });
});

// 启动服务器
app.listen(config.port, config.host, () => {
  console.log(chalk.green("🚀 SPA Preview Server Started"));
  console.log(chalk.cyan(`📍 Server: http://${config.host}:${config.port}`));
  console.log(chalk.cyan(`📁 Public: ${publicDir}`));

  if (config.apiTarget) {
    console.log(
      chalk.cyan(`🔄 Proxy: ${config.apiPrefix} → ${config.apiTarget}`)
    );
  }

  if (config.devMode) {
    console.log(chalk.yellow("🔧 Development mode enabled"));
  }

  console.log(chalk.gray("Press Ctrl+C to stop"));
});

// 优雅关闭
process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
