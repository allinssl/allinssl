// 如果你想自定义翻译处理
import { Scanner, Translator, TranslationQueue, FileManager } from "./i18n";

async function customTranslation() {
  const config = {
    scanDirs: ["src"], // 需要扫描的目录
    fileTypes: [".vue", ".tsx", ".jsx", ".ts", ".js"], // 支持的文件类型
    targetLanguages: ["en", "zh"], // 目标语言
    outputDir: "src/locales", // 输出目录
    glmConfig: {
      apiKey: "a160afdbea1644e68de5e5b014bea0f7.zZuSidvDSYOD7oJT", // 你的智谱 AI API 密钥
      apiEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions", // 可选，API 端点
    },
  };

  const scanner = new Scanner(config);
  const translator = new Translator(config);
  const queue = new TranslationQueue();
  const fileManager = new FileManager(config);

  // 自定义扫描和翻译逻辑
  const results = await scanner.scanFiles();
  // ... 处理翻译
  await fileManager.generateI18nFiles(queue.getAll());
}

customTranslation();
