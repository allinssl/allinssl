#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { glob } = require('fast-glob');
const terser = require('terser');
const postcss = require('postcss');
const cssnano = require('cssnano');
const htmlMinifier = require('html-minifier-terser');
const sharp = require('sharp');
const { optimize: svgoOptimize } = require('svgo');

// ================= 配置 =================
const TERSER_OPTIONS = {
  mangle: { toplevel: false },   // 不混淆顶层作用域，保证全局调用安全
  compress: {
    defaults: true,
    drop_console: false,         // 保留 console（如需要可改为 true）
  },
  output: { comments: false },
};

const CSSNANO_PRESET = 'default'; // 使用 cssnano 的默认优化预设

const HTML_MINIFIER_OPTIONS = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  minifyJS: { mangle: { toplevel: false } }, // 内联 JS 同样保护顶层变量
  minifyCSS: true,
};

const MAX_LOOP = 12; // 防止极端情况下死循环

// ================= 工具函数 =================

/**
 * 文本压缩器统一入口
 * @param {string} code 原始内容
 * @param {'js'|'css'|'html'|'json'} type
 * @returns {Promise<string>}
 */
async function compressText(code, type) {
  switch (type) {
    case 'js':
      return (await terser.minify(code, TERSER_OPTIONS)).code || code;
    case 'css': {
      const result = await postcss([cssnano({ preset: CSSNANO_PRESET })]).process(code, { from: undefined });
      return result.css;
    }
    case 'html':
      return await htmlMinifier.minify(code, HTML_MINIFIER_OPTIONS);
    case 'json':
      try {
        const obj = JSON.parse(code);
        return JSON.stringify(obj); // 去除所有空白
      } catch {
        return code; // 非标准JSON不处理
      }
    default:
      return code;
  }
}

/**
 * 对文本内容进行循环压缩直到收敛
 * @param {string} originalCode
 * @param {'js'|'css'|'html'|'json'} type
 * @returns {Promise<{compressed: string, saved: number}>}
 */
async function compressTextUntilConvergence(originalCode, type) {
  let best = originalCode;
  let bestSize = Buffer.byteLength(originalCode, 'utf8');
  let current = originalCode;

  for (let i = 0; i < MAX_LOOP; i++) {
    let next;
    try {
      next = await compressText(current, type);
    } catch {
      break; // 压缩出错，停止循环并保留上一次成功结果
    }
    const nextSize = Buffer.byteLength(next, 'utf8');
    if (nextSize < bestSize) {
      best = next;
      bestSize = nextSize;
      current = next; // 用更好的结果继续尝试
    } else {
      // 体积不再减小或变大，停止
      break;
    }
  }

  const originalSize = Buffer.byteLength(originalCode, 'utf8');
  return {
    compressed: best,
    saved: originalSize - bestSize,
  };
}

/**
 * 图片压缩（只执行一次）
 * @param {Buffer} inputBuffer
 * @param {string} ext 包括点的后缀，如 '.png'
 * @returns {Promise<Buffer>}
 */
async function compressImage(inputBuffer, ext) {
  const extLower = ext.toLowerCase();
  // SVG 单独处理
  if (extLower === '.svg') {
    const result = svgoOptimize(inputBuffer.toString('utf8'), { multipass: true });
    return Buffer.from(result.data, 'utf8');
  }

  // 使用 sharp 处理位图
  let pipeline = sharp(inputBuffer);

  switch (extLower) {
    case '.png':
      // 无损压缩：最高压缩等级 + 最大effort
      pipeline = pipeline.png({
        compressionLevel: 9,
        effort: 10,
        palette: false,      // 保持真彩色，无损
      });
      break;
    case '.jpg':
    case '.jpeg':
      // mozjpeg 高质量压缩，视觉无损
      pipeline = pipeline.jpeg({
        quality: 95,
        mozjpeg: true,
      });
      break;
    case '.webp':
      // 高质量有损，细节几乎不可见
      pipeline = pipeline.webp({
        quality: 95,
        lossless: false,
        effort: 6,
      });
      break;
    default:
      // 其他格式（如gif）不做处理，直接返回原始数据
      return inputBuffer;
  }

  return await pipeline.toBuffer();
}

// ================= 主流程 =================
async function main() {
  const targetDir = process.argv[2] || '.';
  const absoluteDir = path.resolve(targetDir);
  console.log(`🔍 扫描目录: ${absoluteDir}\n`);

  // 匹配所有需要处理的文件
  const patterns = [
    '**/*.js',
    '**/*.css',
    '**/*.html',
    '**/*.htm',
    '**/*.json',
    '**/*.png',
    '**/*.{jpg,jpeg}',
    '**/*.webp',
    '**/*.svg',
  ];
  const files = await glob(patterns, {
    cwd: absoluteDir,
    absolute: true,
    onlyFiles: true,
    ignore: ['**/node_modules/**'], // 忽略依赖目录
    caseSensitiveMatch: false,
  });

  console.log(`📦 发现 ${files.length} 个文件\n`);

  let totalOriginal = 0;
  let totalSaved = 0;
  let processed = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const relative = path.relative(absoluteDir, filePath);
    let originalContent;
    let isText = false;

    try {
      // 读取文件
      if (['.js', '.css', '.html', '.htm', '.json'].includes(ext)) {
        originalContent = await fs.readFile(filePath, 'utf8');
        isText = true;
      } else {
        originalContent = await fs.readFile(filePath); // Buffer
      }

      const originalSize = isText
        ? Buffer.byteLength(originalContent, 'utf8')
        : originalContent.length;

      if (originalSize === 0) {
        // 空文件跳过
        continue;
      }

      let compressedContent;
      let saved = 0;

      if (isText) {
        // 文本文件：循环压缩
        const typeMap = {
          '.js': 'js',
          '.css': 'css',
          '.html': 'html',
          '.htm': 'html',
          '.json': 'json',
        };
        const type = typeMap[ext];
        const result = await compressTextUntilConvergence(originalContent, type);
        compressedContent = result.compressed;
        saved = result.saved;
      } else {
        // 图片文件：单次压缩
        compressedContent = await compressImage(originalContent, ext);
        saved = originalSize - compressedContent.length;
      }

      // 只有真正缩小时才写回
      if (saved > 0) {
        // 原子写入：先写临时文件再重命名，防止中断损坏原文件
        const tmpPath = filePath + '.tmp_' + Date.now();
        await fs.writeFile(tmpPath, compressedContent);
        await fs.rename(tmpPath, filePath);
        totalOriginal += originalSize;
        totalSaved += saved;
        processed++;
        const percent = ((saved / originalSize) * 100).toFixed(1);
        console.log(`✅ ${relative}  ${originalSize} → ${originalSize - saved} (${percent}%)`);
      } else {
        console.log(`⏭️  ${relative}  已是最优或无法进一步压缩`);
      }
    } catch (err) {
      console.error(`❌ 处理 ${relative} 失败: ${err.message}`);
    }
  }

  console.log('\n=================================');
  console.log(`📊 总计压缩 ${processed} 个文件`);
  if (totalOriginal > 0) {
    const totalPercent = ((totalSaved / totalOriginal) * 100).toFixed(1);
    console.log(`💾 节省空间: ${(totalSaved / 1024).toFixed(1)} KB (${totalPercent}%)`);
  } else {
    console.log('💤 没有文件被压缩');
  }
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});