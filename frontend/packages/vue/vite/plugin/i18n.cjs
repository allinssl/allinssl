const { Plugin } = require("vite");
const { glob } = require("glob");
const fs = require("node:fs/promises");
const path = require("node:path");

/**
 * 支持的语言类型列表
 * 每种语言包含：
 * - lang: 语言代码
 * - content: 语言名称
 */
const SUPPORTED_LANGUAGES = [
  { lang: "zh", content: "中文" },
  { lang: "zh-CN", content: "中文-繁体" },
  { lang: "en", content: "English" },
  { lang: "fr", content: "Français" },
  { lang: "de", content: "Deutsch" },
  { lang: "es", content: "Español" },
  { lang: "it", content: "Italiano" },
  { lang: "ja", content: "日本語" },
];

/**
 * 默认插件配置
 */
const defaultConfig = {
  scanDirs: ["src"],
  fileTypes: [".vue", ".tsx", ".jsx", ".ts", ".js"],
  targetLanguages: ["en", "zh"],
  outputDir: "src/locales",
  enableInDev: true,
};

/**
 * 扫描器类 - 负责扫描文件并提取需要翻译的文本
 */
class Scanner {
  constructor(config) {
    this.config = config;
  }

  /**
   * 扫描所有匹配的文件
   * @returns {Promise<Array>} 扫描结果数组
   */
  async scanFiles() {
    const results = [];

    // 遍历所有需要扫描的目录
    for (const dir of this.config.scanDirs) {
      // 构建 glob 模式，统一使用正斜杠
      const pattern = path.join(dir, "**/*").replace(/\\/g, "/");

      // 使用 glob 获取所有匹配的文件
      const files = await glob(pattern, {
        ignore: ["**/node_modules/**"],
        nodir: true,
        absolute: true,
      });

      // 过滤出指定类型的文件
      const matchedFiles = files.filter((file) => {
        const ext = path.extname(file);
        return this.config.fileTypes.includes(ext);
      });

      // 扫描每个匹配的文件
      for (const file of matchedFiles) {
        const result = await this.scanFile(file);
        if (result.matches.length > 0) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * 扫描单个文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件的扫描结果
   */
  async scanFile(filePath) {
    // 读取文件内容
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const matches = [];

    // 匹配 t("文本") 或 t('文本') 格式的国际化标记
    const pattern = /t\(['"](.+?)['"]\)/g;

    // 遍历每一行查找匹配
    lines.forEach((line, index) => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          content: match[1],
          line: index + 1,
          column: match.index,
        });
      }
    });

    return {
      filePath,
      matches,
    };
  }
}

/**
 * 翻译器类
 */
class Translator {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.batchSize = 10; // 批量翻译大小
  }

  async translate(text, targetLang) {
    const langCache = this.cache.get(text);
    if (langCache?.has(targetLang)) {
      return langCache.get(targetLang);
    }

    let translatedText;

    if (this.config.customTranslator) {
      translatedText = await this.config.customTranslator(text, targetLang);
    } else {
      const results = await this.translateWithGLM([text], targetLang);
      translatedText = results[0];
    }

    if (!this.cache.has(text)) {
      this.cache.set(text, new Map());
    }
    this.cache.get(text).set(targetLang, translatedText);

    return translatedText;
  }

  async translateWithGLM(texts, targetLang) {
    // 检查 API 密钥是否配置
    if (!this.config.glmConfig?.apiKey) {
      throw new Error("GLM API key is required for translation");
    }

    // 获取 API 端点，如果未配置则使用默认端点
    const endpoint =
      this.config.glmConfig.apiEndpoint ||
      "https://open.bigmodel.cn/api/paas/v4/chat/completions";

    try {
      // 生成翻译提示词
      const prompt = this.generateTranslationPrompt(texts, targetLang);

      // 调用智谱 AI 的 API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.glmConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4-flash",
          messages: [
            {
              role: "system",
              content:
                "你是一个专业的翻译助手，请将用户提供的文本准确翻译成目标语言。保持专业性和准确性，同时确保翻译后的文本通顺易懂。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          top_p: 0.7,
          response_format: { type: "json" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const translatedContent = JSON.parse(result.choices[0].message.content);
      return translatedContent.translations;
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  generateTranslationPrompt(texts, targetLang) {
    return `请将以下文本翻译成${targetLang}语言。请以JSON格式返回，格式为：{"translations": ["翻译1", "翻译2", ...]}

源文本：
${texts.map((text, index) => `${index + 1}. ${text}`).join("\n")}

要求：
1. 保持专业性和准确性
2. 确保翻译后的文本通顺易懂
3. 严格按照JSON格式返回
4. 保持原文的语气和风格
5. 专业术语使用对应语言的标准翻译`;
  }

  async translateBatch(texts, targetLang) {
    const results = [];
    const uncachedTexts = [];

    texts.forEach((text, index) => {
      const langCache = this.cache.get(text);
      if (langCache?.has(targetLang)) {
        results[index] = {
          text,
          targetLang,
          translatedText: langCache.get(targetLang),
        };
      } else {
        uncachedTexts.push({ text, index });
      }
    });

    if (uncachedTexts.length > 0) {
      for (let i = 0; i < uncachedTexts.length; i += this.batchSize) {
        const batch = uncachedTexts.slice(i, i + this.batchSize);
        const batchTexts = batch.map((item) => item.text);

        let translatedTexts;
        if (this.config.customTranslator) {
          translatedTexts = await Promise.all(
            batchTexts.map((text) =>
              this.config.customTranslator(text, targetLang),
            ),
          );
        } else {
          translatedTexts = await this.translateWithGLM(batchTexts, targetLang);
        }

        batch.forEach((item, batchIndex) => {
          const translatedText = translatedTexts[batchIndex];

          if (!this.cache.has(item.text)) {
            this.cache.set(item.text, new Map());
          }
          this.cache.get(item.text).set(targetLang, translatedText);

          results[item.index] = {
            text: item.text,
            targetLang,
            translatedText,
          };
        });
      }
    }

    return results;
  }
}

/**
 * 翻译队列类 - 管理翻译任务的队列
 */
class TranslationQueue {
  constructor() {
    this.queue = new Map();
    this.processed = new Set();
  }

  add(item) {
    const key = this.generateKey(item);
    if (!this.queue.has(key)) {
      this.queue.set(key, item);
    }
  }

  getUnprocessed() {
    return Array.from(this.queue.values()).filter(
      (item) => !this.processed.has(this.generateKey(item)),
    );
  }

  markAsProcessed(item) {
    this.processed.add(this.generateKey(item));
  }

  exists(item) {
    return this.queue.has(this.generateKey(item));
  }

  getAll() {
    return Array.from(this.queue.values());
  }

  clear() {
    this.queue.clear();
    this.processed.clear();
  }

  generateKey(item) {
    return `${item.path}:${item.content}`;
  }

  generateI18nId(item) {
    const dir = path.dirname(item.path);
    const components = dir.split(path.sep).filter(Boolean);
    const lastComponent = components[components.length - 1] || "root";
    const queueArray = Array.from(this.queue.values());
    const index = queueArray.findIndex((i) => i.path === item.path);
    return `${lastComponent}.${index >= 0 ? index : 0}`;
  }
}

/**
 * 文件管理器类 - 负责生成和管理国际化文件
 */
class FileManager {
  constructor(config) {
    this.config = config;
    this.contentCache = {};
  }

  async generateI18nFiles(translations) {
    const i18nContent = {};

    for (const item of translations) {
      i18nContent[item.i18n] = item.lang;
    }

    await this.loadExistingContent();
    Object.assign(this.contentCache, i18nContent);

    for (const lang of this.config.targetLanguages) {
      const langContent = {};

      for (const [key, translations] of Object.entries(this.contentCache)) {
        if (translations[lang]) {
          langContent[key] = translations[lang];
        }
      }

      await this.writeLanguageFile(lang, langContent);
    }

    await this.generateTypeDefinition();
  }

  async loadExistingContent() {
    for (const lang of this.config.targetLanguages) {
      const filePath = path.join(this.config.outputDir, `${lang}.json`);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const langContent = JSON.parse(content);

        for (const [key, value] of Object.entries(langContent)) {
          if (!this.contentCache[key]) {
            this.contentCache[key] = {};
          }
          this.contentCache[key][lang] = value;
        }
      } catch (error) {
        continue;
      }
    }
  }

  async writeLanguageFile(lang, content) {
    const outputDir = this.config.outputDir;
    await fs.mkdir(outputDir, { recursive: true });

    const filePath = path.join(outputDir, `${lang}.json`);
    await fs.writeFile(filePath, JSON.stringify(content, null, 2));
  }

  async generateTypeDefinition() {
    const keys = Object.keys(this.contentCache);

    const typeContent = `// This file is auto-generated. DO NOT EDIT.
export type I18nKey = ${keys.map((key) => `'${key}'`).join(" | ")}

export interface I18nMessages {
    [key in I18nKey]: string
}
`;
    const typePath = path.join(this.config.outputDir, "i18n-types.ts");
    await fs.writeFile(typePath, typeContent);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

function validateConfig(options) {
  const config = { ...defaultConfig, ...options };

  if (!Array.isArray(config.scanDirs) || config.scanDirs.length === 0) {
    throw new Error("scanDirs must be a non-empty array");
  }

  if (!Array.isArray(config.fileTypes) || config.fileTypes.length === 0) {
    throw new Error("fileTypes must be a non-empty array");
  }

  if (
    !Array.isArray(config.targetLanguages) ||
    config.targetLanguages.length === 0
  ) {
    throw new Error("targetLanguages must be a non-empty array");
  }

  if (!config.outputDir) {
    throw new Error("outputDir is required");
  }

  return config;
}

/**
 * 直接处理国际化翻译
 * @param {Object} options - 国际化插件配置
 * @returns {Promise<void>}
 */
async function processI18n(options = {}) {
  const config = validateConfig(options);
  const scanner = new Scanner(config);
  const translator = new Translator(config);
  const queue = new TranslationQueue();
  const fileManager = new FileManager(config);

  console.log("Starting i18n scanning...");

  try {
    const scanResults = await scanner.scanFiles();

    for (const result of scanResults) {
      for (const match of result.matches) {
        queue.add({
          path: result.filePath,
          i18n: queue.generateI18nId({
            path: result.filePath,
            content: match.content,
            i18n: "",
            lang: {},
          }),
          content: match.content,
          lang: {},
        });
      }
    }

    const unprocessed = queue.getUnprocessed();
    const total = unprocessed.length * config.targetLanguages.length;
    let processed = 0;

    for (const item of unprocessed) {
      for (const targetLang of config.targetLanguages) {
        const translatedText = await translator.translate(
          item.content,
          targetLang,
        );
        item.lang[targetLang] = translatedText;
        processed++;
        console.log(
          `Processing translations: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`,
        );
      }
      queue.markAsProcessed(item);
    }

    await fileManager.generateI18nFiles(queue.getAll());
    console.log("I18n processing completed successfully");
  } catch (error) {
    console.error("Error in i18n processing:", error);
    throw error;
  }
}

/**
 * Vite 插件主函数
 * @param {Object} options - 插件配置选项
 * @returns {Object} Vite 插件对象
 */
function viteI18nPlugin(options = {}) {
  const config = validateConfig(options);
  const scanner = new Scanner(config);
  const translator = new Translator(config);
  const queue = new TranslationQueue();
  const fileManager = new FileManager(config);

  return {
    name: "vite-plugin-i18n-auto",

    async configResolved() {
      console.log("Starting i18n scanning...");

      try {
        const scanResults = await scanner.scanFiles();

        for (const result of scanResults) {
          for (const match of result.matches) {
            queue.add({
              path: result.filePath,
              i18n: queue.generateI18nId({
                path: result.filePath,
                content: match.content,
                i18n: "",
                lang: {},
              }),
              content: match.content,
              lang: {},
            });
          }
        }

        const unprocessed = queue.getUnprocessed();
        for (const item of unprocessed) {
          for (const targetLang of config.targetLanguages) {
            const translatedText = await translator.translate(
              item.content,
              targetLang,
            );
            item.lang[targetLang] = translatedText;
          }
          queue.markAsProcessed(item);
        }

        await fileManager.generateI18nFiles(queue.getAll());
        console.log("I18n processing completed successfully");
      } catch (error) {
        console.error("Error in i18n plugin:", error);
      }
    },

    configureServer(server) {
      if (!config.enableInDev) return;

      console.log("I18n plugin server configured");

      server.watcher.on("change", async (filePath) => {
        const ext = filePath.split(".").pop();
        if (!ext || !config.fileTypes.includes(`.${ext}`)) return;

        try {
          const scanResult = await scanner.scanFile(filePath);
          let hasChanges = false;

          for (const match of scanResult.matches) {
            const item = {
              path: filePath,
              i18n: queue.generateI18nId({
                path: filePath,
                content: match.content,
                i18n: "",
                lang: {},
              }),
              content: match.content,
              lang: {},
            };

            if (!queue.exists(item)) {
              hasChanges = true;
              queue.add(item);

              for (const targetLang of config.targetLanguages) {
                const translatedText = await translator.translate(
                  item.content,
                  targetLang,
                );
                item.lang[targetLang] = translatedText;
              }
              queue.markAsProcessed(item);
            }
          }

          if (hasChanges) {
            await fileManager.generateI18nFiles(queue.getAll());
            console.log(`Updated i18n files for changes in ${filePath}`);
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      });
    },
  };
}

module.exports = {
  SUPPORTED_LANGUAGES,
  Scanner,
  Translator,
  TranslationQueue,
  FileManager,
  processI18n,
  viteI18nPlugin,
};
